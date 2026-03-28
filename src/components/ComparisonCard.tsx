/* ====================================================================
   ComparisonCard — Glassmorphism card for each channel result
   ==================================================================== */

import type { ChannelResult } from '../types/api.ts';
import { fmt, fmt4, pct, moedaParaSimbolo } from '../services/formatting.ts';

type Variant = 'cartao' | 'global' | 'saldo';

interface Props {
  variant: Variant;
  channel: ChannelResult;
  moeda: string;
  isWinner: boolean;
}

const LABELS: Record<Variant, { icon: string; title: string; gradient: string }> = {
  cartao: {
    icon: '💳',
    title: 'Cartão de Crédito',
    gradient: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(99,102,241,0.06))',
  },
  global: {
    icon: '🌐',
    title: 'Conta Global — Compra Agora',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(236,72,153,0.06))',
  },
  saldo: {
    icon: '💰',
    title: 'Conta Global — Saldo Existente',
    gradient: 'linear-gradient(135deg, rgba(22,163,74,0.06), rgba(34,197,94,0.06))',
  },
};

export default function ComparisonCard({ variant, channel, moeda, isWinner }: Props) {
  const { icon, title, gradient } = LABELS[variant];
  const simbolo = moedaParaSimbolo(moeda);

  if (!channel.suportada) return null;

  return (
    <div
      className="glass-card rounded-2xl p-5 relative"
      style={{
        background: gradient,
        boxShadow: isWinner
          ? '0 0 0 2px rgba(234,179,8,0.5), 0 12px 28px -8px rgba(234,179,8,0.15)'
          : '0 8px 24px -8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Winner badge */}
      {isWinner && (
        <div className="absolute -top-2.5 -right-2.5 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
          ⭐ MELHOR
        </div>
      )}

      {/* Header */}
      <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        {title}
      </h3>

      {/* Metrics */}
      <div className="space-y-2.5 text-sm">
        <Row label="Taxa utilizada" value={`R$ ${fmt4(channel.taxa_utilizada)}`} />
        <Row label="Fonte cotação" value={channel.fonte_cotacao} muted />
        <Row label="Spread" value={`${pct(channel.spread_aplicado)} (${simbolo} ${fmt(channel.valor_spread)})`} />
        <Row label="IOF" value={`${pct(channel.iof_aplicado)} (R$ ${fmt(channel.valor_iof)})`} />

        {/* Total — hero */}
        <div className="pt-2 mt-2 border-t border-slate-200/60">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-slate-600">Total em Reais</span>
            <span className="text-xl font-extrabold text-slate-900">
              R$ {fmt(channel.valor_total_brl)}
            </span>
          </div>
        </div>

        <Row label="VET" value={`R$ ${fmt4(channel.vet)}`} muted />

        {/* Indicadores extras */}
        {channel.is_plantao && (
          <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
            🌙 Plantão
          </span>
        )}
        {channel.usou_contingencia && (
          <span className="inline-block text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full ml-1">
            ⚡ Contingência
          </span>
        )}
        {variant === 'saldo' && channel.metodologia && (
          <p className="text-[10px] text-slate-400 mt-1">Metodologia: {channel.metodologia}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={muted ? 'text-slate-400 text-xs' : 'text-slate-800 font-semibold'}>
        {value}
      </span>
    </div>
  );
}
