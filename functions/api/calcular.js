export async function onRequestPost(context) {
    const defaultHeaders = { "Content-Type": "application/json" };
    try {
        const { request, env } = context;
        const payload = await request.json();

        const data_compra = payload.data_compra;
        const valor_original = payload.valor_original;
        const moeda = payload.moeda || 'USD';
        const vet_saldo_existente = payload.vet_saldo_existente || null;

        // Parâmetros customizáveis recebidos do frontend (em %)
        const spreadPercentInformado = payload.spread_percent;
        const iofPercentInformado = payload.iof_percent;
        const globalSpreadAbertoInformado = payload.global_spread_aberto_percent;
        const globalSpreadFechadoInformado = payload.global_spread_fechado_percent;

        if (!data_compra || !valor_original || !moeda) {
            return new Response(JSON.stringify({ erro: "Dados incompletos." }), { status: 400, headers: defaultHeaders });
        }

        // 🕰️ RELÓGIO MATEMÁTICO UNIVERSAL
        const agoraUTC = new Date();
        const brTime = new Date(agoraUTC.getTime() - (3 * 60 * 60 * 1000));
        const hora = brTime.getUTCHours();
        const minuto = String(brTime.getUTCMinutes()).padStart(2, '0');
        const diaSemana = brTime.getUTCDay();
        const ano = brTime.getUTCFullYear();
        const mes = String(brTime.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(brTime.getUTCDate()).padStart(2, '0');
        const dataBrasilISO = `${ano}-${mes}-${dia}`;
        const mesDia = `${mes}-${dia}`;

        const feriadosFixos = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
        const is_feriado = feriadosFixos.includes(mesDia);
        const is_plantao = (diaSemana === 0 || diaSemana === 6 || is_feriado || hora < 9 || hora >= 17);

        const arredondar = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

        // ═══════════════════════════════════════════════════
        // 📊 CARREGAR PARÂMETROS DO D1 (com fallback env/default)
        // ═══════════════════════════════════════════════════
        let parametrosD1 = {};
        const origem = {};

        try {
            const rows = await env.DB.prepare("SELECT chave, valor FROM parametros_customizados ORDER BY id DESC").all();
            if (rows.results && rows.results.length > 0) {
                for (const row of rows.results) {
                    const val = parseFloat(row.valor);
                    if (Number.isFinite(val) && !(row.chave in parametrosD1)) {
                        parametrosD1[row.chave] = val;
                        origem[`taxa_${row.chave}`] = 'd1';
                    }
                }
            }
        } catch (e) {
            // Tabela pode não existir ainda
            try {
                await env.DB.prepare("CREATE TABLE IF NOT EXISTS parametros_customizados (id INTEGER PRIMARY KEY AUTOINCREMENT, chave TEXT NOT NULL, valor TEXT NOT NULL)").run();
            } catch (e2) { }
        }

        // Resolver valores finais (D1 > payload > env > default)
        const resolveParam = (d1Key, payloadVal, envKey, fallback) => {
            if (d1Key in parametrosD1) return parametrosD1[d1Key];
            if (Number.isFinite(payloadVal)) return payloadVal / 100; // payload vem em %
            if (envKey && env[envKey]) return parseFloat(env[envKey]);
            return fallback;
        };

        const SPREAD_CARTAO = resolveParam('spread_cartao', spreadPercentInformado, 'TAXA_SPREAD', 0.055);
        const IOF_CARTAO = resolveParam('iof_cartao', iofPercentInformado, 'TAXA_IOF', 0.035);
        const IOF_GLOBAL = resolveParam('iof_global', iofPercentInformado, 'TAXA_IOF_GLOBAL', 0.035);
        const SPREAD_GLOBAL_ABERTO = resolveParam('spread_global_aberto', globalSpreadAbertoInformado, 'TAXA_SPREAD_GLOBAL_ABERTO', 0.0078);
        const SPREAD_GLOBAL_FECHADO = resolveParam('spread_global_fechado', globalSpreadFechadoInformado, 'TAXA_SPREAD_GLOBAL_FECHADO', 0.0118);
        const CALIBRAGEM = ('fator_calibragem_global' in parametrosD1) ? parametrosD1.fator_calibragem_global : (env.FATOR_CALIBRAGEM_GLOBAL ? parseFloat(env.FATOR_CALIBRAGEM_GLOBAL) : 0.99934);
        if ('fator_calibragem_global' in parametrosD1) origem.fator_calibragem_global = 'd1';

        const SPREAD_GLOBAL = is_plantao ? SPREAD_GLOBAL_FECHADO : SPREAD_GLOBAL_ABERTO;

        // ═══════════════════════════════════════════════════
        // 📝 SALVAR PARÂMETROS CUSTOMIZADOS NO D1
        // ═══════════════════════════════════════════════════
        let parametrosCustomizadosSalvos = false;
        let parametrosCustomizadosChaves = [];
        let parametrosCustomizadosEm = null;

        const paramsSalvar = {};
        if (Number.isFinite(spreadPercentInformado)) paramsSalvar.taxa_spread_cartao = spreadPercentInformado / 100;
        if (Number.isFinite(iofPercentInformado)) {
            paramsSalvar.taxa_iof_cartao = iofPercentInformado / 100;
            paramsSalvar.taxa_iof_global = iofPercentInformado / 100;
        }
        if (Number.isFinite(globalSpreadAbertoInformado)) paramsSalvar.taxa_spread_global_aberto = globalSpreadAbertoInformado / 100;
        if (Number.isFinite(globalSpreadFechadoInformado)) paramsSalvar.taxa_spread_global_fechado = globalSpreadFechadoInformado / 100;

        if (Object.keys(paramsSalvar).length > 0) {
            try {
                for (const [chave, valor] of Object.entries(paramsSalvar)) {
                    const d1Chave = chave.replace('taxa_', '');
                    await env.DB.prepare("INSERT OR REPLACE INTO parametros_customizados (chave, valor) VALUES (?, ?)").bind(d1Chave, String(valor)).run();
                    parametrosCustomizadosChaves.push(chave);
                    origem[chave] = 'd1';
                }
                parametrosCustomizadosSalvos = true;
                parametrosCustomizadosEm = new Date().toISOString();
            } catch (e) { }
        }

        let cartaoResult = null;
        let globalResult = null;
        let saldoExistenteResult = null;

        // =======================================================
        // 💳 MOTOR 1: CARTÃO DE CRÉDITO (PTAX)
        // =======================================================
        try {
            let taxa_cartao = null;
            let data_ptax = null;
            const moedasOlinda = ['USD', 'EUR', 'AUD', 'CAD', 'CHF', 'DKK', 'GBP', 'JPY', 'NOK', 'SEK'];
            let dataAtual = new Date(`${data_compra}T12:00:00Z`);

            for (let i = 0; i < 7; i++) {
                const yyyy = dataAtual.getUTCFullYear();
                const mm = String(dataAtual.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(dataAtual.getUTCDate()).padStart(2, '0');
                const dataISO = `${yyyy}-${mm}-${dd}`;
                const dataBacen = `${mm}-${dd}-${yyyy}`;
                const dataCsv = `${yyyy}${mm}${dd}`;

                try {
                    const cache = await env.DB.prepare("SELECT valor_ptax FROM ptax_cache WHERE data_cotacao = ? AND moeda = ?").bind(dataISO, moeda).first();
                    if (cache) { taxa_cartao = cache.valor_ptax; data_ptax = dataISO; break; }
                } catch (e) { }

                if (!taxa_cartao) {
                    if (moedasOlinda.includes(moeda)) {
                        let url = (moeda === 'USD')
                            ? `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataBacen}'&$top=1&$format=json`
                            : `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${moeda}'&@dataCotacao='${dataBacen}'&$format=json`;
                        try {
                            const response = await fetch(url);
                            if (response.ok) {
                                const data = await response.json();
                                if (data && data.value && data.value.length > 0) {
                                    taxa_cartao = moeda === 'USD' ? data.value[0].cotacaoVenda : (data.value.find(b => b.tipoBoletim === 'Fechamento' || b.tipoBoletim === 'Fechamento PTAX') || data.value[data.value.length - 1]).cotacaoVenda;
                                }
                            }
                        } catch (e) { }
                    } else {
                        try {
                            const responseCsv = await fetch(`https://www4.bcb.gov.br/Download/fechamento/${dataCsv}.csv`, { headers: { "User-Agent": "Mozilla/5.0" } });
                            if (responseCsv.ok) {
                                const text = await responseCsv.text();
                                for (let line of text.split('\n')) {
                                    const columns = line.split(';');
                                    if (columns.length >= 6 && columns[2].trim() === moeda) {
                                        taxa_cartao = parseFloat(columns[5].trim().replace(',', '.')); break;
                                    }
                                }
                            }
                        } catch (e) { }
                    }
                }

                if (taxa_cartao) {
                    data_ptax = dataISO;
                    try { await env.DB.prepare("INSERT OR REPLACE INTO ptax_cache (data_cotacao, moeda, valor_ptax) VALUES (?, ?, ?)").bind(dataISO, moeda, taxa_cartao).run(); } catch (e) { }
                    break;
                }
                dataAtual.setUTCDate(dataAtual.getUTCDate() - 1);
            }

            if (taxa_cartao) {
                const baseBrl = arredondar(valor_original * taxa_cartao);
                const valorSpread = arredondar(baseBrl * SPREAD_CARTAO);
                const baseComSpread = arredondar(baseBrl + valorSpread);
                const valorIof = arredondar(baseComSpread * IOF_CARTAO);
                const valorTotalBrl = arredondar(baseComSpread + valorIof);

                cartaoResult = {
                    suportada: true,
                    natureza_operacao: 'cartao_credito',
                    taxa_utilizada: taxa_cartao,
                    fonte_cotacao: 'PTAX do BCB',
                    data_cotacao: data_ptax,
                    spread_aplicado: SPREAD_CARTAO,
                    iof_aplicado: IOF_CARTAO,
                    base_brl: baseBrl,
                    valor_spread: valorSpread,
                    valor_iof: valorIof,
                    valor_total_brl: valorTotalBrl,
                    vet: valorTotalBrl / valor_original
                };
            } else { cartaoResult = { suportada: false, erro: "Cotação PTAX indisponível nesta data." }; }
        } catch (e) { cartaoResult = { suportada: false, erro: "Falha ao calcular Cartão." }; }

        // =======================================================
        // 🌎 MOTOR 2: CONTA GLOBAL (SPOT CALIBRADO)
        // =======================================================
        if (moeda === 'USD' || moeda === 'EUR') {
            try {
                const cacheMinuto = `SPOT-${dataBrasilISO}-${hora}:${minuto}`;

                let taxa_global = null;
                let fonte_global = '';
                let usou_contingencia = false;

                try {
                    const cache = await env.DB.prepare("SELECT valor_ptax FROM ptax_cache WHERE data_cotacao = ? AND moeda = ?").bind(cacheMinuto, moeda).first();
                    if (cache) { taxa_global = cache.valor_ptax; fonte_global = 'Spot Calibrado'; }
                } catch (e) { }

                if (!taxa_global) {
                    try {
                        const resA = await fetch(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
                        if (resA.ok) {
                            const dataA = await resA.json();
                            if (dataA[`${moeda}BRL`] && dataA[`${moeda}BRL`].bid) {
                                taxa_global = parseFloat(dataA[`${moeda}BRL`].bid) * CALIBRAGEM;
                                fonte_global = 'Spot Calibrado Itaú';
                            }
                        }
                    } catch (e) { }

                    if (!taxa_global) {
                        try {
                            const parYahoo = moeda === 'USD' ? 'BRL=X' : `${moeda}BRL=X`;
                            const resY = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${parYahoo}`, { headers: { "User-Agent": "Mozilla/5.0" } });
                            if (resY.ok) {
                                const dataY = await resY.json();
                                if (dataY.chart?.result?.length > 0) {
                                    taxa_global = parseFloat(dataY.chart.result[0].meta.regularMarketPrice) * CALIBRAGEM;
                                    fonte_global = 'Yahoo Global';
                                }
                            }
                        } catch (e) { }
                    }

                    if (taxa_global) {
                        try {
                            await env.DB.prepare("INSERT OR REPLACE INTO ptax_cache (data_cotacao, moeda, valor_ptax) VALUES (?, ?, ?)").bind(cacheMinuto, moeda, taxa_global).run();
                            await env.DB.prepare("INSERT OR REPLACE INTO ptax_cache (data_cotacao, moeda, valor_ptax) VALUES ('LATEST_SPOT', ?, ?)").bind(moeda, taxa_global).run();
                        } catch (e) { }
                    }
                }

                if (!taxa_global) {
                    try {
                        const cache = await env.DB.prepare("SELECT valor_ptax FROM ptax_cache WHERE data_cotacao = 'LATEST_SPOT' AND moeda = ?").bind(moeda).first();
                        if (cache) { taxa_global = cache.valor_ptax; fonte_global = 'Último Spot Salvo'; }
                    } catch (e) { }
                }

                if (!taxa_global) {
                    usou_contingencia = true;
                    taxa_global = cartaoResult && cartaoResult.suportada ? cartaoResult.taxa_utilizada : null;
                    fonte_global = 'PTAX Contingência';
                }

                if (taxa_global) {
                    const baseBrl = arredondar(valor_original * taxa_global);
                    const valorSpread = arredondar(baseBrl * SPREAD_GLOBAL);
                    const baseComSpread = arredondar(baseBrl + valorSpread);
                    const valorIof = arredondar(baseComSpread * IOF_GLOBAL);
                    const valorTotalBrl = arredondar(baseComSpread + valorIof);

                    globalResult = {
                        suportada: true,
                        natureza_operacao: 'compra_saldo_agora',
                        taxa_utilizada: taxa_global,
                        fonte_cotacao: fonte_global,
                        spread_aplicado: SPREAD_GLOBAL,
                        iof_aplicado: IOF_GLOBAL,
                        is_plantao: is_plantao,
                        usou_contingencia: usou_contingencia,
                        base_brl: baseBrl,
                        valor_spread: valorSpread,
                        valor_iof: valorIof,
                        valor_total_brl: valorTotalBrl,
                        vet: valorTotalBrl / valor_original
                    };
                } else { globalResult = { suportada: false, erro: "Câmbio Global Indisponível." }; }
            } catch (e) { globalResult = { suportada: false, erro: "Falha ao calcular Conta Global." }; }
        } else {
            globalResult = { suportada: false, erro: "A Conta Global opera nativamente apenas em Dólar e Euro." };
        }

        // =======================================================
        // 💼 MOTOR 3: CONTA GLOBAL — SALDO JÁ CARREGADO
        // =======================================================
        if ((moeda === 'USD' || moeda === 'EUR') && vet_saldo_existente && Number.isFinite(vet_saldo_existente) && vet_saldo_existente > 0) {
            const valorTotalSaldo = arredondar(valor_original * vet_saldo_existente);
            saldoExistenteResult = {
                suportada: true,
                natureza_operacao: 'uso_saldo_existente',
                metodologia: 'Custo histórico do saldo já carregado',
                vet_informado: vet_saldo_existente,
                valor_total_brl: valorTotalSaldo,
                vet: vet_saldo_existente
            };
        }

        // ═══════════════════════════════════════════════════
        // 📦 RESPOSTA FINAL
        // ═══════════════════════════════════════════════════
        const responseBody = {
            moeda: moeda,
            valor_original: valor_original,
            data_compra: data_compra,
            cartao: cartaoResult,
            global: globalResult,
            contexto_operacional: {
                hora,
                minuto,
                diaSemana,
                dataBrasilISO,
                is_feriado,
                is_plantao
            },
            parametros_vigentes: {
                iof_cartao: IOF_CARTAO,
                iof_global: IOF_GLOBAL,
                spread_cartao: SPREAD_CARTAO,
                spread_global_aberto: SPREAD_GLOBAL_ABERTO,
                spread_global_fechado: SPREAD_GLOBAL_FECHADO,
                fator_calibragem_global: CALIBRAGEM,
                origem
            }
        };

        if (saldoExistenteResult) {
            responseBody.global_saldo_existente = saldoExistenteResult;
        }

        if (parametrosCustomizadosSalvos) {
            responseBody.parametros_customizados_salvos = true;
            responseBody.parametros_customizados_chaves = parametrosCustomizadosChaves;
            responseBody.parametros_customizados_em = parametrosCustomizadosEm;
        }

        return new Response(JSON.stringify(responseBody), { headers: defaultHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ erro: `Erro interno no código: ${error.message}` }), { status: 400, headers: defaultHeaders });
    }
}