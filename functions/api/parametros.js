import { getOperationalContext } from './contexto-operacional.mjs';

export async function onRequestGet(context) {
    const { env } = context;
    const headers = { "Content-Type": "application/json" };

    try {
        const { hora, minuto, diaSemana, dataBrasilISO, is_feriado, is_plantao } = getOperationalContext(new Date());

        // Parâmetros padrão
        let parametros = {
            iof_cartao: 0.035,
            iof_global: 0.035,
            spread_cartao: 0.055,
            spread_global_aberto: 0.0078,
            spread_global_fechado: 0.0118,
            fator_calibragem_global: 0.99934,
            backtest_mape_boa_percent: 1.0,
            backtest_mape_atencao_percent: 2.0
        };

        const origem = {};

        // Tentar carregar parâmetros customizados do D1
        try {
            const rows = await env.BIGDATA_DB.prepare("SELECT chave, valor FROM itau_parametros_customizados ORDER BY id DESC").all();
            if (rows.results && rows.results.length > 0) {
                for (const row of rows.results) {
                    const val = parseFloat(row.valor);
                    if (Number.isFinite(val)) {
                        parametros[row.chave] = val;
                        origem[`taxa_${row.chave}`] = 'd1';
                    }
                }
            }
        } catch (e) {
            // tabela pode não existir, usar defaults
        }

        const spread_global_aplicado = is_plantao
            ? parametros.spread_global_fechado
            : parametros.spread_global_aberto;

        return new Response(JSON.stringify({
            contexto_operacional: {
                hora,
                minuto,
                diaSemana,
                dataBrasilISO,
                is_feriado,
                is_plantao
            },
            parametros_vigentes: {
                ...parametros,
                spread_global_aplicado,
                origem
            }
        }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Falha ao carregar parâmetros." }), { status: 500, headers });
    }
}
