/* ====================================================================
   ResultPanel — Grid responsivo com ComparisonCards + painéis info
   ==================================================================== */

import type { SimulationResponse } from '../types/api.ts';
import ComparisonCard from './ComparisonCard.tsx';
import ParametersPanel from './ParametersPanel.tsx';
import SensitivityPanel from './SensitivityPanel.tsx';
import BacktestPanel from './BacktestPanel.tsx';
import { isCurrencySupported } from '../services/formatting.ts';

interface Props {
  result: SimulationResponse;
  melhorOpcao: string | null;
}

export default function ResultPanel({ result, melhorOpcao }: Props) {
  const hasGlobal = result.global?.suportada;
  const hasSaldo = result.global_saldo_existente?.suportada;
  const isExotic = !isCurrencySupported(result.moeda);

  // Grid: 1 col (exotic), 2 col (cartão+global), 3 col (todas)
  const gridCols = isExotic ? 1 : hasSaldo ? 3 : hasGlobal ? 2 : 1;
  const gridClass = gridCols === 3
    ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
    : gridCols === 2
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : 'max-w-lg mx-auto';

  const winnerKey = melhorOpcao?.includes('Cartão') ? 'cartao'
    : melhorOpcao?.includes('Saldo') ? 'saldo'
    : melhorOpcao?.includes('Global') ? 'global'
    : null;

  return (
    <div id="resultados" className="space-y-5 mt-6">
      {/* Exotic warning */}
      {isExotic && (
        <div className="rounded-xl p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 text-center">
          ⚠️ Moeda <strong>{result.moeda}</strong> — apenas Cartão de Crédito disponível. Conta Global não suportada pelo Itaú para esta moeda.
        </div>
      )}

      {/* Comparison cards */}
      <div className={gridClass}>
        {result.cartao?.suportada && (
          <ComparisonCard
            variant="cartao"
            channel={result.cartao}
            moeda={result.moeda}
            isWinner={winnerKey === 'cartao'}
          />
        )}
        {hasGlobal && result.global && (
          <ComparisonCard
            variant="global"
            channel={result.global}
            moeda={result.moeda}
            isWinner={winnerKey === 'global'}
          />
        )}
        {hasSaldo && result.global_saldo_existente && (
          <ComparisonCard
            variant="saldo"
            channel={result.global_saldo_existente}
            moeda={result.moeda}
            isWinner={winnerKey === 'saldo'}
          />
        )}
      </div>

      {/* Melhor opção badge */}
      {melhorOpcao && (
        <div className="text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-green-50 text-green-800 text-sm font-bold border border-green-200">
            ✅ {melhorOpcao}
          </span>
        </div>
      )}

      {/* Info panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.parametros_vigentes && (
          <ParametersPanel params={result.parametros_vigentes} />
        )}
        {result.sensibilidade && (
          <SensitivityPanel data={result.sensibilidade} />
        )}
        {result.backtest && (
          <BacktestPanel data={result.backtest} />
        )}
      </div>
    </div>
  );
}
