const DEFAULT_POLICIES = {
  oraculo_ia: {
    route_key: 'oraculo_ia',
    label: 'Síntese da IA',
    enabled: 1,
    max_requests: 2,
    window_minutes: 10
  },
  enviar_email: {
    route_key: 'enviar_email',
    label: 'Envio de E-mail',
    enabled: 1,
    max_requests: 2,
    window_minutes: 10
  },
  contato: {
    route_key: 'contato',
    label: 'Formulário de Contato',
    enabled: 1,
    max_requests: 5,
    window_minutes: 30
  }
};

function toInt(value, fallback) {
  const num = Number.parseInt(String(value), 10);
  return Number.isFinite(num) ? num : fallback;
}

export function getDefaultPolicy(routeKey) {
  return DEFAULT_POLICIES[routeKey] || null;
}

export function getAllDefaultPolicies() {
  return Object.values(DEFAULT_POLICIES);
}

export async function ensureRateLimitTables(env) {
  await env.BIGDATA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS itau_rate_limit_policies (
      route_key TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL,
      max_requests INTEGER NOT NULL,
      window_minutes INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      updated_by TEXT
    )
  `).run();

  await env.BIGDATA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS itau_rate_limit_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_key TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();
}

export async function ensureDefaultPolicies(env) {
  await ensureRateLimitTables(env);

  for (const policy of getAllDefaultPolicies()) {
    await env.BIGDATA_DB.prepare(`
      INSERT OR IGNORE INTO itau_rate_limit_policies (route_key, enabled, max_requests, window_minutes, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .bind(
        policy.route_key,
        policy.enabled,
        policy.max_requests,
        policy.window_minutes,
        Date.now(),
        'system-default'
      )
      .run();
  }
}

export async function getRateLimitPolicy(env, routeKey) {
  await ensureDefaultPolicies(env);

  const row = await env.BIGDATA_DB.prepare(`
    SELECT route_key, enabled, max_requests, window_minutes, updated_at, updated_by
    FROM itau_rate_limit_policies
    WHERE route_key = ?
    LIMIT 1
  `).bind(routeKey).first();

  const fallback = getDefaultPolicy(routeKey);

  if (!row && fallback) {
    return {
      ...fallback,
      updated_at: Date.now(),
      updated_by: 'system-default'
    };
  }

  return {
    route_key: row?.route_key || routeKey,
    label: fallback?.label || routeKey,
    enabled: toInt(row?.enabled, fallback?.enabled ?? 1),
    max_requests: toInt(row?.max_requests, fallback?.max_requests ?? 2),
    window_minutes: toInt(row?.window_minutes, fallback?.window_minutes ?? 10),
    updated_at: toInt(row?.updated_at, Date.now()),
    updated_by: row?.updated_by || null
  };
}

export async function upsertRateLimitPolicy(env, { routeKey, enabled, maxRequests, windowMinutes, updatedBy }) {
  await ensureDefaultPolicies(env);

  await env.BIGDATA_DB.prepare(`
    INSERT INTO itau_rate_limit_policies (route_key, enabled, max_requests, window_minutes, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(route_key) DO UPDATE SET
      enabled = excluded.enabled,
      max_requests = excluded.max_requests,
      window_minutes = excluded.window_minutes,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `)
    .bind(routeKey, enabled, maxRequests, windowMinutes, Date.now(), updatedBy || null)
    .run();
}

export async function resetRateLimitPolicy(env, routeKey, updatedBy) {
  const fallback = getDefaultPolicy(routeKey);
  if (!fallback) return false;

  await upsertRateLimitPolicy(env, {
    routeKey,
    enabled: fallback.enabled,
    maxRequests: fallback.max_requests,
    windowMinutes: fallback.window_minutes,
    updatedBy: updatedBy || 'admin-reset'
  });

  return true;
}

export async function checkAndTrackRateLimit({ env, request, routeKey }) {
  const policy = await getRateLimitPolicy(env, routeKey);

  if (!policy || policy.enabled !== 1) {
    return {
      allowed: true,
      policy,
      current_count: 0,
      retry_after_seconds: 0
    };
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const windowMs = Math.max(1, policy.window_minutes) * 60 * 1000;
  const cutoff = now - windowMs;

  await env.BIGDATA_DB.prepare('DELETE FROM itau_rate_limit_hits WHERE route_key = ? AND created_at < ?')
    .bind(routeKey, cutoff)
    .run();

  const countRow = await env.BIGDATA_DB.prepare(`
    SELECT COUNT(1) AS total
    FROM itau_rate_limit_hits
    WHERE route_key = ? AND ip = ? AND created_at >= ?
  `)
    .bind(routeKey, ip, cutoff)
    .first();

  const total = toInt(countRow?.total, 0);

  if (total >= policy.max_requests) {
    const oldest = await env.BIGDATA_DB.prepare(`
      SELECT created_at
      FROM itau_rate_limit_hits
      WHERE route_key = ? AND ip = ? AND created_at >= ?
      ORDER BY created_at ASC
      LIMIT 1
    `)
      .bind(routeKey, ip, cutoff)
      .first();

    const retryAfterSeconds = oldest?.created_at
      ? Math.max(1, Math.ceil(((Number(oldest.created_at) + windowMs) - now) / 1000))
      : 60;

    return {
      allowed: false,
      policy,
      current_count: total,
      retry_after_seconds: retryAfterSeconds
    };
  }

  await env.BIGDATA_DB.prepare('INSERT INTO itau_rate_limit_hits (route_key, ip, created_at) VALUES (?, ?, ?)')
    .bind(routeKey, ip, now)
    .run();

  return {
    allowed: true,
    policy,
    current_count: total + 1,
    retry_after_seconds: 0
  };
}

export async function getRateLimitWindowStats(env, routeKey, windowMinutes) {
  const now = Date.now();
  const windowMs = Math.max(1, toInt(windowMinutes, 10)) * 60 * 1000;
  const cutoff = now - windowMs;

  const row = await env.BIGDATA_DB.prepare(`
    SELECT COUNT(1) AS total, COUNT(DISTINCT ip) AS ips
    FROM itau_rate_limit_hits
    WHERE route_key = ? AND created_at >= ?
  `)
    .bind(routeKey, cutoff)
    .first();

  return {
    total_requests_window: toInt(row?.total, 0),
    distinct_ips_window: toInt(row?.ips, 0)
  };
}
