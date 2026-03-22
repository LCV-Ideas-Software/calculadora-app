import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularBandasSensibilidade } from '../sensibilidade.mjs';

test('sensibilidade retorna base/otimista/pessimista com monotonicidade esperada', () => {
    const bandas = calcularBandasSensibilidade({
        valorOriginal: 100,
        taxaCambio: 5,
        spread: 0.01,
        iof: 0.035
    });

    assert.ok(bandas);
    assert.ok(bandas.otimista.valor_total_brl < bandas.base.valor_total_brl);
    assert.ok(bandas.pessimista.valor_total_brl > bandas.base.valor_total_brl);
});

test('sensibilidade aplica piso em 0 para taxas negativas após delta', () => {
    const bandas = calcularBandasSensibilidade({
        valorOriginal: 100,
        taxaCambio: 5,
        spread: 0.001,
        iof: 0.001
    });

    assert.ok(bandas);
    assert.equal(bandas.otimista.spread, 0);
    assert.equal(bandas.otimista.iof, 0);
});
