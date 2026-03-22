import { calcularMape } from './backtest.mjs';

export async function onRequestGet(context) {
    const { env } = context;
    const headers = { 'Content-Type': 'application/json' };

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

        const agora = Date.now();
        const seteDiasMs = 7 * 24 * 60 * 60 * 1000;
        const cutoff = agora - seteDiasMs;

        const rows = await env.DB.prepare(`
            SELECT created_at, moeda, data_compra, taxa_prevista, taxa_observada, erro_percentual
            FROM backtest_spot_vs_ptax
            WHERE created_at >= ?
            ORDER BY created_at DESC
            LIMIT 200
        `).bind(cutoff).all();

        const results = rows.results || [];
        const erros = results.map((r) => Number(r.erro_percentual));
        const mape7d = calcularMape(erros);

        return new Response(JSON.stringify({
            janela: '7d',
            observacoes: results.length,
            mape_7d: mape7d,
            mape_7d_percent: Number.isFinite(mape7d) ? Number((mape7d * 100).toFixed(4)) : null,
            ultimas_observacoes: results.slice(0, 20)
        }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ erro: 'Falha ao calcular métricas de backtest.' }), { status: 500, headers });
    }
}
