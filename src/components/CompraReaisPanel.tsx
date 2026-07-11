/*
 * Copyright © 2026 LCV Ideas & Software
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   CompraReaisPanel — Modo "compra internacional cobrada em reais" (DCC)
   Mostra os 3 cenários possíveis e o diagnóstico reverso da fatura.
   ==================================================================== */

import { fmt } from '../services/formatting.ts';
import type { CenarioReais, CompraEmReaisAnalise } from '../types/api.ts';

interface Props {
  analise: CompraEmReaisAnalise;
  valorReais: number;
}

const CENARIO_META: Record<string, { titulo: string; icon: string }> = {
  adquirencia_local: { titulo: 'Adquirência local (doméstica)', icon: '🇧🇷' },
  dcc_pura: { titulo: 'DCC pura (só IOF)', icon: '🏷️' },
  dupla_conversao: { titulo: 'Dupla conversão (spread + IOF)', icon: '🔁' },
};

function pctNum(v: number): string {
  return `${fmt(v)}%`;
}

function CenarioCard({ chave, cenario, destaque }: { chave: string; cenario: CenarioReais; destaque: boolean }) {
  const meta = CENARIO_META[chave];
  return (
    <div
      className="glass-card rounded-2xl p-4"
      style={{
        background: destaque ? 'rgba(234,88,12,0.08)' : 'rgba(51,65,85,0.04)',
        outline: destaque ? '2px solid rgba(234,88,12,0.5)' : 'none',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{meta?.icon}</span>
        <h4 className="text-sm font-bold text-slate-700">{meta?.titulo}</h4>
        {destaque && (
          <span className="ml-auto text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            provável
          </span>
        )}
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-500">Total em Reais</span>
        <span className="text-lg font-extrabold text-slate-900">R$ {fmt(cenario.total_brl)}</span>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Acréscimo sobre o preço</span>
        <span className="font-semibold text-slate-700">
          + R$ {fmt(cenario.custo_adicional_brl)} ({pctNum(cenario.custo_adicional_percent)})
        </span>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 leading-snug">{cenario.descricao}</p>
    </div>
  );
}

export default function CompraReaisPanel({ analise, valorReais }: Props) {
  const provavel = analise.diagnostico?.cenario_provavel ?? null;
  const ordem: Array<keyof CompraEmReaisAnalise['cenarios']> = ['adquirencia_local', 'dcc_pura', 'dupla_conversao'];

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.05)' }}>
        <h3 className="text-base font-bold text-slate-800 mb-1">🇧🇷 Compra internacional cobrada em reais</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Preço no checkout: <strong>R$ {fmt(valorReais)}</strong>. Quando um lojista estrangeiro cobra em BRL, o custo
          final depende de como a transação foi liquidada. Veja os três cenários possíveis:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ordem.map((chave) => (
          <CenarioCard key={chave} chave={chave} cenario={analise.cenarios[chave]} destaque={provavel === chave} />
        ))}
      </div>

      {analise.diagnostico && (
        <div className="glass-card rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.05)' }}>
          <h4 className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wider">🔎 Diagnóstico da fatura</h4>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Valor na fatura</span>
            <span className="font-semibold text-slate-800">R$ {fmt(analise.diagnostico.valor_fatura_brl)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-500">Acréscimo medido</span>
            <span className="font-semibold text-slate-800">{pctNum(analise.diagnostico.markup_implicito_percent)}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-snug">{analise.diagnostico.explicacao}</p>
        </div>
      )}

      <div className="rounded-2xl p-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 leading-snug">
        💡 <strong>Dica anti-DCC:</strong> em maquininhas e sites que oferecem cobrar em reais, geralmente é mais barato
        escolher pagar na moeda do lojista (USD/EUR) — o markup da conversão dinâmica costuma superar o spread do seu
        emissor. Exceção: quando o pagamento em BRL é processado por adquirente local (Pix, boleto, EBANX/dLocal), aí a
        compra vira doméstica, sem IOF nem spread.
      </div>
    </div>
  );
}
