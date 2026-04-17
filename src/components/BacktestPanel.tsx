/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   BacktestPanel — Painel emerald com MAPE 7d + qualidade badge
   ==================================================================== */

import { pct } from '../services/formatting.ts';
import type { BacktestData } from '../types/api.ts';

interface Props {
  data: BacktestData;
}

const QUALITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  excelente: { bg: 'rgba(22,163,74,0.12)', text: '#15803d', label: '🏆 Excelente' },
  boa: { bg: 'rgba(234,179,8,0.12)', text: '#a16207', label: '✅ Boa' },
  atencao: { bg: 'rgba(220,38,38,0.12)', text: '#b91c1c', label: '⚠️ Atenção' },
};

export default function BacktestPanel({ data }: Props) {
  const q = data.qualidade ? QUALITY_STYLES[data.qualidade] : null;

  return (
    <div className="glass-card rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.04)' }}>
      <h4 className="text-xs font-bold text-emerald-600 mb-3 uppercase tracking-wider">🧪 Backtest (7 dias)</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">MAPE 7d</span>
          <span className="text-slate-800 font-semibold">{pct(data.mape_7d_percent)}</span>
        </div>

        {data.erro_percentual_atual != null && (
          <div className="flex justify-between">
            <span className="text-slate-500">Erro atual</span>
            <span className="text-slate-800 font-semibold">{pct(data.erro_percentual_atual)}</span>
          </div>
        )}

        {data.observacoes_7d != null && (
          <div className="flex justify-between">
            <span className="text-slate-500">Observações</span>
            <span className="text-slate-700">{data.observacoes_7d}</span>
          </div>
        )}

        {q && (
          <div className="mt-2 text-center">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: q.bg, color: q.text }}
            >
              {q.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
