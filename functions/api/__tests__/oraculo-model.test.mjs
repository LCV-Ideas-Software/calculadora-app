import { expect, it, vi } from 'vitest';
import { createD1Stub } from './helpers/d1-stub.mjs';

const captured = vi.hoisted(() => []);
const mockState = vi.hoisted(() => ({ failAdvanced: false }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      countTokens: async () => ({ totalTokens: 100 }),
      generateContent: async (args) => {
        captured.push(args);
        // Simula a rejeição do provedor para o candidato 'advanced' (config com thinkingConfig),
        // como aconteceria se a API recusasse thinkingLevel — força o fallback chain.
        if (mockState.failAdvanced && args.config?.thinkingConfig) {
          throw new Error('provider rejected thinkingConfig');
        }
        return {
          text: 'análise ok',
          candidates: [{ content: { parts: [{ text: 'análise ok' }] } }],
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
        };
      },
    };
  },
}));

const { onRequestPost } = await import('../oraculo.ts');

it('quando o candidato advanced é rejeitado, o fallback chain serve via compat (sem falha dura)', async () => {
  captured.length = 0;
  mockState.failAdvanced = true;
  try {
    const req = new Request('https://calc.lcv.app.br/api/oraculo', {
      method: 'POST',
      headers: { Origin: 'https://calc.lcv.app.br', 'Content-Type': 'application/json' },
      body: JSON.stringify({ transacao: { moeda: 'USD', valor_original: 100 } }),
    });
    const res = await onRequestPost({
      request: req,
      env: { GEMINI_API_KEY: 'test-key', BIGDATA_DB: createD1Stub() },
    });
    expect(res.status).toBe(200);
    // O advanced (com thinkingConfig) foi tentado e rejeitado; o compat (sem thinkingConfig) serviu.
    const advancedTries = captured.filter((c) => c.config?.thinkingConfig);
    const compatServed = captured.find((c) => !c.config?.thinkingConfig);
    expect(advancedTries.length).toBeGreaterThan(0);
    expect(compatServed).toBeTruthy();
    expect(compatServed.config.temperature).toBe(0.3);
  } finally {
    mockState.failAdvanced = false;
  }
});

it('usa gemini-3.5-flash como default e config idiomática 3.x no primeiro candidato', async () => {
  captured.length = 0;
  const req = new Request('https://calc.lcv.app.br/api/oraculo', {
    method: 'POST',
    headers: { Origin: 'https://calc.lcv.app.br', 'Content-Type': 'application/json' },
    body: JSON.stringify({ transacao: { moeda: 'USD', valor_original: 100 } }),
  });
  const res = await onRequestPost({
    request: req,
    env: { GEMINI_API_KEY: 'test-key', BIGDATA_DB: createD1Stub() },
  });
  expect(res.status).toBe(200);
  expect(captured.length).toBeGreaterThan(0);
  const first = captured[0];
  // Default migrado: 2.5-flash tem shutdown em 2026-10-16; substituto oficial GA.
  expect(first.model).toBe('gemini-3.5-flash');
  // Modelos 3.x: temperature/topP não recomendados; thinkingLevel substitui thinkingBudgetTokens.
  expect(first.config.temperature).toBeUndefined();
  expect(first.config.topP).toBeUndefined();
  expect(first.config.thinkingConfig).toEqual({ thinkingLevel: 'low' });
});

it('registra a telemetria de IA (insert+prune de ai_usage_logs) em context.waitUntil', async () => {
  captured.length = 0;
  mockState.failAdvanced = false;
  const executed = [];
  const db = createD1Stub([
    {
      match: () => true,
      run: (_args, sql) => {
        executed.push(sql);
        return { success: true };
      },
      first: (_args, sql) => {
        executed.push(sql);
        return /COUNT/i.test(sql) ? { total: 0 } : null;
      },
      all: (_args, sql) => {
        executed.push(sql);
        return { results: [] };
      },
    },
  ]);
  const waited = [];
  const req = new Request('https://calc.lcv.app.br/api/oraculo', {
    method: 'POST',
    headers: { Origin: 'https://calc.lcv.app.br', 'Content-Type': 'application/json' },
    body: JSON.stringify({ transacao: { moeda: 'USD', valor_original: 100 } }),
  });
  const res = await onRequestPost({
    request: req,
    env: { GEMINI_API_KEY: 'test-key', BIGDATA_DB: db },
    waitUntil: (p) => waited.push(p),
  });
  expect(res.status).toBe(200);
  // Garantia pós-resposta: a telemetria precisa estar registrada no waitUntil,
  // não órfã em fire-and-forget (finding do cross-review round 1).
  expect(waited.length).toBeGreaterThan(0);
  await Promise.all(waited);
  expect(executed.find((sql) => /INSERT INTO ai_usage_logs/i.test(sql))).toBeTruthy();
  expect(executed.find((sql) => /DELETE FROM ai_usage_logs/i.test(sql))).toMatch(/-90 days/);
});

it('mantém o override via env.GEMINI_MODEL', async () => {
  captured.length = 0;
  const req = new Request('https://calc.lcv.app.br/api/oraculo', {
    method: 'POST',
    headers: { Origin: 'https://calc.lcv.app.br', 'Content-Type': 'application/json' },
    body: JSON.stringify({ transacao: { moeda: 'USD' } }),
  });
  await onRequestPost({
    request: req,
    env: { GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'modelo-custom', BIGDATA_DB: createD1Stub() },
  });
  expect(captured[0].model).toBe('modelo-custom');
});
