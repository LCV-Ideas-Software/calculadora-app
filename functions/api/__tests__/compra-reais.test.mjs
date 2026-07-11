import { expect, it } from 'vitest';
import { analisarCompraEmReais } from '../compra-reais.mjs';

const BASE = { valorReais: 100, iof: 0.035, spreadCartao: 0.055 };

it('cenário adquirência local: transação doméstica, sem IOF nem spread', () => {
  const r = analisarCompraEmReais(BASE);
  expect(r.cenarios.adquirencia_local.total_brl).toBe(100);
  expect(r.cenarios.adquirencia_local.custo_adicional_brl).toBe(0);
});

it('cenário DCC pura: só IOF sobre o valor em reais (sem spread do emissor)', () => {
  const r = analisarCompraEmReais(BASE);
  expect(r.cenarios.dcc_pura.total_brl).toBe(103.5);
  expect(r.cenarios.dcc_pura.custo_adicional_percent).toBe(3.5);
});

it('cenário dupla conversão: spread do emissor composto com IOF', () => {
  const r = analisarCompraEmReais(BASE);
  // 100 * 1.055 * 1.035 = 109.1925 → 109.19
  expect(r.cenarios.dupla_conversao.total_brl).toBe(109.19);
});

it('diagnóstico reverso classifica DCC pura quando a fatura ≈ valor+IOF', () => {
  const r = analisarCompraEmReais({ ...BASE, valorFaturaBrl: 103.5 });
  expect(r.diagnostico.markup_implicito_percent).toBe(3.5);
  expect(r.diagnostico.cenario_provavel).toBe('dcc_pura');
});

it('diagnóstico reverso classifica adquirência local quando fatura = valor', () => {
  const r = analisarCompraEmReais({ ...BASE, valorFaturaBrl: 100 });
  expect(r.diagnostico.cenario_provavel).toBe('adquirencia_local');
});

it('diagnóstico reverso classifica dupla conversão quando fatura ≈ valor×(1+spread)×(1+iof)', () => {
  const r = analisarCompraEmReais({ ...BASE, valorFaturaBrl: 109.19 });
  expect(r.diagnostico.cenario_provavel).toBe('dupla_conversao');
});

it('diagnóstico reverso retorna indeterminado fora das faixas conhecidas', () => {
  const r = analisarCompraEmReais({ ...BASE, valorFaturaBrl: 106 });
  expect(r.diagnostico.cenario_provavel).toBe('indeterminado');
});

it('sem valorFaturaBrl não há diagnóstico', () => {
  const r = analisarCompraEmReais(BASE);
  expect(r.diagnostico).toBeNull();
});

it('rejeita valorReais inválido', () => {
  expect(() => analisarCompraEmReais({ valorReais: 0, iof: 0.035, spreadCartao: 0.055 })).toThrow();
  expect(() => analisarCompraEmReais({ valorReais: -5, iof: 0.035, spreadCartao: 0.055 })).toThrow();
});
