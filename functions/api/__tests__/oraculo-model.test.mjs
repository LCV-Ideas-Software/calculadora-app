import { expect, it, vi } from 'vitest';
import { createD1Stub } from './helpers/d1-stub.mjs';

const captured = vi.hoisted(() => []);

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      countTokens: async () => ({ totalTokens: 100 }),
      generateContent: async (args) => {
        captured.push(args);
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
