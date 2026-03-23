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

function inferirTagAI(texto, indice, total) {
    const normalizado = String(texto || '').toLowerCase().trim();

    // 1) Respeita cabeçalhos explícitos quando o modelo os fornece.
    if (normalizado.startsWith('resumo executivo:')) {
        return { classe: 'ai-tag--resumo', label: 'Resumo Executivo', tooltip: 'Visão geral e conclusões principais da análise' };
    }

    if (normalizado.startsWith('base matemática:') || normalizado.startsWith('base matematica:')) {
        return { classe: 'ai-tag--matematica', label: 'Base Matemática', tooltip: 'Cálculos, fórmulas e dados técnicos utilizados' };
    }

    if (normalizado.startsWith('recomendação prática:') || normalizado.startsWith('recomendacao pratica:')) {
        return { classe: 'ai-tag--recomendacao', label: 'Recomendação Prática', tooltip: 'Sugestões e melhor caminho para a decisão' };
    }

    // 2) Inferência por conteúdo para tornar os blocos mais informativos.
    const temResumo = /(resumo|vis[aã]o geral|em s[íi]ntese|conclus[aã]o geral|panorama)/.test(normalizado);
    if (temResumo) {
        return { classe: 'ai-tag--resumo', label: 'Resumo Executivo', tooltip: 'Visão geral e conclusões principais da análise' };
    }

    const temRecomendacao = /(recomend|suger|indicaç|estrat[ée]gia|melhor op[cç][aã]o|decis[aã]o|vale a pena|deve)/.test(normalizado);
    if (temRecomendacao) {
        return { classe: 'ai-tag--recomendacao', label: 'Recomendação Prática', tooltip: 'Sugestões e melhor caminho para a decisão' };
    }

    const temRiscoCenario = /(risco|aten[cç][aã]o|volatil|incerteza|cen[aá]rio|sensibilidade|varia[cç][aã]o)/.test(normalizado);
    if (temRiscoCenario) {
        return { classe: 'ai-tag--cenarios', label: 'Cenários e Sensibilidades', tooltip: 'Variações, riscos e impactos em diferentes contextos' };
    }

    const temBaseTecnica = /(iof|spread|vet|c[aâ]mbio|taxa|custo|percentual|f[oó]rmula|matem[aá]tica|c[aá]lculo|diferen[cç]a|economia)/.test(normalizado);
    if (temBaseTecnica) {
        return { classe: 'ai-tag--matematica', label: 'Base Matemática', tooltip: 'Cálculos, fórmulas e dados técnicos utilizados' };
    }

    // 3) Fallback por posição para evitar repetição cega de rótulos.
    if (indice === 0) {
        return { classe: 'ai-tag--resumo', label: 'Resumo Executivo', tooltip: 'Visão geral e conclusões principais da análise' };
    }

    if (indice === total - 1) {
        return { classe: 'ai-tag--recomendacao', label: 'Recomendação Prática', tooltip: 'Sugestões e melhor caminho para a decisão' };
    }

    return { classe: 'ai-tag--tecnica', label: 'Análise Técnica', tooltip: 'Aprofundamento técnico e análise detalhada dos números' };
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

    return paragrafos.map((paragrafo, indice) => {
        const htmlParagrafo = markdownBasico(paragrafo).replace(/\n/g, '<br>');
        const tag = inferirTagAI(paragrafo, indice, paragrafos.length);
        const tooltipEscapado = escaparAtributoHtml(tag.tooltip);
        const labelEscapado = escaparAtributoHtml(tag.label);

        return `
            <div class="ai-bloco">
                <span class="ai-tag ${tag.classe}" data-tooltip='${tag.tooltip}' title='${tag.tooltip}'>${labelEscapado}</span>
                <p class="ai-paragrafo">${htmlParagrafo}</p>
            </div>
        `;
    }).join('');
}

function sanitizarTrechoErro(texto) {
    return String(texto || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
}

async function lerRespostaOraculo(response) {
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    const rawBody = await response.text();

    let payload = null;
    if (contentType.includes('application/json')) {
        try {
            payload = rawBody ? JSON.parse(rawBody) : {};
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        const retryAfterHeader = Number.parseInt(String(response.headers.get('retry-after') || ''), 10);
        const retryAfterPayload = Number(payload?.retry_after_seconds);
        const retryAfter = Number.isFinite(retryAfterPayload) && retryAfterPayload > 0
            ? retryAfterPayload
            : (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : null);

        if (response.status === 429) {
            const err = new Error(retryAfter
                ? `Limite temporário do Oráculo atingido. Tente novamente em ${retryAfter}s.`
                : 'Limite temporário do Oráculo atingido. Tente novamente em instantes.');
            err.code = String(payload?.code || 'RATE_LIMITED');
            err.retryAfterSeconds = retryAfter;
            throw err;
        }

        const erroApi = payload?.erro || payload?.error;
        if (erroApi) throw new Error(String(erroApi));

        const trecho = sanitizarTrechoErro(rawBody);
        throw new Error(trecho
            ? `Falha ao consultar o Oráculo (HTTP ${response.status}): ${trecho}`
            : `Falha ao consultar o Oráculo (HTTP ${response.status}).`);
    }

    if (!contentType.includes('application/json') || !payload || typeof payload !== 'object') {
        throw new Error('Resposta inválida do Oráculo (formato inesperado).');
    }

    return payload;
}

async function fetchAnaliseOraculo(payloadGlobalParaIA, cacheKey) {
    const response = await fetch('/api/oraculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadGlobalParaIA)
    });

    const data = await lerRespostaOraculo(response);

    if (typeof data.analise !== 'string') {
        throw new Error('Resposta inválida do Oráculo: campo de análise ausente.');
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
