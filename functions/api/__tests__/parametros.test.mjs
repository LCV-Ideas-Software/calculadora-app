import { expect, it } from 'vitest';
import { onRequestGet } from '../parametros.js';
import { createD1Stub } from './helpers/d1-stub.mjs';

function envComParametros(parametros = [], bindings = {}) {
  return {
    ...bindings,
    BIGDATA_DB: createD1Stub([
      {
        match: (sql) => /FROM calc_parametros_customizados/i.test(sql),
        all: () => ({ results: parametros }),
      },
    ]),
  };
}

it.each([0, -0.5])('ignora calibragem D1 não positiva (%s) e usa o ambiente positivo', async (invalidFactor) => {
  const res = await onRequestGet({
    env: envComParametros(
      [{ chave: 'fator_calibragem_global', valor: String(invalidFactor) }],
      { FATOR_CALIBRAGEM_GLOBAL: '0.98' },
    ),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.parametros_vigentes.fator_calibragem_global).toBe(0.98);
  expect(body.parametros_vigentes.origem).not.toHaveProperty('taxa_fator_calibragem_global');
});

it.each([0, -0.5])('usa o default quando a calibragem do ambiente não é positiva (%s)', async (invalidFactor) => {
  const res = await onRequestGet({
    env: envComParametros([], { FATOR_CALIBRAGEM_GLOBAL: String(invalidFactor) }),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.parametros_vigentes.fator_calibragem_global).toBe(0.99934);
  expect(body.parametros_vigentes.origem).not.toHaveProperty('taxa_fator_calibragem_global');
});

it('preserva calibragem D1 positiva com precedência sobre o ambiente', async () => {
  const res = await onRequestGet({
    env: envComParametros(
      [{ chave: 'fator_calibragem_global', valor: '0.97' }],
      { FATOR_CALIBRAGEM_GLOBAL: '0.98' },
    ),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.parametros_vigentes.fator_calibragem_global).toBe(0.97);
  expect(body.parametros_vigentes.origem.taxa_fator_calibragem_global).toBe('d1');
  expect(body.parametros_vigentes.origem).not.toHaveProperty('fator_calibragem_global');
});
