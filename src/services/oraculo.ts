/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — Oráculo (AI Analysis) Service
   Extração completa de public/js/oraculo-feature.js
   ==================================================================== */

import type { OraclePayload, OracleResultMeta } from '../types/api.ts';
import { postOraculoObservabilidade } from './api.ts';
import { addAiHistoryEntry, updateAiTelemetry } from './storage.ts';

const CACHE_KEY = 'calculadora-app:oraculo-cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

/* ------- Cache ------- */

interface CacheEntry {
  html: string;
  ts: number;
  payloadHash: string;
}

function hashPayload(p: OraclePayload): string {
  return JSON.stringify({
    m: p.transacao.moeda,
    v: p.transacao.valor_original,
    d: p.transacao.data_compra,
  });
}

function getCache(hash: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.payloadHash !== hash) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry;
  } catch { return null; }
}

function setCache(html: string, hash: string): void {
  const entry: CacheEntry = { html, ts: Date.now(), payloadHash: hash };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

/* ------- Markdown → HTML com tags semânticas ------- */

function markdownParaHtml(md: string): string {
  // Blocos de seção: ##, ###, #### → ai-bloco com ai-tag
  let html = md
    .replace(/####\s*(.+)/g, '<div class="ai-bloco"><span class="ai-tag ai-tag--tecnica" data-tooltip="Nota técnica do modelo">🔧 $1</span>')
    .replace(/###\s*(.+)/g, '<div class="ai-bloco"><span class="ai-tag ai-tag--cenarios" data-tooltip="Cenário projetado pelo modelo">🎯 $1</span>')
    .replace(/##\s*(.+)/g, '<div class="ai-bloco"><span class="ai-tag ai-tag--resumo" data-tooltip="Resumo executivo gerado por IA">📊 $1</span>');

  // Fechar blocos antes do próximo bloco ou no final
  const parts = html.split('<div class="ai-bloco">');
  if (parts.length > 1) {
    html = parts[0];
    for (let i = 1; i < parts.length; i++) {
      html += '<div class="ai-bloco">' + parts[i];
      if (i < parts.length - 1) html += '</div>';
    }
    html += '</div>';
  }

  // Inline formatting
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');

  // Paragrafos (linhas que não são tags HTML)
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return `<li>${trimmed.substring(2)}</li>`;
    }
    return `<p class="ai-paragrafo">${trimmed}</p>`;
  }).join('\n');

  // Agrupar <li> em <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`);

  // Tags semânticas por palavras-chave
  const tagMap: [RegExp, string, string, string][] = [
    [/\b(recomenda[çc][aã]o|sugest[aã]o|ideal|melhor op[çc][aã]o)\b/gi, 'recomendacao', '💡', 'Recomendação do modelo'],
    [/\b(base de c[aá]lculo|matem[aá]tica|f[oó]rmula)\b/gi, 'matematica', '📐', 'Base matemática'],
    [/\b(cen[aá]rio|proje[çc][aã]o|perspectiva)\b/gi, 'cenarios', '🔮', 'Projeção de cenário'],
  ];

  for (const [regex, cls, icon, tooltip] of tagMap) {
    html = html.replace(regex, match =>
      `<span class="ai-tag ai-tag--${cls}" data-tooltip="${tooltip}">${icon} ${match}</span>`
    );
  }

  return html;
}

/* ------- Public API ------- */

export interface OraculoOptions {
  payload: OraclePayload;
  forceRefresh?: boolean;
}

/**
 * Executa análise IA com cache sessionStorage.
 * Retorna HTML renderizado + metadados de cache.
 */
export async function obterAnaliseOraculoComMeta(opts: OraculoOptions): Promise<OracleResultMeta> {
  const { payload, forceRefresh = false } = opts;
  const hash = hashPayload(payload);
  const t0 = performance.now();

  // Verificar cache
  if (!forceRefresh) {
    const cached = getCache(hash);
    if (cached) {
      const ageMs = Date.now() - cached.ts;
      const ttlMs = CACHE_TTL_MS;
      updateAiTelemetry(performance.now() - t0, true, false);
      return {
        html: cached.html,
        fromCache: true,
        ttlMs,
        ageMs,
        expiresInMs: ttlMs - ageMs,
      };
    }
  }

  // Chamar backend
  const res = await fetch('/api/oraculo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const durationMs = performance.now() - t0;
    updateAiTelemetry(durationMs, false, true);
    throw new Error(`Erro IA: ${res.status} — ${errText || res.statusText}`);
  }

  const data = await res.json();
  const markdown: string = data.analise || data.analysis || data.result || '';
  const html = markdownParaHtml(markdown);
  const durationMs = performance.now() - t0;

  // Salvar cache
  setCache(html, hash);
  updateAiTelemetry(durationMs, false, false);

  // Telemetria backend (fire-and-forget)
  postOraculoObservabilidade({
    evento: 'analise_ia',
    duracao_ms: Math.round(durationMs),
    moeda: payload.transacao.moeda,
    valor: payload.transacao.valor_original,
    force_refresh: forceRefresh,
    timestamp: new Date().toISOString(),
  });

  // Histórico local
  addAiHistoryEntry({
    createdAt: Date.now(),
    fromCache: false,
    forceRefresh,
    moeda: payload.transacao.moeda,
    valorOriginal: payload.transacao.valor_original,
    preview: markdown.substring(0, 120),
  });

  return {
    html,
    fromCache: false,
    ttlMs: CACHE_TTL_MS,
    ageMs: 0,
    expiresInMs: CACHE_TTL_MS,
  };
}
