function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function markdownBasico(texto) {
    return texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function detectarClasseTagAI(texto) {
    const normalizado = texto.toLowerCase();
    if (normalizado.startsWith('resumo executivo:')) return 'ai-tag--resumo';
    if (normalizado.startsWith('base matemática:') || normalizado.startsWith('base matematica:')) return 'ai-tag--base';
    if (normalizado.startsWith('recomendação prática:') || normalizado.startsWith('recomendacao pratica:')) return 'ai-tag--recomendacao';
    return 'ai-tag--base';
}

const ORACULO_CACHE_TTL_MS = 10 * 60 * 1000;
const ORACULO_CACHE_MAX_ENTRIES = 12;
const ORACULO_CACHE_STORAGE_KEY = 'itau-calculadora:oraculo-cache:v1';

const memoryCache = new Map();
const pendingRequests = new Map();

let persistedCacheLoaded = false;

function stableStringify(value) {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    }

    if (value && typeof value === 'object') {
        const keys = Object.keys(value).sort();
        return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }

    return JSON.stringify(value);
}

function pruneCache() {
    const now = Date.now();

    for (const [key, entry] of memoryCache.entries()) {
        if (!entry?.html || !Number.isFinite(entry.savedAt) || (now - entry.savedAt) > ORACULO_CACHE_TTL_MS) {
            memoryCache.delete(key);
        }
    }

    while (memoryCache.size > ORACULO_CACHE_MAX_ENTRIES) {
        const oldestKey = memoryCache.keys().next().value;
        if (!oldestKey) break;
        memoryCache.delete(oldestKey);
    }
}

function persistCache() {
    try {
        const entries = [...memoryCache.entries()].map(([key, entry]) => ({
            key,
            html: entry.html,
            savedAt: entry.savedAt
        }));

        sessionStorage.setItem(ORACULO_CACHE_STORAGE_KEY, JSON.stringify({ entries }));
    } catch {
        // Persistência é opcional; falhas não devem quebrar a UX.
    }
}

function ensurePersistedCacheLoaded() {
    if (persistedCacheLoaded) return;
    persistedCacheLoaded = true;

    try {
        const raw = sessionStorage.getItem(ORACULO_CACHE_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];

        entries.forEach((entry) => {
            if (entry?.key && entry?.html && Number.isFinite(entry?.savedAt)) {
                memoryCache.set(entry.key, { html: entry.html, savedAt: entry.savedAt });
            }
        });

        pruneCache();
        persistCache();
    } catch {
        // Se sessionStorage estiver indisponível/corrompido, seguimos só com cache em memória.
    }
}

function getCacheKey(payloadGlobalParaIA) {
    return stableStringify(payloadGlobalParaIA);
}

function getCachedEntry(cacheKey) {
    ensurePersistedCacheLoaded();
    pruneCache();

    const entry = memoryCache.get(cacheKey);
    if (!entry) return null;

    memoryCache.delete(cacheKey);
    memoryCache.set(cacheKey, entry);

    return entry;
}

function saveCachedHtml(cacheKey, html) {
    ensurePersistedCacheLoaded();
    const entry = { html, savedAt: Date.now() };
    memoryCache.set(cacheKey, entry);
    pruneCache();
    persistCache();
    return entry;
}

function getCacheMeta(savedAt) {
    const ageMs = Math.max(0, Date.now() - savedAt);
    const expiresInMs = Math.max(0, ORACULO_CACHE_TTL_MS - ageMs);

    return {
        cachedAt: savedAt,
        ttlMs: ORACULO_CACHE_TTL_MS,
        ageMs,
        expiresInMs
    };
}

export function formatarAnaliseIA(textoBruto) {
    const textoSeguro = escaparHtml(textoBruto || 'Análise concluída sem retorno de texto.');
    const paragrafos = textoSeguro
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

    if (!paragrafos.length) {
        return '<div class="ai-bloco"><p class="ai-paragrafo">Análise concluída sem retorno de texto.</p></div>';
    }

    return paragrafos.map((paragrafo) => {
        const htmlParagrafo = markdownBasico(paragrafo).replace(/\n/g, '<br>');
        const classeTag = detectarClasseTagAI(paragrafo);

        return `
            <div class="ai-bloco">
                <span class="ai-tag ${classeTag}">${classeTag === 'ai-tag--resumo' ? 'Resumo Executivo' : classeTag === 'ai-tag--recomendacao' ? 'Recomendação Prática' : 'Base Matemática'}</span>
                <p class="ai-paragrafo">${htmlParagrafo}</p>
            </div>
        `;
    }).join('');
}

async function fetchAnaliseOraculo(payloadGlobalParaIA, cacheKey) {
    const response = await fetch('/api/oraculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadGlobalParaIA)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.erro || 'Falha ao consultar o Oráculo.');
    }

    const html = formatarAnaliseIA(data.analise);
    const entry = saveCachedHtml(cacheKey, html);
    return { html, fromCache: false, ...getCacheMeta(entry.savedAt) };
}

async function obterAnaliseOraculoDetalhada(payloadGlobalParaIA, options = {}) {
    const { forceRefresh = false } = options;
    const cacheKey = getCacheKey(payloadGlobalParaIA);
    const cachedEntry = forceRefresh ? null : getCachedEntry(cacheKey);
    if (cachedEntry) {
        return { html: cachedEntry.html, fromCache: true, ...getCacheMeta(cachedEntry.savedAt) };
    }

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
    }

    const requestPromise = fetchAnaliseOraculo(payloadGlobalParaIA, cacheKey)
        .finally(() => pendingRequests.delete(cacheKey));

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
}

export async function obterAnaliseOraculo(payloadGlobalParaIA) {
    const result = await obterAnaliseOraculoDetalhada(payloadGlobalParaIA);
    return result.html;
}

export async function obterAnaliseOraculoComMeta(payloadGlobalParaIA, options = {}) {
    return obterAnaliseOraculoDetalhada(payloadGlobalParaIA, options);
}

export async function prewarmOraculo(payloadGlobalParaIA) {
    await obterAnaliseOraculoDetalhada(payloadGlobalParaIA);
}
