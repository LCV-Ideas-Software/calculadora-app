/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — useOraculo Hook
   AI analysis state, cooldown, cache status
   ==================================================================== */

import { useState, useCallback, useRef } from 'react';
import type { OraclePayload, OracleResultMeta } from '../types/api.ts';
import { obterAnaliseOraculoComMeta } from '../services/oraculo.ts';

const COOLDOWN_MS = 30_000; // 30s entre requests live

export interface UseOraculoReturn {
  html: string | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  expiresInMs: number | null;
  cooldownRemaining: number;
  showRefresh: boolean;
  executar: (payload: OraclePayload, forceRefresh?: boolean) => Promise<void>;
}

export function useOraculo(): UseOraculoReturn {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<OracleResultMeta | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLiveCall = useRef<number>(0);

  const startCooldown = useCallback(() => {
    lastLiveCall.current = Date.now();
    setCooldownRemaining(COOLDOWN_MS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - lastLiveCall.current));
      setCooldownRemaining(remaining);
      if (remaining <= 0 && cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
        cooldownTimer.current = null;
      }
    }, 500);
  }, []);

  const executar = useCallback(async (payload: OraclePayload, forceRefresh = false) => {
    // Verify cooldown for live calls
    if (forceRefresh && cooldownRemaining > 0) {
      setError(`Aguarde ${Math.ceil(cooldownRemaining / 1000)}s antes de solicitar nova análise.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await obterAnaliseOraculoComMeta({ payload, forceRefresh });
      setHtml(result.html);
      setMeta(result);

      // Start cooldown only for live calls
      if (!result.fromCache) {
        startCooldown();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na análise IA.');
      setHtml(null);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [cooldownRemaining, startCooldown]);

  return {
    html,
    loading,
    error,
    fromCache: meta?.fromCache ?? false,
    expiresInMs: meta?.expiresInMs ?? null,
    cooldownRemaining,
    showRefresh: html !== null && !loading,
    executar,
  };
}
