/**
 * fetch com timeout via AbortSignal. Evita que uma fonte externa lenta
 * (BCB, AwesomeAPI, Yahoo) prenda o worker até o limite da plataforma.
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [timeoutMs=4000]
 */
export function fetchComTimeout(url, options = {}, timeoutMs = 4000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}
