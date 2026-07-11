import { afterEach, expect, it, vi } from 'vitest';
import { onRequestPost } from '../calcular.js';
import { createD1Stub } from './helpers/d1-stub.mjs';

afterEach(() => {
  vi.unstubAllGlobals();
});

// PTAX servida pelo cache D1 → nenhuma chamada de rede necessária.
function envComPtax(taxa) {
  return {
    BIGDATA_DB: createD1Stub([
      { match: (s) => /FROM calc_ptax_cache/i.test(s), first: () => ({ valor_ptax: taxa }) },
    ]),
  };
}

function req(payload, origin = 'https://calc.lcv.app.br') {
  return new Request('https://calc.lcv.app.br/api/calcular', {
    method: 'POST',
    headers: origin ? { Origin: origin, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

it('rejeita origem não permitida com 403', async () => {
  vi.stubGlobal('fetch', () => {
    throw new Error('não deveria chamar rede');
  });
  const res = await onRequestPost({ request: req({ valor_original: 100 }, 'https://evil.com'), env: envComPtax(5) });
  expect(res.status).toBe(403);
});

it('retorna 400 para payload sem valor', async () => {
  vi.stubGlobal('fetch', () => {
    throw new Error('não deveria chamar rede');
  });
  const res = await onRequestPost({ request: req({ data_compra: '2026-07-08', moeda: 'USD' }), env: envComPtax(5) });
  expect(res.status).toBe(400);
});

it('calcula o motor Cartão: base → spread → IOF → total → VET', async () => {
  vi.stubGlobal('fetch', () => {
    throw new Error('não deveria chamar rede (cache D1 cobre a cotação)');
  });
  const res = await onRequestPost({
    request: req({ data_compra: '2026-07-08', moeda: 'USD', valor_original: 100 }),
    env: envComPtax(5),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  // 100×5 = 500; spread 5,5% = 27,50; base+spread = 527,50; IOF 3,5% = 18,46; total = 545,96
  expect(body.cartao.base_brl).toBe(500);
  expect(body.cartao.valor_spread).toBe(27.5);
  expect(body.cartao.valor_iof).toBe(18.46);
  expect(body.cartao.valor_total_brl).toBe(545.96);
  expect(body.cartao.vet).toBe(5.459625);
});

it('modo cobrado em reais retorna cenários sem tocar em cotação', async () => {
  vi.stubGlobal('fetch', () => {
    throw new Error('não deveria chamar rede no modo reais');
  });
  const res = await onRequestPost({
    request: req({ valor_original: 100, cobrado_em_reais: true, valor_fatura_brl: 103.5 }),
    env: envComPtax(5),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.cobrado_em_reais).toBe(true);
  expect(body.compra_em_reais.cenarios.dcc_pura.total_brl).toBe(103.5);
  expect(body.compra_em_reais.diagnostico.cenario_provavel).toBe('dcc_pura');
});
