import { requireCloudflareAccess } from '../_lib/access.mjs';
import {
  ensureDefaultPolicies,
  getRateLimitPolicy,
  getDefaultPolicy,
  upsertRateLimitPolicy,
  resetRateLimitPolicy,
  getRateLimitWindowStats
} from '../../../../functions/api/_lib/rate-limit.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

const SUPPORTED_ROUTES = ['oraculo_ia', 'enviar_email'];

function normalizeRoute(routeKey) {
  return SUPPORTED_ROUTES.includes(routeKey) ? routeKey : null;
}

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

async function listPoliciesWithStats(env) {
  await ensureDefaultPolicies(env);

  const all = [];
  for (const routeKey of SUPPORTED_ROUTES) {
    const current = await getRateLimitPolicy(env, routeKey);
    const fallback = getDefaultPolicy(routeKey);
    const stats = await getRateLimitWindowStats(env, routeKey, current.window_minutes);

    all.push({
      route_key: routeKey,
      label: fallback?.label || routeKey,
      enabled: current.enabled === 1,
      max_requests: current.max_requests,
      window_minutes: current.window_minutes,
      updated_at: current.updated_at,
      updated_by: current.updated_by,
      defaults: {
        enabled: fallback?.enabled === 1,
        max_requests: fallback?.max_requests,
        window_minutes: fallback?.window_minutes
      },
      stats
    });
  }

  return all;
}

export async function onRequestGet(context) {
  const access = requireCloudflareAccess(context);
  if (!access.ok) return access.response;

  try {
    const { env } = context;
    const policies = await listPoliciesWithStats(env);

    return json({
      admin_email: access.email,
      policies
    });
  } catch (error) {
    return json({ erro: 'Falha ao carregar painel de rate limit.' }, 500);
  }
}

export async function onRequestPost(context) {
  const access = requireCloudflareAccess(context);
  if (!access.ok) return access.response;

  try {
    const { request, env } = context;
    const body = await request.json();

    const routeKey = normalizeRoute(String(body?.route_key || ''));
    if (!routeKey) {
      return json({ erro: 'Rota de rate limit inválida.' }, 400);
    }

    const action = String(body?.action || 'update');

    if (action === 'restore_default') {
      await resetRateLimitPolicy(env, routeKey, access.email);
      const policies = await listPoliciesWithStats(env);
      return json({ ok: true, action: 'restore_default', policies });
    }

    const enabled = body?.enabled ? 1 : 0;
    const maxRequests = toPositiveInt(body?.max_requests, 2);
    const windowMinutes = toPositiveInt(body?.window_minutes, 10);

    if (maxRequests > 5000 || windowMinutes > 1440) {
      return json({ erro: 'Parâmetros fora da faixa permitida.' }, 400);
    }

    await upsertRateLimitPolicy(env, {
      routeKey,
      enabled,
      maxRequests,
      windowMinutes,
      updatedBy: access.email
    });

    const policies = await listPoliciesWithStats(env);
    return json({ ok: true, action: 'update', policies });
  } catch (error) {
    return json({ erro: 'Falha ao salvar painel de rate limit.' }, 500);
  }
}
