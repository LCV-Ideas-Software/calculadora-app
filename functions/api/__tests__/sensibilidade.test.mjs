import { expect, it } from 'vitest';
import { calcularBandasSensibilidade } from '../sensibilidade.mjs';

it('sensibilidade retorna base/otimista/pessimista com monotonicidade esperada', () => {
    const bandas = calcularBandasSensibilidade({
        valorOriginal: 100,
        taxaCambio: 5,
        spread: 0.01,
        iof: 0.035
    });

    expect(bandas).toBeTruthy();
    expect(bandas.otimista.valor_total_brl).toBeLessThan(bandas.base.valor_total_brl);
    expect(bandas.pessimista.valor_total_brl).toBeGreaterThan(bandas.base.valor_total_brl);
});

it('sensibilidade aplica piso em 0 para taxas negativas após delta', () => {
    const bandas = calcularBandasSensibilidade({
        valorOriginal: 100,
        taxaCambio: 5,
        spread: 0.001,
        iof: 0.001
    });

    expect(bandas).toBeTruthy();
    expect(bandas.otimista.spread).toBe(0);
    expect(bandas.otimista.iof).toBe(0);
});
