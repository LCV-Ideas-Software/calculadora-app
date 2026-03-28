/* ====================================================================
   Calculadora App — API Client Service
   Comunicação com backend (Cloudflare Pages Functions)
   ==================================================================== */

import type { SimulationPayload, SimulationResponse } from '../types/api.ts';

const BASE = '/api';

/**
 * POST /api/calcular — Executa simulação comparativa
 */
export async function fetchSimulation(payload: SimulationPayload): Promise<SimulationResponse> {
  const res = await fetch(`${BASE}/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Erro ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

/**
 * GET /api/parametros — Obtém parâmetros vigentes
 */
export async function fetchParametros(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/parametros`);
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

/**
 * POST /api/oraculo-observabilidade — Envia evento de telemetria
 */
export async function postOraculoObservabilidade(evento: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${BASE}/oraculo-observabilidade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evento),
    });
  } catch {
    // Falha silenciosa — telemetria não deve bloquear UX
  }
}
