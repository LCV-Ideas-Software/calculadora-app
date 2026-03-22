import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularErroPercentual, calcularMape, classificarMapePercent } from '../backtest.mjs';

test('calcularErroPercentual retorna erro absoluto relativo', () => {
    const erro = calcularErroPercentual(5.1, 5.0);
    assert.equal(erro, 0.02);
});

test('calcularErroPercentual retorna null com observado inválido', () => {
    const erro = calcularErroPercentual(5.1, 0);
    assert.equal(erro, null);
});

test('calcularMape calcula média dos erros válidos', () => {
    const mape = calcularMape([0.01, 0.03, 0.02]);
    assert.equal(mape, 0.02);
});

test('calcularMape ignora valores inválidos e retorna null sem base', () => {
    assert.equal(calcularMape([null, undefined, NaN]), null);
});

test('classificarMapePercent respeita faixas padrão', () => {
    assert.equal(classificarMapePercent(0.8), 'excelente');
    assert.equal(classificarMapePercent(1.4), 'boa');
    assert.equal(classificarMapePercent(2.6), 'atencao');
});

test('classificarMapePercent respeita faixas customizadas', () => {
    assert.equal(classificarMapePercent(1.4, 1.5, 2.5), 'excelente');
    assert.equal(classificarMapePercent(2.0, 1.5, 2.5), 'boa');
    assert.equal(classificarMapePercent(3.0, 1.5, 2.5), 'atencao');
});
