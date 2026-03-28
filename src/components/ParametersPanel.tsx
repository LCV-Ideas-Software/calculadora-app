/* ====================================================================
   ParametersPanel — Painel slate com parâmetros vigentes
   ==================================================================== */

import type { ParametrosVigentes } from '../types/api.ts';
import { pct } from '../services/formatting.ts';

interface Props {
  params: ParametrosVigentes;
}

/**
 * Resolve o campo `origem` para uma string legível.
 * O backend pode retornar:
 *  - um objeto tipo { spread_cartao: 'd1', iof_cartao: 'custom', ... }
 *  - uma string simples
 *  - undefined
 */
function resolveOrigem(origem: ParametrosVigentes['origem']): string | null {
  if (!origem) return null;
  if (typeof origem === 'string') return origem;

  // Objeto → resumir como lista de fontes únicas
  const fontes = [...new Set(Object.values(origem))];
  if (fontes.length === 1) return fontes[0] === 'd1' ? 'Base D1' : fontes[0];
  return fontes.map(f => f === 'd1' ? 'D1' : f).join(' / ');
}

export default function ParametersPanel({ params }: Props) {
  const origemLabel = resolveOrigem(params.origem);

  return (
    <div className="glass-card rounded-2xl p-4" style={{ background: 'rgba(51,65,85,0.04)' }}>
      <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
        📋 Parâmetros Vigentes
      </h4>
      <div className="space-y-1.5 text-sm">
        <Row label="IOF Cartão" value={pct(params.iof_cartao)} />
        <Row label="Spread Cartão" value={pct(params.spread_cartao)} />
        {params.iof_global != null && <Row label="IOF Global" value={pct(params.iof_global)} />}
        <Row label="Spread Global ☀️" value={pct(params.spread_global_aberto)} />
        <Row label="Spread Global 🌙" value={pct(params.spread_global_fechado)} />
        {origemLabel && (
          <p className="text-[10px] text-slate-400 mt-2">Fonte: {origemLabel}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700 font-semibold">{value}</span>
    </div>
  );
}
