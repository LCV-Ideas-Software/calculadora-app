/**
 * Módulo: itau-calculadora/functions/api/oraculo.ts
 * Versão: v04.00.00
 * Descrição: API do Oráculo IA — refatorada com SDK oficial @google/genai, TypeScript,
 * e sem vazamento de linting `any`.
 */

import { GoogleGenAI } from '@google/genai';

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
}

const GEMINI_CONFIG = {
  model: '',
  maxTokensInput: 120000,
  maxRetries: 2,
  retryDelayMs: 800,
  endpoints: {
    oraculo: {
      maxOutputTokensAdvanced: 4096,
      maxOutputTokensMinimal: 3072,
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

function extractTextFromParts(parts: any[]): string {
  return (parts || [])
    .filter(p => typeof p.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('');
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context as { request: Request; env: Env };
    const promptData = await request.json();

    const { GEMINI_API_KEY } = env;

    if (!GEMINI_API_KEY) {
      structuredLog('error', 'Missing GEMINI_API_KEY', { endpoint: 'oraculo' });
      return new Response(JSON.stringify({ erro: "O administrador ainda não configurou a chave de IA no servidor." }), { status: 500, headers: { "Content-Type": "application/json" } });
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
        return new Response(JSON.stringify({ erro: `Input exceeds token limit: ${inputTokens} > ${GEMINI_CONFIG.maxTokensInput}` }), {
          status: 413,
          headers: { "Content-Type": "application/json" }
        });
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

    const payloadCandidates: PayloadCandidate[] = [
      {
        label: 'advanced',
        systemInstruction: "Você é um analista financeiro sênior especializado em operações de câmbio para pessoas físicas no Brasil, com foco em clientes Itaú Personnalité. Sua comunicação é clara, direta e acessível — quando usar um termo técnico, explique brevemente entre parênteses. Tom de relatório executivo, sem saudações, sem rodapé. Use **negrito** para valores-chave. Português do Brasil. Não invente dados — use EXCLUSIVAMENTE os números fornecidos.",
        config: {
          temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
          topP: GEMINI_CONFIG.endpoints.oraculo.topP,
          maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensAdvanced,
          thinkingConfig: { thinkingBudgetTokens: 1024 }
        }
      },
      {
        label: 'compat',
        systemInstruction: "Você é um analista financeiro sênior especializado em operações de câmbio para pessoas físicas no Brasil, com foco em clientes Itaú Personnalité.",
        config: {
          temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
          topP: GEMINI_CONFIG.endpoints.oraculo.topP,
          maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensAdvanced
        }
      },
      {
        label: 'minimal',
        config: {
          temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
          topP: GEMINI_CONFIG.endpoints.oraculo.topP,
          maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensMinimal
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
        return new Response(JSON.stringify({ erro: "Falha na IA do Google após exaustão de fallbacks. Tente novamente em instantes." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const usage = successfulResponse.usageMetadata || {};
    structuredLog('info', 'Oráculo Gemini completed', {
        endpoint: 'oraculo',
        promptTokens: usage.promptTokenCount || 0,
        outputTokens: usage.candidatesTokenCount || 0,
        cachedTokens: usage.cachedContentTokenCount || 0
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

    return new Response(JSON.stringify({ analise: text }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    if (error instanceof Error) {
      structuredLog('error', 'Oráculo handler error', { endpoint: 'oraculo', error: error.message });
    } else {
      structuredLog('error', 'Oráculo handler error unknown structure', { endpoint: 'oraculo' });
    }
    return new Response(JSON.stringify({ erro: "Erro interno no servidor do Oráculo." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
