import { expect, it } from 'vitest';
import { calcularErroPercentual, calcularMape, classificarMapePercent } from '../backtest.mjs';

it('calcularErroPercentual retorna erro absoluto relativo', () => {
    const erro = calcularErroPercentual(5.1, 5.0);
    expect(erro).toBe(0.02);
});

it('calcularErroPercentual retorna null com observado inválido', () => {
    const erro = calcularErroPercentual(5.1, 0);
    expect(erro).toBeNull();
});

it('calcularMape calcula média dos erros válidos', () => {
    const mape = calcularMape([0.01, 0.03, 0.02]);
    expect(mape).toBe(0.02);
});

it('calcularMape ignora valores inválidos e retorna null sem base', () => {
    expect(calcularMape([null, undefined, NaN])).toBeNull();
});

it('classificarMapePercent respeita faixas padrão', () => {
    expect(classificarMapePercent(0.8)).toBe('excelente');
    expect(classificarMapePercent(1.4)).toBe('boa');
    expect(classificarMapePercent(2.6)).toBe('atencao');
});

it('classificarMapePercent respeita faixas customizadas', () => {
    expect(classificarMapePercent(1.4, 1.5, 2.5)).toBe('excelente');
    expect(classificarMapePercent(2.0, 1.5, 2.5)).toBe('boa');
    expect(classificarMapePercent(3.0, 1.5, 2.5)).toBe('atencao');
});
