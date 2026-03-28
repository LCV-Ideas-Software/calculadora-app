/* ====================================================================
   SimulationForm — 10 campos de input com masking + validation
   ==================================================================== */

import { useMemo, useCallback } from 'react';
import type { SimulationFormState } from '../hooks/useSimulation.ts';

interface Props {
  form: SimulationFormState;
  setField: (field: keyof SimulationFormState, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

/** Gera lista de moedas com Intl.DisplayNames */
function useCurrencyList(): { code: string; label: string }[] {
  return useMemo(() => {
    const primary = ['USD', 'EUR', 'GBP'];
    const all = new Set<string>();

    // Descobrir moedas válidas via Intl
    const dn = new Intl.DisplayNames(['pt-BR'], { type: 'currency' });
    const candidates = [
      'JPY','CHF','CAD','AUD','NZD','SEK','NOK','DKK','PLN','CZK','HUF','RON','BGN','HRK',
      'TRY','RUB','UAH','CNY','KRW','INR','THB','TWD','SGD','HKD','MYR','PHP','IDR','VND',
      'PKR','BDT','LKR','ILS','SAR','AED','QAR','KWD','BHD','OMR','JOD','EGP','NGN','KES',
      'GHS','MAD','ZAR','ARS','CLP','COP','MXN','PEN','UYU','PYG','BOB','FJD',
    ];
    for (const c of candidates) {
      try { dn.of(c); all.add(c); } catch { /* skip */ }
    }

    const primaryItems = primary.map(code => ({
      code,
      label: `${code} — ${dn.of(code) || code}`,
    }));

    const rest = [...all]
      .filter(c => !primary.includes(c))
      .sort()
      .map(code => ({
        code,
        label: `${code} — ${dn.of(code) || code}`,
      }));

    return [...primaryItems, ...rest];
  }, []);
}

/**
 * Máscara monetária pt-BR para o campo "Valor".
 * Reproduz o comportamento original do monolítico:
 *   - remove tudo que não é dígito
 *   - interpreta como centavos (int / 100)
 *   - formata com `toLocaleString('pt-BR')` → "1.000,00"
 *   - armazena o valor raw no state como string formatada
 */
function applyCurrencyMask(rawInput: string): string {
  const digitsOnly = rawInput.replace(/\D/g, '');
  if (!digitsOnly) return '';
  const floatValue = parseInt(digitsOnly, 10) / 100;
  return floatValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SimulationForm({ form, setField, onSubmit, loading, error }: Props) {
  const currencies = useCurrencyList();
  const isExotic = !['USD', 'EUR', 'GBP'].includes(form.moeda);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSubmit();
  };

  /** Handler de máscara monetária — aplica a formatação em cada keystroke */
  const handleValorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setField('valorOriginal', applyCurrencyMask(e.target.value));
  }, [setField]);

  return (
    <div className="space-y-3" onKeyDown={handleKeyDown}>
      {/* Row 1: Moeda + Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="field-box">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            💱 Moeda estrangeira
          </label>
          <select
            id="moeda"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm text-slate-800"
            value={form.moeda}
            onChange={e => setField('moeda', e.target.value)}
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field-box">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            📅 Data da compra
          </label>
          <input
            id="dataCompra"
            type="date"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm text-slate-800"
            value={form.dataCompra}
            onChange={e => setField('dataCompra', e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Valor + VET Saldo */}
      <div className={`grid grid-cols-1 ${!isExotic ? 'sm:grid-cols-2' : ''} gap-3`}>
        <div className="field-box">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            💵 Valor em {form.moeda}
          </label>
          <input
            id="valorOriginal"
            type="text"
            inputMode="decimal"
            placeholder="1.000,00"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm text-slate-800"
            value={form.valorOriginal}
            onChange={handleValorChange}
          />
        </div>

        {!isExotic && (
          <div className="field-box">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              💰 VET saldo existente (R$)
            </label>
            <p className="text-[10px] text-slate-400 mb-1">Opcional — VET da compra anterior</p>
            <input
              id="vetSaldo"
              type="text"
              inputMode="decimal"
              placeholder="5,7340"
              className="glass-input w-full rounded-lg px-3 py-2 text-sm text-slate-800"
              value={form.vetSaldoExistente}
              onChange={e => setField('vetSaldoExistente', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Collapsible: Personalizar Parâmetros */}
      <details className="field-box">
        <summary className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
          ⚙️ Personalizar parâmetros (opcional)
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Spread Cartão (%)</label>
            <input
              type="text" inputMode="decimal" placeholder="Auto"
              className="glass-input w-full rounded-lg px-3 py-1.5 text-sm"
              value={form.spreadPercent}
              onChange={e => setField('spreadPercent', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">IOF Cartão (%)</label>
            <input
              type="text" inputMode="decimal" placeholder="Auto"
              className="glass-input w-full rounded-lg px-3 py-1.5 text-sm"
              value={form.iofPercent}
              onChange={e => setField('iofPercent', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Spread Global Aberto (%)</label>
            <input
              type="text" inputMode="decimal" placeholder="Auto"
              className="glass-input w-full rounded-lg px-3 py-1.5 text-sm"
              value={form.globalSpreadAberto}
              onChange={e => setField('globalSpreadAberto', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Spread Global Fechado (%)</label>
            <input
              type="text" inputMode="decimal" placeholder="Auto"
              className="glass-input w-full rounded-lg px-3 py-1.5 text-sm"
              value={form.globalSpreadFechado}
              onChange={e => setField('globalSpreadFechado', e.target.value)}
            />
          </div>
        </div>
      </details>

      {/* Submit */}
      <button
        id="btnCalcular"
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-300"
        style={{
          background: loading
            ? '#94a3b8'
            : 'linear-gradient(135deg, #ea580c, #f97316)',
          boxShadow: loading
            ? 'none'
            : '0 8px 24px -6px rgba(234,88,12,0.4)',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳ Calculando...' : '🔍 Comparar Opções'}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-3 text-sm text-red-700 bg-red-50 border border-red-200">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
