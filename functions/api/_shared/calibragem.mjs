export const FATOR_CALIBRAGEM_GLOBAL_PADRAO = 0.99934;

export function fatorCalibragemValido(valor) {
  return Number.isFinite(valor) && valor > 0;
}

export function resolverFatorCalibragemGlobal(valorD1, valorAmbiente) {
  if (fatorCalibragemValido(valorD1)) return valorD1;
  if (fatorCalibragemValido(valorAmbiente)) return valorAmbiente;
  return FATOR_CALIBRAGEM_GLOBAL_PADRAO;
}
