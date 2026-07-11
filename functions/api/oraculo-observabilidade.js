import { enforceRateLimit, jsonResponse, requireAllowedOrigin } from './_shared/security.js';

async function ensureTable(env) {
  await env.BIGDATA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS calc_oraculo_observabilidade (
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

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const originError = requireAllowedOrigin(request);
    if (originError) return originError;

    const rateLimitError = await enforceRateLimit(request, env, 'observabilidade');
    if (rateLimitError) return rateLimitError;

    const body = await request.json();

    await ensureTable(env);

    const status = body?.status === 'error' ? 'error' : 'success';
    const fromCache = body?.fromCache ? 1 : 0;
    const forceRefresh = body?.forceRefresh ? 1 : 0;
    const durationMs = Number.isFinite(Number(body?.durationMs)) ? Math.max(0, Math.round(Number(body.durationMs))) : null;
    const moeda = typeof body?.moeda === 'string' ? body.moeda.slice(0, 12) : null;
    const valorOriginal = Number.isFinite(Number(body?.valorOriginal)) ? Number(body.valorOriginal) : null;
    const preview = typeof body?.preview === 'string' ? body.preview.slice(0, 600) : null;
    const errorMessage = typeof body?.errorMessage === 'string' ? body.errorMessage.slice(0, 300) : null;
    const appVersion = typeof body?.appVersion === 'string' ? body.appVersion.slice(0, 24) : null;

    await env.BIGDATA_DB.prepare(`
      INSERT INTO calc_oraculo_observabilidade (
        created_at, status, from_cache, force_refresh, duration_ms,
        moeda, valor_original, preview, error_message, app_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        Date.now(),
        status,
        fromCache,
        forceRefresh,
        durationMs,
        moeda,
        valorOriginal,
        preview,
        errorMessage,
        appVersion
      )
      .run();

    // Retenção LGPD: valor_original + preview são dados pessoais; 90 dias bastam.
    const noventaDiasMs = 90 * 24 * 60 * 60 * 1000;
    const prune = (async () => {
      try {
        await env.BIGDATA_DB.prepare('DELETE FROM calc_oraculo_observabilidade WHERE created_at < ?')
          .bind(Date.now() - noventaDiasMs)
          .run();
      } catch { }
    })();
    if (typeof context.waitUntil === 'function') context.waitUntil(prune);
    else await prune;

    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ erro: 'Falha ao registrar observabilidade do Oráculo.' }, 500);
  }
}
