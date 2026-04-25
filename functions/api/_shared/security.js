const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

const DEFAULT_POLICIES = {
  oraculo_ia: { enabled: 1, max_requests: 2, window_minutes: 10 },
  enviar_email: { enabled: 1, max_requests: 2, window_minutes: 10 },
  contato: { enabled: 1, max_requests: 5, window_minutes: 30 },
  observabilidade: { enabled: 1, max_requests: 30, window_minutes: 10 },
};

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

export function isAllowedLcvOrigin(origin) {
  return /^https:\/\/([a-z0-9-]+\.)*lcv\.app\.br$/i.test(String(origin || '').trim());
}

export function requireAllowedOrigin(request) {
  const origin = String(request.headers.get('Origin') || '').trim();
  if (!origin || !isAllowedLcvOrigin(origin)) {
    return jsonResponse({ ok: false, error: 'Origem não permitida.' }, 403);
  }
  return null;
}

export function getClientIp(request) {
  const cfIp = request.headers.get('CF-Connecting-IP')?.trim();
  if (cfIp) return cfIp;

  const forwarded = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;

  return 'unknown';
}

async function ensureRateLimitTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS itau_rate_limit_policies (
      route_key TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL,
      max_requests INTEGER NOT NULL,
      window_minutes INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      updated_by TEXT
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS itau_rate_limit_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_key TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  for (const [routeKey, policy] of Object.entries(DEFAULT_POLICIES)) {
    await db.prepare(`
      INSERT OR IGNORE INTO itau_rate_limit_policies (route_key, enabled, max_requests, window_minutes, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .bind(routeKey, policy.enabled, policy.max_requests, policy.window_minutes, Date.now(), 'system-default')
      .run();
  }
}

async function getPolicy(db, routeKey) {
  await ensureRateLimitTables(db);

  const fallback = DEFAULT_POLICIES[routeKey] ?? { enabled: 1, max_requests: 5, window_minutes: 10 };
  const row = await db.prepare(`
    SELECT enabled, max_requests, window_minutes
    FROM itau_rate_limit_policies
    WHERE route_key = ?
    LIMIT 1
  `)
    .bind(routeKey)
    .first();

  return {
    enabled: Number.parseInt(String(row?.enabled ?? fallback.enabled), 10) === 1,
    maxRequests: Math.max(1, Number.parseInt(String(row?.max_requests ?? fallback.max_requests), 10)),
    windowMinutes: Math.max(1, Number.parseInt(String(row?.window_minutes ?? fallback.window_minutes), 10)),
  };
}

export async function enforceRateLimit(request, env, routeKey) {
  const db = env?.BIGDATA_DB;
  if (!db || typeof db.prepare !== 'function') {
    return jsonResponse({ ok: false, error: 'Database indisponível para rate limit.' }, 503);
  }

  const policy = await getPolicy(db, routeKey);
  if (!policy.enabled) {
    return null;
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const cutoff = now - (policy.windowMinutes * 60 * 1000);
  const row = await db.prepare(`
    SELECT COUNT(1) AS total
    FROM itau_rate_limit_hits
    WHERE route_key = ? AND ip = ? AND created_at >= ?
  `)
    .bind(routeKey, ip, cutoff)
    .first();

  const total = Number.parseInt(String(row?.total ?? 0), 10) || 0;
  if (total >= policy.maxRequests) {
    return jsonResponse(
      { ok: false, error: 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.' },
      429,
      { 'Retry-After': String(policy.windowMinutes * 60) },
    );
  }

  await db.prepare(`
    INSERT INTO itau_rate_limit_hits (route_key, ip, created_at)
    VALUES (?, ?, ?)
  `)
    .bind(routeKey, ip, now)
    .run();

  return null;
}
