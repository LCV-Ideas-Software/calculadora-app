import { afterEach, expect, it, vi } from 'vitest';
import { onRequestPost } from '../calcular.js';
import { createD1Stub } from './helpers/d1-stub.mjs';

afterEach(() => {
  vi.unstubAllGlobals();
});

// PTAX servida pelo cache D1 → nenhuma chamada de rede necessária.
function envComPtax(taxa, bindings = {}, parametros = []) {
  return {
    ...bindings,
    BIGDATA_DB: createD1Stub([
      {
        match: (s) => /FROM calc_parametros_customizados/i.test(s),
        all: () => ({ results: parametros }),
      },
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
  const fetchSpy = vi.fn(() => {
    throw new Error('não deveria chamar rede (cache D1 cobre a cotação)');
  });
  vi.stubGlobal('fetch', fetchSpy);
  const res = await onRequestPost({
    request: req({ data_compra: '2026-07-08', moeda: 'USD', valor_original: 100 }),
    env: envComPtax(5),
  });
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(res.status).toBe(200);
  const body = await res.json();
  // 100×5 = 500; spread 5,5% = 27,50; base+spread = 527,50; IOF 3,5% = 18,46; total = 545,96
  expect(body.cartao.base_brl).toBe(500);
  expect(body.cartao.valor_spread).toBe(27.5);
  expect(body.cartao.valor_iof).toBe(18.46);
  expect(body.cartao.valor_total_brl).toBe(545.96);
  expect(body.cartao.vet).toBe(5.459625);
});

it('prioriza limiares percentuais finitos do payload sobre o ambiente sem convertê-los em fração', async () => {
  vi.stubGlobal('fetch', () => {
    throw new Error('não deveria chamar rede (cache D1 cobre as cotações)');
  });
  const res = await onRequestPost({
    request: req({
      data_compra: '2026-07-08',
      moeda: 'USD',
      valor_original: 100,
      backtest_mape_boa_percent: 1.25,
      backtest_mape_atencao_percent: 2.75,
    }),
    env: envComPtax(5, {
      BACKTEST_MAPE_BOA_PERCENT: '7.5',
      BACKTEST_MAPE_ATENCAO_PERCENT: '8.5',
    }),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.parametros_vigentes.backtest_mape_boa_percent).toBe(1.25);
  expect(body.parametros_vigentes.backtest_mape_atencao_percent).toBe(2.75);
});

it('mantém precedência D1 sobre payload e ambiente nos limiares percentuais', async () => {
  vi.stubGlobal('fetch', () => {
    throw new Error('não deveria chamar rede (cache D1 cobre as cotações)');
  });
  const res = await onRequestPost({
    request: req({
      data_compra: '2026-07-08',
      moeda: 'USD',
      valor_original: 100,
      backtest_mape_boa_percent: 1.25,
      backtest_mape_atencao_percent: 2.75,
    }),
    env: envComPtax(
      5,
      {
        BACKTEST_MAPE_BOA_PERCENT: '7.5',
        BACKTEST_MAPE_ATENCAO_PERCENT: '8.5',
      },
      [
        { chave: 'backtest_mape_boa_percent', valor: '1.5' },
        { chave: 'backtest_mape_atencao_percent', valor: '3.0' },
      ],
    ),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.parametros_vigentes.backtest_mape_boa_percent).toBe(1.5);
  expect(body.parametros_vigentes.backtest_mape_atencao_percent).toBe(3);
});

it('usa ambiente válido e depois defaults para ambiente ausente ou inválido quando o payload não é finito', async () => {
  vi.stubGlobal('fetch', () => {
    throw new Error('não deveria chamar rede (cache D1 cobre as cotações)');
  });
  const payload = {
    data_compra: '2026-07-08',
    moeda: 'USD',
    valor_original: 100,
    backtest_mape_boa_percent: 'inválido',
    backtest_mape_atencao_percent: null,
  };

  const envResponse = await onRequestPost({
    request: req(payload),
    env: envComPtax(5, {
      BACKTEST_MAPE_BOA_PERCENT: '1.75',
      BACKTEST_MAPE_ATENCAO_PERCENT: '3.25',
    }),
  });
  const invalidEnvResponse = await onRequestPost({
    request: req(payload),
    env: envComPtax(5, {
      BACKTEST_MAPE_BOA_PERCENT: 'inválido',
      BACKTEST_MAPE_ATENCAO_PERCENT: 'NaN',
    }),
  });
  const defaultResponse = await onRequestPost({ request: req(payload), env: envComPtax(5) });

  expect(envResponse.status).toBe(200);
  expect(invalidEnvResponse.status).toBe(200);
  expect(defaultResponse.status).toBe(200);
  const envBody = await envResponse.json();
  const invalidEnvBody = await invalidEnvResponse.json();
  const defaultBody = await defaultResponse.json();
  expect(envBody.parametros_vigentes.backtest_mape_boa_percent).toBe(1.75);
  expect(envBody.parametros_vigentes.backtest_mape_atencao_percent).toBe(3.25);
  expect(invalidEnvBody.parametros_vigentes.backtest_mape_boa_percent).toBe(1);
  expect(invalidEnvBody.parametros_vigentes.backtest_mape_atencao_percent).toBe(2);
  expect(defaultBody.parametros_vigentes.backtest_mape_boa_percent).toBe(1);
  expect(defaultBody.parametros_vigentes.backtest_mape_atencao_percent).toBe(2);
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
