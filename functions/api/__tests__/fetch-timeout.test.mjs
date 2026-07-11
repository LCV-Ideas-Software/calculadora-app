import { afterEach, expect, it, vi } from 'vitest';
import { fetchComTimeout } from '../fetch-timeout.mjs';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('injeta um AbortSignal e repassa as options', async () => {
  let captured;
  vi.stubGlobal('fetch', (_url, opts) => {
    captured = opts;
    return Promise.resolve({ ok: true });
  });
  await fetchComTimeout('https://exemplo.com', { headers: { 'User-Agent': 'x' } }, 1000);
  expect(captured.headers).toEqual({ 'User-Agent': 'x' });
  expect(captured.signal).toBeInstanceOf(AbortSignal);
});

it('aborta quando o upstream não responde dentro do timeout', async () => {
  vi.stubGlobal(
    'fetch',
    (_url, opts) =>
      new Promise((_resolve, reject) => {
        opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
  await expect(fetchComTimeout('https://lento.com', {}, 20)).rejects.toThrow();
});
