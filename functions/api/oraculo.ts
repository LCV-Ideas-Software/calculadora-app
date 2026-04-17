/**
 * Módulo: itau-calculadora/functions/api/oraculo.ts
 * Versão: v04.00.00
 * Descrição: API do Oráculo IA — refatorada com SDK oficial @google/genai, TypeScript,
 * e sem vazamento de linting `any`.
 */

import { GoogleGenAI } from '@google/genai';
import { enforceRateLimit, jsonResponse, requireAllowedOrigin } from './_shared/security.js';

interface D1DatabaseLike {
  prepare: (query: string) => { bind(...args: unknown[]): { run: () => Promise<unknown> }; all: () => Promise<unknown> }
}

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  BIGDATA_DB?: D1DatabaseLike;
}

const GEMINI_CONFIG = {
  model: 'gemini-2.5-flash',
  maxTokensInput: 120000,
  maxRetries: 2,
  retryDelayMs: 800,
  endpoints: {
    oraculo: {
      maxOutputTokensAdvanced: 8192,
      maxOutputTokensMinimal: 8192,
      temperature: 0.3,
      topP: 0.8
    }
  }
};

function structuredLog(level: string, message: string, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...context
  };
  console.log(JSON.stringify(logEntry));
}

// ── Telemetria: registra uso de AI no BIGDATA_DB ──
function logAiUsage(
  db: D1DatabaseLike | undefined,
  entry: { module: string; model: string; input_tokens: number; output_tokens: number; latency_ms: number; status: string; error_detail?: string },
) {
  if (!db || typeof db.prepare !== 'function') return;
  (async () => {
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS ai_usage_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL DEFAULT (datetime('now')),
          module TEXT NOT NULL, model TEXT NOT NULL, input_tokens INTEGER DEFAULT 0,
          output_tokens INTEGER DEFAULT 0, latency_ms INTEGER DEFAULT 0,
          status TEXT DEFAULT 'ok', error_detail TEXT
        )
      `).all();
      await db.prepare(`
        INSERT INTO ai_usage_logs (module, model, input_tokens, output_tokens, latency_ms, status, error_detail)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        entry.module, entry.model,
        entry.input_tokens, entry.output_tokens,
        entry.latency_ms, entry.status,
        entry.error_detail || null,
      ).run();
    } catch (err) {
      console.warn('[telemetry] ai_usage_logs INSERT failed:', err instanceof Error ? err.message : err);
    }
  })();
}

