import { expect, it } from 'vitest';
import { parseCotacaoVendaCsv } from '../cotacao-csv.mjs';

// Layout real do CSV de fechamento do Bacen:
// Data;CodMoeda;Tipo(A/B);Sigla;TaxaCompra;TaxaVenda;ParidadeCompra;ParidadeVenda
const CSV = [
  '08/07/2026;741;A;MXN;0,29230000;0,29250000;17,62310000;17,63360000',
  '08/07/2026;978;B;ARS;0,00460000;0,00461000;1234,00000000;1235,00000000',
  '08/07/2026;790;A;GBP;7,40000000;7,41000000;1,35000000;1,35100000',
].join('\n');

it('extrai a Taxa Venda (coluna 5) pela sigla (coluna 3)', () => {
  expect(parseCotacaoVendaCsv(CSV, 'MXN')).toBe(0.2925);
});

it('funciona para moeda tipo B', () => {
  expect(parseCotacaoVendaCsv(CSV, 'ARS')).toBe(0.00461);
});

it('retorna null para moeda ausente', () => {
  expect(parseCotacaoVendaCsv(CSV, 'JPY')).toBeNull();
});

it('retorna null para CSV vazio', () => {
  expect(parseCotacaoVendaCsv('', 'USD')).toBeNull();
});
