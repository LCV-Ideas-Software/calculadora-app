import { getOperationalContext } from './contexto-operacional.mjs';
import { calcularBandasSensibilidade } from './sensibilidade.mjs';
import { calcularErroPercentual, calcularMape, classificarMapePercent } from './backtest.mjs';

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
        const backtestMapeBoaInformado = payload.backtest_mape_boa_percent;
        const backtestMapeAtencaoInformado = payload.backtest_mape_atencao_percent;

        if (!data_compra || !valor_original || !moeda) {
            return new Response(JSON.stringify({ erro: "Dados incompletos." }), { status: 400, headers: defaultHeaders });
        }

        // 🕰️ CONTEXTO OPERACIONAL (compartilhado)
        const { hora, minuto, diaSemana, dataBrasilISO, is_feriado, is_plantao } = getOperationalContext(new Date());

        const arredondar = (num, casas = 2) => {
            // toPrecision evita erros de representação IEEE 754 
            // (ex: 1.005 * 100 = 100.49999... → corrigido para 100.5)
            return Number(Math.round(parseFloat(num + 'e' + casas)) + 'e-' + casas);
        };

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

        const resolveMetricParam = (d1Key, envKey, fallback) => {
            if (d1Key in parametrosD1 && Number.isFinite(parametrosD1[d1Key])) return parametrosD1[d1Key];
            if (envKey && env[envKey] !== undefined) {
                const v = parseFloat(env[envKey]);
                if (Number.isFinite(v)) return v;
            }
            return fallback;
        };

        const BACKTEST_MAPE_BOA_PERCENT = resolveMetricParam('backtest_mape_boa_percent', 'BACKTEST_MAPE_BOA_PERCENT', 1.0);
        const BACKTEST_MAPE_ATENCAO_PERCENT = resolveMetricParam('backtest_mape_atencao_percent', 'BACKTEST_MAPE_ATENCAO_PERCENT', 2.0);
        if ('backtest_mape_boa_percent' in parametrosD1) origem.backtest_mape_boa_percent = 'd1';
        if ('backtest_mape_atencao_percent' in parametrosD1) origem.backtest_mape_atencao_percent = 'd1';

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
        if (Number.isFinite(backtestMapeBoaInformado)) paramsSalvar.backtest_mape_boa_percent = backtestMapeBoaInformado;
        if (Number.isFinite(backtestMapeAtencaoInformado)) paramsSalvar.backtest_mape_atencao_percent = backtestMapeAtencaoInformado;

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
                // Precisão total na cadeia — arredonda apenas na saída
                const baseBrl_full = valor_original * taxa_cartao;
                const valorSpread_full = baseBrl_full * SPREAD_CARTAO;
                const baseComSpread_full = baseBrl_full + valorSpread_full;
                const valorIof_full = baseComSpread_full * IOF_CARTAO;
                const valorTotalBrl_full = baseComSpread_full + valorIof_full;

                cartaoResult = {
                    suportada: true,
                    natureza_operacao: 'cartao_credito',
                    taxa_utilizada: taxa_cartao,
                    fonte_cotacao: 'PTAX do BCB',
                    data_cotacao: data_ptax,
                    spread_aplicado: SPREAD_CARTAO,
                    iof_aplicado: IOF_CARTAO,
                    base_brl: arredondar(baseBrl_full),
                    valor_spread: arredondar(valorSpread_full),
                    valor_iof: arredondar(valorIof_full),
                    valor_total_brl: arredondar(valorTotalBrl_full),
                    vet: arredondar(valorTotalBrl_full / valor_original, 6)
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
                    // Precisão total na cadeia — arredonda apenas na saída
                    const baseBrl_full = valor_original * taxa_global;
                    const valorSpread_full = baseBrl_full * SPREAD_GLOBAL;
                    const baseComSpread_full = baseBrl_full + valorSpread_full;
                    const valorIof_full = baseComSpread_full * IOF_GLOBAL;
                    const valorTotalBrl_full = baseComSpread_full + valorIof_full;

                    globalResult = {
                        suportada: true,
                        natureza_operacao: 'compra_saldo_agora',
                        taxa_utilizada: taxa_global,
                        fonte_cotacao: fonte_global,
                        spread_aplicado: SPREAD_GLOBAL,
                        iof_aplicado: IOF_GLOBAL,
                        is_plantao: is_plantao,
                        usou_contingencia: usou_contingencia,
                        base_brl: arredondar(baseBrl_full),
                        valor_spread: arredondar(valorSpread_full),
                        valor_iof: arredondar(valorIof_full),
                        valor_total_brl: arredondar(valorTotalBrl_full),
                        vet: arredondar(valorTotalBrl_full / valor_original, 6)
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
                backtest_mape_boa_percent: BACKTEST_MAPE_BOA_PERCENT,
                backtest_mape_atencao_percent: BACKTEST_MAPE_ATENCAO_PERCENT,
                origem
            }
        };

        const sensibilidade = {};
        if (cartaoResult?.suportada) {
            sensibilidade.cartao = calcularBandasSensibilidade({
                valorOriginal: valor_original,
                taxaCambio: cartaoResult.taxa_utilizada,
                spread: cartaoResult.spread_aplicado,
                iof: cartaoResult.iof_aplicado
            });
        }

        if (globalResult?.suportada) {
            sensibilidade.global = calcularBandasSensibilidade({
                valorOriginal: valor_original,
                taxaCambio: globalResult.taxa_utilizada,
                spread: globalResult.spread_aplicado,
                iof: globalResult.iof_aplicado
            });
        }

        if (Object.keys(sensibilidade).length > 0) {
            responseBody.sensibilidade = sensibilidade;
        }

        // ═══════════════════════════════════════════════════
        // 📉 BACKTEST SIMPLES (SPOT vs PTAX referência)
        // ═══════════════════════════════════════════════════
        if (globalResult?.suportada && cartaoResult?.suportada && (moeda === 'USD' || moeda === 'EUR')) {
            const erroPercentual = calcularErroPercentual(globalResult.taxa_utilizada, cartaoResult.taxa_utilizada);

            if (Number.isFinite(erroPercentual)) {
                try {
                    await env.DB.prepare(`
                        CREATE TABLE IF NOT EXISTS backtest_spot_vs_ptax (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            created_at INTEGER NOT NULL,
                            moeda TEXT NOT NULL,
                            data_compra TEXT NOT NULL,
                            taxa_prevista REAL NOT NULL,
                            taxa_observada REAL NOT NULL,
                            erro_percentual REAL NOT NULL
                        )
                    `).run();

                    await env.DB.prepare(`
                        INSERT INTO backtest_spot_vs_ptax (created_at, moeda, data_compra, taxa_prevista, taxa_observada, erro_percentual)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).bind(
                        Date.now(),
                        moeda,
                        data_compra,
                        globalResult.taxa_utilizada,
                        cartaoResult.taxa_utilizada,
                        erroPercentual
                    ).run();

                    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    const rows = await env.DB.prepare(`
                        SELECT erro_percentual
                        FROM backtest_spot_vs_ptax
                        WHERE created_at >= ?
                        ORDER BY created_at DESC
                        LIMIT 200
                    `).bind(cutoff).all();

                    const erros = (rows.results || []).map((r) => Number(r.erro_percentual));
                    const mape7d = calcularMape(erros);
                    const mape7dPercent = Number.isFinite(mape7d) ? arredondar(mape7d * 100, 4) : null;
                    const qualidade = classificarMapePercent(mape7dPercent, BACKTEST_MAPE_BOA_PERCENT, BACKTEST_MAPE_ATENCAO_PERCENT);

                    responseBody.backtest = {
                        referencia: 'spot_global_vs_ptax_cartao',
                        erro_percentual_atual: erroPercentual,
                        mape_7d: mape7d,
                        mape_7d_percent: mape7dPercent,
                        observacoes_7d: erros.length,
                        qualidade,
                        faixas_percent: {
                            boa: BACKTEST_MAPE_BOA_PERCENT,
                            atencao: BACKTEST_MAPE_ATENCAO_PERCENT
                        }
                    };
                } catch (e) {
                    // Não bloquear cálculo por falha de backtest
                }
            }
        }

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