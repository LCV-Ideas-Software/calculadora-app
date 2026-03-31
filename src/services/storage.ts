/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — Storage Service
   Gerenciamento de histórico e telemetria em localStorage
   ==================================================================== */

import type { AiHistoryEntry, AiTelemetry } from '../types/api.ts';

const PREFIX = 'calculadora-app:';
const HISTORY_KEY = `${PREFIX}ai-history`;
const TELEMETRY_KEY = `${PREFIX}ai-telemetry`;
const MAX_HISTORY = 50;

/* ------- AI History ------- */

export function getAiHistory(): AiHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAiHistory(entries: AiHistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

export function addAiHistoryEntry(entry: AiHistoryEntry): void {
  const list = getAiHistory();
  list.unshift(entry);
  saveAiHistory(list);
}

/* ------- AI Telemetry ------- */

const EMPTY_TELEMETRY: AiTelemetry = {
  total: 0,
  cacheHits: 0,
  liveHits: 0,
  errors: 0,
  avgMs: 0,
  lastMs: 0,
  updatedAt: null,
};

export function getAiTelemetry(): AiTelemetry {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    return raw ? { ...EMPTY_TELEMETRY, ...JSON.parse(raw) } : { ...EMPTY_TELEMETRY };
  } catch {
    return { ...EMPTY_TELEMETRY };
  }
}

export function saveAiTelemetry(t: AiTelemetry): void {
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(t));
}

export function updateAiTelemetry(durationMs: number, fromCache: boolean, isError: boolean): void {
  const t = getAiTelemetry();
  t.total++;
  if (isError) { t.errors++; }
  else if (fromCache) { t.cacheHits++; }
  else { t.liveHits++; }
  t.lastMs = durationMs;
  t.avgMs = Math.round(((t.avgMs * (t.total - 1)) + durationMs) / t.total);
  t.updatedAt = Date.now();
  saveAiTelemetry(t);
}
