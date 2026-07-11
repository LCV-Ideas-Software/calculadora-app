import { calcularMape } from './backtest.mjs';
import { enforceRateLimit, jsonResponse, requireAllowedOrigin } from './_shared/security.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const originError = requireAllowedOrigin(request);
    if (originError) return originError;
    const rateLimitError = await enforceRateLimit(request, env, 'backtest');
    if (rateLimitError) return rateLimitError;

    try {
        await env.BIGDATA_DB.prepare(`
            CREATE TABLE IF NOT EXISTS calc_backtest_spot_vs_ptax (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at INTEGER NOT NULL,
                moeda TEXT NOT NULL,
                data_compra TEXT NOT NULL,
                taxa_prevista REAL NOT NULL,
                taxa_observada REAL NOT NULL,
                erro_percentual REAL NOT NULL
            )
        `).run();

        const agora = Date.now();
        const seteDiasMs = 7 * 24 * 60 * 60 * 1000;
        const cutoff = agora - seteDiasMs;

        const rows = await env.BIGDATA_DB.prepare(`
            SELECT created_at, moeda, data_compra, taxa_prevista, taxa_observada, erro_percentual
            FROM calc_backtest_spot_vs_ptax
            WHERE created_at >= ?
            ORDER BY created_at DESC
            LIMIT 200
        `).bind(cutoff).all();

        const results = rows.results || [];
        const erros = results.map((r) => Number(r.erro_percentual));
        const mape7d = calcularMape(erros);

        return jsonResponse({
            janela: '7d',
            observacoes: results.length,
            mape_7d: mape7d,
            mape_7d_percent: Number.isFinite(mape7d) ? Number((mape7d * 100).toFixed(4)) : null,
            ultimas_observacoes: results.slice(0, 20)
        });
    } catch (error) {
        return jsonResponse({ erro: 'Falha ao calcular métricas de backtest.' }, 500);
    }
}
