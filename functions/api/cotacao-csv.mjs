/**
 * Extrai a Taxa Venda de uma moeda do CSV de fechamento do Bacen.
 * Layout: Data;CodMoeda;Tipo(A/B);Sigla;TaxaCompra;TaxaVenda;ParidadeCompra;ParidadeVenda
 * A sigla fica na coluna 3 e a Taxa Venda na coluna 5.
 * @returns {number|null} Taxa Venda em BRL, ou null se não encontrada.
 */
export function parseCotacaoVendaCsv(text, moeda) {
  if (!text) return null;
  for (const line of text.split('\n')) {
    const columns = line.split(';');
    if (columns.length >= 6 && columns[3].trim() === moeda) {
      const venda = parseFloat(columns[5].trim().replace(',', '.'));
      return Number.isFinite(venda) ? venda : null;
    }
  }
  return null;
}
