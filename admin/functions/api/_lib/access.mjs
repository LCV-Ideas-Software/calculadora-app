function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function parseAllowlist(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function requireCloudflareAccess(context) {
  const { request, env } = context;

  const email =
    request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    '';

  const jwtAssertion =
    request.headers.get('cf-access-jwt-assertion') ||
    request.headers.get('Cf-Access-Jwt-Assertion') ||
    '';

  if (!email || !jwtAssertion) {
    return {
      ok: false,
      response: json(
        {
          erro: 'Acesso administrativo bloqueado. Configure e utilize Cloudflare Access no subdomínio admin.',
          code: 'ACCESS_REQUIRED'
        },
        403
      )
    };
  }

  const allowlist = parseAllowlist(env.ADMIN_ALLOWED_EMAILS);
  const normalizedEmail = String(email).trim().toLowerCase();

  if (allowlist.length > 0 && !allowlist.includes(normalizedEmail)) {
    return {
      ok: false,
      response: json(
        {
          erro: 'Usuário autenticado, porém sem permissão administrativa.',
          code: 'ACCESS_DENIED'
        },
        403
      )
    };
  }

  return {
    ok: true,
    email: normalizedEmail
  };
}
