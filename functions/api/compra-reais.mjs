/**
 * Análise de compra internacional cobrada em REAIS.
 *
 * Quando um lojista estrangeiro precifica em BRL, o custo final depende de qual
 * mecânica de liquidação ocorreu — a calculadora clássica (moeda×PTAX+spread+IOF)
 * não modela nenhuma delas. Três cenários possíveis, a partir do preço em reais
 * exibido no checkout (valorReais):
 *
 *  - adquirencia_local: transação DOMÉSTICA (MoR/adquirente brasileiro, ex.
 *    EBANX/dLocal/BoaCompra). Sem IOF e sem spread → custo = valorReais.
 *  - dcc_pura: o lojista/adquirente já converteu para BRL com markup próprio
 *    embutido; o emissor brasileiro não faz conversão, só cobra IOF sobre o BRL.
 *  - dupla_conversao: "BRL de vitrine" liquidado em moeda estrangeira; a bandeira
 *    converte BRL→moeda e o emissor reconverte com spread próprio + IOF.
 *
 * Base legal do IOF: Decreto 6.306/2007, art. 15-B, VII (redação do Decreto
 * 12.499/2025) — o critério é o domicílio/liquidação do lojista no exterior, não
 * a moeda do checkout; base de cálculo = montante em reais (art. 14).
 */

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * @param {object} params
 * @param {number} params.valorReais - preço em BRL exibido/cobrado no checkout
 * @param {number} params.iof - alíquota de IOF (fração, ex. 0.035)
 * @param {number} params.spreadCartao - spread do emissor (fração, ex. 0.055)
 * @param {number} [params.valorFaturaBrl] - valor efetivamente cobrado na fatura
 */
export function analisarCompraEmReais({ valorReais, iof, spreadCartao, valorFaturaBrl }) {
  if (!Number.isFinite(valorReais) || valorReais <= 0) {
    throw new Error('valorReais deve ser um número positivo.');
  }

  const totalDcc = round2(valorReais * (1 + iof));
  const totalDupla = round2(valorReais * (1 + spreadCartao) * (1 + iof));

  const cenarios = {
    adquirencia_local: {
      total_brl: round2(valorReais),
      custo_adicional_brl: 0,
      custo_adicional_percent: 0,
      descricao:
        'Transação doméstica (adquirente/MoR brasileiro, ex. EBANX/dLocal/BoaCompra). Sem IOF e sem spread.',
    },
    dcc_pura: {
      total_brl: totalDcc,
      custo_adicional_brl: round2(totalDcc - valorReais),
      custo_adicional_percent: round2(iof * 100),
      descricao:
        'O lojista converteu para BRL com markup próprio embutido; o emissor cobra apenas IOF sobre o valor em reais.',
    },
    dupla_conversao: {
      total_brl: totalDupla,
      custo_adicional_brl: round2(totalDupla - valorReais),
      custo_adicional_percent: round2(((1 + spreadCartao) * (1 + iof) - 1) * 100),
      descricao:
        'Preço em BRL de vitrine liquidado em moeda estrangeira: a bandeira converte BRL→moeda e o emissor reconverte com spread próprio + IOF.',
    },
  };

  let diagnostico = null;
  if (Number.isFinite(valorFaturaBrl) && valorFaturaBrl > 0) {
    const markup = valorFaturaBrl / valorReais - 1;
    const markupPercent = round2(markup * 100);
    const alvoDcc = iof;
    const alvoDupla = (1 + spreadCartao) * (1 + iof) - 1;
    const TOL = 0.005; // ±0,5 ponto percentual

    let cenario = 'indeterminado';
    if (Math.abs(markup) <= TOL) cenario = 'adquirencia_local';
    else if (Math.abs(markup - alvoDcc) <= TOL) cenario = 'dcc_pura';
    else if (Math.abs(markup - alvoDupla) <= TOL) cenario = 'dupla_conversao';

    diagnostico = {
      valor_fatura_brl: round2(valorFaturaBrl),
      markup_implicito_percent: markupPercent,
      cenario_provavel: cenario,
      explicacao:
        cenario === 'indeterminado'
          ? 'O acréscimo não bate com nenhum cenário conhecido — pode haver tarifa fixa de transação internacional, markup de DCC do lojista embutido, ou alíquota/data de conversão diferente.'
          : cenarios[cenario].descricao,
    };
  }

  return { cenarios, diagnostico };
}
