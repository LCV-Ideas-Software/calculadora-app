const round = (num, casas = 6) => Number(Math.round(parseFloat(num + 'e' + casas)) + 'e-' + casas);

export function calcularErroPercentual(previsto, observado) {
    if (!Number.isFinite(previsto) || !Number.isFinite(observado) || observado <= 0) return null;
    return round(Math.abs((previsto - observado) / observado), 6);
}

export function calcularMape(errosPercentuais) {
    if (!Array.isArray(errosPercentuais) || errosPercentuais.length === 0) return null;
    const validos = errosPercentuais.filter((v) => Number.isFinite(v) && v >= 0);
    if (validos.length === 0) return null;
    const soma = validos.reduce((acc, v) => acc + v, 0);
    return round(soma / validos.length, 6);
}

export function classificarMapePercent(mapePercent, limiarBoa = 1, limiarAtencao = 2) {
    if (!Number.isFinite(mapePercent)) return null;
    if (mapePercent > limiarAtencao) return 'atencao';
    if (mapePercent > limiarBoa) return 'boa';
    return 'excelente';
}
