/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   SensitivityPanel — Painel indigo com otimista/base/pessimista
   ==================================================================== */

import { fmt } from '../services/formatting.ts';
import type { SensibilidadeData } from '../types/api.ts';

interface Props {
  data: SensibilidadeData;
}

export default function SensitivityPanel({ data }: Props) {
  const band = data.cartao ?? data.global;
  if (!band) return null;

  return (
    <div className="glass-card rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.04)' }}>
      <h4 className="text-xs font-bold text-indigo-500 mb-3 uppercase tracking-wider">📊 Análise de Sensibilidade</h4>
      <div className="space-y-2 text-sm">
        <BandRow emoji="🟢" label="Otimista" total={band.otimista.valor_total_brl} vet={band.otimista.vet} />
        <BandRow emoji="🟡" label="Base" total={band.base.valor_total_brl} vet={band.base.vet} />
        <BandRow emoji="🔴" label="Pessimista" total={band.pessimista.valor_total_brl} vet={band.pessimista.vet} />
      </div>
    </div>
  );
}

function BandRow({ emoji, label, total, vet }: { emoji: string; label: string; total: number; vet: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">
        {emoji} {label}
      </span>
      <div className="text-right">
        <span className="text-slate-800 font-semibold">R$ {fmt(total)}</span>
        <span className="text-[10px] text-slate-400 ml-1">(VET {fmt(vet)})</span>
      </div>
    </div>
  );
}
