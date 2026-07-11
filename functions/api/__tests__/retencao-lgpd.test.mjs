import { expect, it } from 'vitest';
import { onRequestPost as observabilidadePost } from '../oraculo-observabilidade.js';
import { logAiUsage } from '../oraculo.ts';
import { createD1Stub } from './helpers/d1-stub.mjs';

function recordingDb(executed) {
  return createD1Stub([
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
}

it('observabilidade: aplica retenção (DELETE com cutoff) após INSERT', async () => {
  const executed = [];
  const req = new Request('https://calc.lcv.app.br/api/oraculo-observabilidade', {
    method: 'POST',
    headers: { Origin: 'https://calc.lcv.app.br', 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'success', fromCache: false, durationMs: 100 }),
  });
  const waited = [];
  const res = await observabilidadePost({
    request: req,
    env: { BIGDATA_DB: recordingDb(executed) },
    waitUntil: (p) => waited.push(p),
  });
  expect(res.status).toBe(200);
  await Promise.all(waited);
  const prune = executed.find((sql) => /DELETE FROM calc_oraculo_observabilidade/i.test(sql));
  expect(prune).toBeTruthy();
});

it('logAiUsage: aplica retenção de 90 dias em ai_usage_logs após INSERT', async () => {
  const executed = [];
  logAiUsage(recordingDb(executed), {
    module: 'calculadora-oraculo',
    model: 'gemini-2.5-flash',
    input_tokens: 10,
    output_tokens: 20,
    latency_ms: 50,
    status: 'ok',
  });
  // logAiUsage é fire-and-forget: aguarda o microtask/macrotask da IIFE
  await new Promise((r) => setTimeout(r, 10));
  const insert = executed.find((sql) => /INSERT INTO ai_usage_logs/i.test(sql));
  const prune = executed.find((sql) => /DELETE FROM ai_usage_logs/i.test(sql));
  expect(insert).toBeTruthy();
  expect(prune).toMatch(/-90 days/);
});
