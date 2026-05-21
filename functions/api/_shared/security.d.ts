export function jsonResponse(data: unknown, status?: number, extraHeaders?: HeadersInit): Response;

export function isAllowedLcvOrigin(origin: unknown): boolean;

export function requireAllowedOrigin(request: Request): Response | null;

export function getClientIp(request: Request): string;

export function enforceRateLimit(
  request: Request,
  env: { BIGDATA_DB?: unknown },
  routeKey: string,
): Promise<Response | null>;
