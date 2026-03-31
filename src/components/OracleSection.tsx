/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   OracleSection — AI Analysis with cache + cooldown + refresh
   ==================================================================== */

import type { OraclePayload } from '../types/api.ts';
import type { UseOraculoReturn } from '../hooks/useOraculo.ts';

interface Props {
  oracle: UseOraculoReturn;
  payload: OraclePayload | null;
}

export default function OracleSection({ oracle, payload }: Props) {
  if (!payload) return null;

  const handleAnalyze = () => oracle.executar(payload, false);
  const handleRefresh = () => oracle.executar(payload, true);

  return (
    <div id="secao-oraculo" className="mt-6">
      {/* Trigger button */}
      {!oracle.html && !oracle.loading && (
        <button
          onClick={handleAnalyze}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            boxShadow: '0 8px 24px -6px rgba(124,58,237,0.35)',
          }}
        >
          🤖 Analisar Cenário com IA
        </button>
      )}

      {/* Loading skeleton */}
      {oracle.loading && (
        <div className="space-y-2 mt-4">
          <div className="ai-skeleton-block">
            <div className="ai-skeleton-line w-2/3 mb-2" />
            <div className="ai-skeleton-line w-full mb-2" />
            <div className="ai-skeleton-line w-5/6 mb-2" />
            <div className="ai-skeleton-line w-3/4" />
          </div>
          <div className="ai-skeleton-block">
            <div className="ai-skeleton-line w-1/2 mb-2" />
            <div className="ai-skeleton-line w-full mb-2" />
            <div className="ai-skeleton-line w-4/5" />
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            ⏳ Analisando cenário financeiro...
          </p>
        </div>
      )}

      {/* Error */}
      {oracle.error && (
        <div className="rounded-xl p-3 text-sm text-red-700 bg-red-50 border border-red-200 mt-4">
          ⚠️ {oracle.error}
        </div>
      )}

      {/* Result */}
      {oracle.html && !oracle.loading && (
        <div className="mt-4">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600">🤖 Análise IA</span>
              {oracle.fromCache && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                  📦 Cache
                </span>
              )}
              {oracle.expiresInMs != null && oracle.expiresInMs > 0 && (
                <span className="text-[10px] text-slate-400">
                  Expira em {Math.ceil(oracle.expiresInMs / 60000)}min
                </span>
              )}
            </div>

            {oracle.showRefresh && (
              <button
                onClick={handleRefresh}
                disabled={oracle.cooldownRemaining > 0}
                className="text-xs font-semibold px-3 py-1 rounded-lg transition-all duration-200"
                style={{
                  background: oracle.cooldownRemaining > 0 ? 'rgba(148,163,184,0.1)' : 'rgba(124,58,237,0.08)',
                  color: oracle.cooldownRemaining > 0 ? '#94a3b8' : '#7c3aed',
                  cursor: oracle.cooldownRemaining > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {oracle.cooldownRemaining > 0
                  ? `⏳ ${Math.ceil(oracle.cooldownRemaining / 1000)}s`
                  : '🔄 Atualizar sem cache'
                }
              </button>
            )}
          </div>

          {/* AI content */}
          <div
            className="markdown-ia glass-card rounded-2xl p-5"
            dangerouslySetInnerHTML={{ __html: oracle.html }}
          />
        </div>
      )}
    </div>
  );
}