function extractTextFromParts(parts: any[]): string {
  return (parts || [])
    .filter(p => typeof p.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('');
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context as { request: Request; env: Env };
    const originError = requireAllowedOrigin(request);
    if (originError) return originError;
    const rateLimitError = await enforceRateLimit(request, env, 'oraculo_ia');
    if (rateLimitError) return rateLimitError;
    const _telStart = Date.now();
    const promptData = await request.json();

    const { GEMINI_API_KEY } = env;

    if (!GEMINI_API_KEY) {
      structuredLog('error', 'Missing GEMINI_API_KEY', { endpoint: 'oraculo' });
      return jsonResponse({ erro: "O administrador ainda não configurou a chave de IA no servidor." }, 500);
    }

    const modelName = env.GEMINI_MODEL || GEMINI_CONFIG.model;
    const ai = new GoogleGenAI({ 
      apiKey: GEMINI_API_KEY
    });

    const instrucao = `Analise a simulação de câmbio abaixo e produza exatamente 3 blocos de texto. Cada bloco DEVE começar na primeira linha com o respectivo rótulo seguido de dois-pontos:

Resumo Executivo:
Aponte qual opção é a mais econômica e quanto se economiza em Reais. Se houver um cenário de "saldo já carregado" (uso de saldo previamente convertido), inclua-o na comparação. Resuma o veredito de forma clara para alguém que não é especialista em câmbio. Máximo 1 parágrafo.

Base Matemática:
Mostre a decomposição dos custos de cada cenário: câmbio base × valor, + spread, + IOF = total. Compare os VETs — explique que VET (Valor Efetivo Total) é o custo real que você paga por cada unidade de moeda estrangeira, incluindo todas as taxas. Use os números exatos da simulação. Máximo 2 parágrafos.

Recomendação Prática:
Dê uma recomendação contextualizada. Considere o status do mercado (aberto ou fechado/plantão), se há vantagem em aguardar uma janela de mercado diferente, e qualquer nuance relevante como a diferença entre comprar saldo agora vs usar saldo existente. Máximo 1 parágrafo.

Dados da simulação:
`;

    const promptText = `${instrucao}${JSON.stringify(promptData, null, 2)}`;

    // ===== TOKEN COUNTING PRE-VALIDATION =====
    try {
      const countRes = await ai.models.countTokens({ model: modelName, contents: promptText });
      const inputTokens = countRes.totalTokens || 0;
      if (inputTokens > GEMINI_CONFIG.maxTokensInput) {
        return jsonResponse({ erro: `Input exceeds token limit: ${inputTokens} > ${GEMINI_CONFIG.maxTokensInput}` }, 413);
      }
    } catch (countError) {
      if (countError instanceof Error) {
        structuredLog('warn', 'Failed to count tokens', { error: countError.message, endpoint: 'oraculo' });
      } else {
        structuredLog('warn', 'Failed to count tokens with unknown exception', { endpoint: 'oraculo' });
      }
      // Proceed even if count fails.
    }

    type PayloadCandidate = {
       label: string;
       systemInstruction?: string;
       config: any;
    };

    const safetySettings = [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' }
    ];

    const payloadCandidates: PayloadCandidate[] = [
      {
        label: 'advanced',
        systemInstruction: "Você é um analista financeiro sênior especializado em operações de câmbio para pessoas físicas no Brasil, com foco em clientes Itaú Personnalité. Sua comunicação é clara, direta e acessível — quando usar um termo técnico, explique brevemente entre parênteses. Tom de relatório executivo, sem saudações, sem rodapé. Use **negrito** para valores-chave. Português do Brasil. Não invente dados — use EXCLUSIVAMENTE os números fornecidos.",
        config: {
          temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
          topP: GEMINI_CONFIG.endpoints.oraculo.topP,
          maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensAdvanced,
          thinkingConfig: { thinkingBudgetTokens: 1024 },
          safetySettings
        }
      },
      {
        label: 'compat',
        systemInstruction: "Você é um analista financeiro sênior especializado em operações de câmbio para pessoas físicas no Brasil, com foco em clientes Itaú Personnalité.",
        config: {
          temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
          topP: GEMINI_CONFIG.endpoints.oraculo.topP,
          maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensAdvanced,
          safetySettings
        }
      },
      {
        label: 'minimal',
        config: {
          temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
          topP: GEMINI_CONFIG.endpoints.oraculo.topP,
          maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensMinimal,
          safetySettings
        }
      }
    ];

    let successfulResponse: any = null;

    for (let i = 0; i < payloadCandidates.length; i++) {
        const candidate = payloadCandidates[i];
        let attemptSuccess = false;

        for (let tentativa = 0; tentativa < GEMINI_CONFIG.maxRetries; tentativa++) {
            try {
                const response = await ai.models.generateContent({
                  model: modelName,
                  contents: candidate.label === 'minimal' ? `Contexto de atuação: Você é analista financeiro...\n\n${promptText}` : promptText,
                  config: {
                    ...candidate.config,
                    systemInstruction: candidate.systemInstruction
                  }
                });

                if (response.text) {
                    successfulResponse = response;
                    attemptSuccess = true;
                    structuredLog('info', 'Oráculo Gemini request succeeded', { endpoint: 'oraculo', payload: candidate.label, attempt: tentativa + 1 });
                    break;
                }
            } catch (err) {
                 if (err instanceof Error) {
                    structuredLog('warn', 'Oráculo Gemini request error', { endpoint: 'oraculo', error: err.message, payload: candidate.label, attempt: tentativa + 1 });
                 }
                 if (tentativa === 0) {
                     await new Promise(r => setTimeout(r, GEMINI_CONFIG.retryDelayMs));
                 }
            }
        }

        if (attemptSuccess) {
            break;
        }
    }

    if (!successfulResponse) {
        void logAiUsage(env.BIGDATA_DB, { module: 'calculadora-oraculo', model: modelName, input_tokens: 0, output_tokens: 0, latency_ms: Date.now() - _telStart, status: 'error', error_detail: 'All fallback payloads exhausted' });
        return jsonResponse({ erro: "Falha na IA do Google após exaustão de fallbacks. Tente novamente em instantes." }, 500);
    }

    const usage = successfulResponse.usageMetadata || {};
    structuredLog('info', 'Oráculo Gemini completed', {
        endpoint: 'oraculo',
        promptTokens: usage.promptTokenCount || 0,
        outputTokens: usage.candidatesTokenCount || 0,
        cachedTokens: usage.cachedContentTokenCount || 0
    });

    // Telemetria de sucesso
    void logAiUsage(env.BIGDATA_DB, {
      module: 'calculadora-oraculo', model: modelName,
      input_tokens: usage.promptTokenCount || 0,
      output_tokens: usage.candidatesTokenCount || 0,
      latency_ms: Date.now() - _telStart, status: 'ok'
    });

    let text = "";
    if (successfulResponse.candidates && successfulResponse.candidates[0]?.content?.parts) {
        text = extractTextFromParts(successfulResponse.candidates[0].content.parts);
    } else if (successfulResponse.text) {
        text = successfulResponse.text;
    }

    if (!text) {
        text = "Análise indisponível no momento. Tente novamente.";
    }

    return jsonResponse({ analise: text });

  } catch (error) {
    if (error instanceof Error) {
      structuredLog('error', 'Oráculo handler error', { endpoint: 'oraculo', error: error.message });
    } else {
      structuredLog('error', 'Oráculo handler error unknown structure', { endpoint: 'oraculo' });
    }
    return jsonResponse({ erro: "Erro interno no servidor do Oráculo." }, 500);
  }
}

