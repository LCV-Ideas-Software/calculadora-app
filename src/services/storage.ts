/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — Storage Service
   Gerenciamento de histórico e telemetria em localStorage
   ==================================================================== */

import type { AiHistoryEntry, AiTelemetry } from '../types/api.ts';

const MAX_HISTORY = 50;

/* ------- AI History ------- */

// Em compliance com as diretivas do projeto: "NADA EM LOCALSTORAGE"
// Em breve este sistema será consumido diretamente do D1 ou API externa via Worker nativo.
let memoryHistory: AiHistoryEntry[] = [];

export function getAiHistory(): AiHistoryEntry[] {
  return [...memoryHistory];
}

export function saveAiHistory(entries: AiHistoryEntry[]): void {
  memoryHistory = entries.slice(0, MAX_HISTORY);
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

let memoryTelemetry: AiTelemetry = { ...EMPTY_TELEMETRY };

export function getAiTelemetry(): AiTelemetry {
  return { ...memoryTelemetry };
}

export function saveAiTelemetry(t: AiTelemetry): void {
  memoryTelemetry = { ...t };
}

export function updateAiTelemetry(durationMs: number, fromCache: boolean, isError: boolean): void {
  const t = getAiTelemetry();
  t.total++;
  if (isError) {
    t.errors++;
  } else if (fromCache) {
    t.cacheHits++;
  } else {
    t.liveHits++;
  }
  t.lastMs = durationMs;
  t.avgMs = Math.round((t.avgMs * (t.total - 1) + durationMs) / t.total);
  t.updatedAt = Date.now();
  saveAiTelemetry(t);
}
