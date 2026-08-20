import { getOperationalContext } from './contexto-operacional.mjs';
import {
    FATOR_CALIBRAGEM_GLOBAL_PADRAO,
    fatorCalibragemValido,
    resolverFatorCalibragemGlobal
} from './_shared/calibragem.mjs';

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
            fator_calibragem_global: FATOR_CALIBRAGEM_GLOBAL_PADRAO,
            backtest_mape_boa_percent: 1.0,
            backtest_mape_atencao_percent: 2.0
        };

        const origem = {};
        let calibragemD1;

        // Tentar carregar parâmetros customizados do D1
        try {
            const rows = await env.BIGDATA_DB.prepare("SELECT chave, valor FROM calc_parametros_customizados ORDER BY id DESC").all();
            if (rows.results && rows.results.length > 0) {
                for (const row of rows.results) {
                    const val = parseFloat(row.valor);
                    if (row.chave === 'fator_calibragem_global') {
                        if (Number.isFinite(val) && calibragemD1 === undefined) calibragemD1 = val;
                        continue;
                    }
                    if (Number.isFinite(val)) {
                        parametros[row.chave] = val;
                        origem[`taxa_${row.chave}`] = 'd1';
                    }
                }
            }
        } catch (e) {
            // tabela pode não existir, usar defaults
        }

        const calibragemEnv = parseFloat(env.FATOR_CALIBRAGEM_GLOBAL);
        parametros.fator_calibragem_global = resolverFatorCalibragemGlobal(calibragemD1, calibragemEnv);
        if (fatorCalibragemValido(calibragemD1)) origem.taxa_fator_calibragem_global = 'd1';

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
