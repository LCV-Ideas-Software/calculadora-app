const DELTAS_PADRAO = {
    taxaCambio: 0.01,      // ±1.00%
    spread: 0.003,         // ±0.30 p.p.
    iof: 0.003             // ±0.30 p.p.
};

const round = (num, casas = 2) => Number(Math.round(parseFloat(num + 'e' + casas)) + 'e-' + casas);

function clampRate(rate) {
    return Math.max(0, rate);
}

function simularCusto(valorOriginal, taxaCambio, spread, iof) {
    const baseBrl = valorOriginal * taxaCambio;
    const valorSpread = baseBrl * spread;
    const baseComSpread = baseBrl + valorSpread;
    const valorIof = baseComSpread * iof;
    const valorTotalBrl = baseComSpread + valorIof;

    return {
        taxa_cambio: taxaCambio,
        spread,
        iof,
        base_brl: round(baseBrl),
        valor_spread: round(valorSpread),
        valor_iof: round(valorIof),
        valor_total_brl: round(valorTotalBrl),
        vet: round(valorTotalBrl / valorOriginal, 6)
    };
}

export function calcularBandasSensibilidade({ valorOriginal, taxaCambio, spread, iof }) {
    if (!Number.isFinite(valorOriginal) || valorOriginal <= 0) return null;
    if (![taxaCambio, spread, iof].every(Number.isFinite)) return null;

    const d = DELTAS_PADRAO;

    const otimista = simularCusto(
        valorOriginal,
        clampRate(taxaCambio * (1 - d.taxaCambio)),
        clampRate(spread - d.spread),
        clampRate(iof - d.iof)
    );

    const base = simularCusto(valorOriginal, taxaCambio, spread, iof);

    const pessimista = simularCusto(
        valorOriginal,
        clampRate(taxaCambio * (1 + d.taxaCambio)),
        clampRate(spread + d.spread),
        clampRate(iof + d.iof)
    );

    return {
        metodologia: {
            descricao: 'Bandas determinísticas de sensibilidade para decisão rápida',
            deltas: {
                taxa_cambio: d.taxaCambio,
                spread: d.spread,
                iof: d.iof
            }
        },
        otimista,
        base,
        pessimista
    };
}
