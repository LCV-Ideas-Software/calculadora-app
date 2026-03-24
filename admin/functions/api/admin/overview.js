import { requireCloudflareAccess } from '../_lib/access.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

const DEFAULTS = {
  iof_cartao: 0.035,
  iof_global: 0.035,
  spread_cartao: 0.055,
  spread_global_aberto: 0.0078,
  spread_global_fechado: 0.0118,
  fator_calibragem_global: 0.99934,
  backtest_mape_boa_percent: 1.0,
  backtest_mape_atencao_percent: 2.0
};

async function ensureTables(env) {
  await env.BIGDATA_DB.prepare(
    'CREATE TABLE IF NOT EXISTS itau_parametros_customizados (id INTEGER PRIMARY KEY AUTOINCREMENT, chave TEXT NOT NULL, valor TEXT NOT NULL)'
  ).run();

  await env.BIGDATA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS itau_backtest_spot_vs_ptax (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      moeda TEXT NOT NULL,
      data_compra TEXT NOT NULL,
      taxa_prevista REAL NOT NULL,
      taxa_observada REAL NOT NULL,
      erro_percentual REAL NOT NULL
    )
  `).run();

  await env.BIGDATA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS itau_parametros_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      admin_email TEXT NOT NULL,
      chave TEXT NOT NULL,
      valor_anterior TEXT,
      valor_novo TEXT NOT NULL,
      origem TEXT NOT NULL
    )
  `).run();

  await env.BIGDATA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS itau_oraculo_observabilidade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      from_cache INTEGER NOT NULL,
      force_refresh INTEGER NOT NULL,
      duration_ms INTEGER,
      moeda TEXT,
      valor_original REAL,
      preview TEXT,
      error_message TEXT,
      app_version TEXT
    )
  `).run();
}

async function readParams(env) {
  const rows = await env.BIGDATA_DB.prepare('SELECT chave, valor FROM itau_parametros_customizados ORDER BY id DESC').all();
  const merged = { ...DEFAULTS };

  for (const row of rows.results || []) {
    const parsed = Number.parseFloat(row.valor);
    if (Number.isFinite(parsed) && row.chave in DEFAULTS) {
      merged[row.chave] = parsed;
    }
  }

  return merged;
}

function getMercadoContexto(now = new Date()) {
  const diaSemana = now.getUTCDay();
  const horaBrasil = (now.getUTCHours() - 3 + 24) % 24;
  const minuto = now.getUTCMinutes();
  const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
  const isPlantao = isFimDeSemana || horaBrasil < 9 || horaBrasil >= 17;

  return {
    hora_brasil: horaBrasil,
    minuto,
    dia_semana_utc: diaSemana,
    is_plantao: isPlantao
  };
}

export async function onRequestGet(context) {
  const access = requireCloudflareAccess(context);
  if (!access.ok) return access.response;

  try {
    const { env } = context;
    await ensureTables(env);

    const params = await readParams(env);

    const totalRow = await env.BIGDATA_DB.prepare('SELECT COUNT(1) AS total FROM itau_backtest_spot_vs_ptax').first();
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const janelaRow = await env.DB
      .prepare('SELECT COUNT(1) AS total_7d, AVG(erro_percentual) AS mape_7d FROM itau_backtest_spot_vs_ptax WHERE created_at >= ?')
      .bind(cutoff)
      .first();

    const ultimasRows = await env.DB
      .prepare('SELECT created_at, moeda, erro_percentual FROM itau_backtest_spot_vs_ptax ORDER BY created_at DESC LIMIT 10')
      .all();

    const auditoriaRows = await env.DB
      .prepare('SELECT created_at, admin_email, chave, valor_anterior, valor_novo, origem FROM itau_parametros_auditoria ORDER BY created_at DESC LIMIT 20')
      .all();

    const telemetryRow = await env.BIGDATA_DB.prepare(`
      SELECT
        COUNT(1) AS total,
        SUM(CASE WHEN from_cache = 1 THEN 1 ELSE 0 END) AS cache_hits,
        AVG(duration_ms) AS avg_duration,
        MAX(duration_ms) AS last_duration,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errors
      FROM itau_oraculo_observabilidade
    `).first();

    const historicoRows = await env.DB
      .prepare(`
        SELECT created_at, status, from_cache, force_refresh, moeda, valor_original, preview, error_message
        FROM itau_oraculo_observabilidade
        ORDER BY created_at DESC
        LIMIT 20
      `)
      .all();

    return json({
      admin_email: access.email,
      contexto_operacional: getMercadoContexto(new Date()),
      parametros_vigentes: params,
      backtest: {
        total_observacoes: Number(totalRow?.total || 0),
        observacoes_7d: Number(janelaRow?.total_7d || 0),
        mape_7d: Number.isFinite(Number(janelaRow?.mape_7d)) ? Number(Number(janelaRow.mape_7d).toFixed(6)) : null,
        mape_7d_percent: Number.isFinite(Number(janelaRow?.mape_7d))
          ? Number((Number(janelaRow.mape_7d) * 100).toFixed(4))
          : null,
        ultimas_observacoes: (ultimasRows.results || []).map((item) => ({
          created_at: Number(item.created_at),
          moeda: item.moeda,
          erro_percentual: Number(item.erro_percentual)
        }))
      },
      auditoria_parametros: {
        total_registros_carregados: (auditoriaRows.results || []).length,
        ultimas_alteracoes: (auditoriaRows.results || []).map((item) => ({
          created_at: Number(item.created_at),
          admin_email: item.admin_email,
          chave: item.chave,
          valor_anterior: item.valor_anterior,
          valor_novo: item.valor_novo,
          origem: item.origem
        }))
      },
      oraculo_telemetria: {
        total: Number(telemetryRow?.total || 0),
        cache_hits: Number(telemetryRow?.cache_hits || 0),
        avg_duration_ms: Number.isFinite(Number(telemetryRow?.avg_duration)) ? Math.round(Number(telemetryRow.avg_duration)) : null,
        last_duration_ms: Number.isFinite(Number(telemetryRow?.last_duration)) ? Math.round(Number(telemetryRow.last_duration)) : null,
        errors: Number(telemetryRow?.errors || 0)
      },
      oraculo_historico: {
        ultimas_analises: (historicoRows.results || []).map((item) => ({
          created_at: Number(item.created_at),
          status: item.status,
          from_cache: Number(item.from_cache || 0) === 1,
          force_refresh: Number(item.force_refresh || 0) === 1,
          moeda: item.moeda,
          valor_original: Number.isFinite(Number(item.valor_original)) ? Number(item.valor_original) : null,
          preview: item.preview,
          error_message: item.error_message
        }))
      }
    });
  } catch (error) {
    return json({ erro: 'Falha ao carregar visão geral administrativa.' }, 500);
  }
}
