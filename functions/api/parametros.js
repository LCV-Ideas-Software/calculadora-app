export async function onRequestGet(context) {
    const { env } = context;
    const headers = { "Content-Type": "application/json" };

    try {
        // Horário de Brasília (UTC-3)
        const agora = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
        const hora = agora.getUTCHours();
        const minuto = String(agora.getUTCMinutes()).padStart(2, '0');
        const diaSemana = agora.getUTCDay(); // 0=dom, 6=sáb
        const dataBrasilISO = `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, '0')}-${String(agora.getUTCDate()).padStart(2, '0')}`;

        // Mercado aberto: seg-sex, 10h-17h (aprox.)
        const is_plantao = diaSemana === 0 || diaSemana === 6 || hora < 10 || hora >= 17;

        // Verificar feriados (lista básica)
        const feriados2026 = [
            '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03',
            '2026-04-21', '2026-05-01', '2026-06-04', '2026-09-07',
            '2026-10-12', '2026-11-02', '2026-11-15', '2026-12-25'
        ];
        const is_feriado = feriados2026.includes(dataBrasilISO);

        // Parâmetros padrão
        let parametros = {
            iof_cartao: 0.035,
            iof_global: 0.035,
            spread_cartao: 0.055,
            spread_global_aberto: 0.0078,
            spread_global_fechado: 0.0118,
            fator_calibragem_global: 0.99934
        };

        const origem = {};

        // Tentar carregar parâmetros customizados do D1
        try {
            const rows = await env.DB.prepare("SELECT chave, valor FROM parametros_customizados ORDER BY id DESC").all();
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

        const spread_global_aplicado = (is_plantao || is_feriado)
            ? parametros.spread_global_fechado
            : parametros.spread_global_aberto;

        return new Response(JSON.stringify({
            contexto_operacional: {
                hora,
                minuto,
                diaSemana,
                dataBrasilISO,
                is_feriado,
                is_plantao: is_plantao || is_feriado
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
