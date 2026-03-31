// Módulo: itau-calculadora/functions/api/oraculo.js
// Versão: v03.25.00
// Descrição: API do Oráculo IA — modernizado com 10 Gemini v1beta features + fallback robusto.
// Features: Token counting, structured logging, improved safety, maxOutputTokens, usage metadata,
// JSDoc types, detailed retry, thinking support, centralized config, input validation (413).

import { checkAndTrackRateLimit } from './_lib/rate-limit.mjs';

// ========== CONFIG & SETUP ==========

/**
 * @typedef {Object} GeminiConfig
 * @property {string} model - Modelo Gemini (ex: 'gemini-pro-latest')
 * @property {string} version - Versão da API (ex: 'v1beta')
 * @property {number} maxTokensInput - Limite máximo input (120000)
 * @property {number} maxRetries - Tentativas (2)
 * @property {number} retryDelayMs - Delay entre tentativas (800)
 * @property {Object} endpoints - Per-endpoint configs
 */
const GEMINI_CONFIG = {
  model: 'gemini-pro-latest',
  version: 'v1beta',
  maxTokensInput: 120000,
  maxRetries: 2,
  retryDelayMs: 800,
  defaultThinkingConfig: { thinkingLevel: 'HIGH' },
  endpoints: {
    oraculo: {
      maxOutputTokensAdvanced: 4096,
      maxOutputTokensMinimal: 3072,
      temperature: 0.3,
      topP: 0.8
    }
  }
};

/**
 * Estrutura log em formato JSON com ISO 8601 timestamp
 * @param {string} level - 'info' | 'warn' | 'error' | 'debug'
 * @param {string} message - Mensagem principal
 * @param {Object} context - Dados contextuais
 */
function structuredLog(level, message, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...context
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Estima contagem de tokens via countTokens endpoint
 * @param {string} text - Texto para análise
 * @param {string} apiKey - Chave Gemini API
 * @returns {Promise<number>} Contagem de tokens
 */
async function estimateTokenCount(text, apiKey) {
  if (!text || !apiKey) return 0;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.version}/models/${GEMINI_CONFIG.model}:countTokens?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
      }
    );
    if (!response.ok) return 0;
    const data = await response.json();
    return data.totalTokens || 0;
  } catch (err) {
    structuredLog('warn', 'Failed to count tokens', { error: err.message, endpoint: 'oraculo' });
    return 0;
  }
}

/**
 * Valida se contagem de tokens está dentro do limite
 * @param {number} tokenCount - Contagem de tokens
 * @returns {Object} { shouldReject: boolean, status: number, error: string }
 */
function validateInputTokens(tokenCount) {
  if (tokenCount > GEMINI_CONFIG.maxTokensInput) {
    return {
      shouldReject: true,
      status: 413,
      error: `Input exceeds token limit: ${tokenCount} > ${GEMINI_CONFIG.maxTokensInput}`
    };
  }
  return { shouldReject: false };
}

/**
 * Extrai metadata de uso da resposta Gemini
 * @param {Object} responseData - Dados da resposta
 * @returns {Object} { promptTokens, outputTokens, cachedTokens }
 */
function extractUsageMetadata(responseData) {
  const usage = responseData?.usageMetadata || {};
  return {
    promptTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
    cachedTokens: usage.cachedContentTokenCount || 0
  };
}

/**
 * Extrai texto de parts, filtrando thinking internals
 * @param {Array} parts - Array de parts da resposta
 * @returns {string} Texto concatenado
 */
function extractTextFromParts(parts) {
  return (parts || [])
    .filter(p => p.text && !p.thought)
    .map(p => p.text)
    .join('');
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const promptData = await request.json();

        const rate = await checkAndTrackRateLimit({ env, request, routeKey: 'oraculo_ia' });
        if (!rate.allowed) {
            return new Response(JSON.stringify({
                erro: `Limite temporário do Oráculo atingido. Tente novamente em ${rate.retry_after_seconds}s.`,
                code: 'RATE_LIMITED',
                retry_after_seconds: rate.retry_after_seconds,
                policy: {
                    enabled: rate.policy?.enabled === 1,
                    max_requests: rate.policy?.max_requests,
                    window_minutes: rate.policy?.window_minutes
                }
            }), {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(rate.retry_after_seconds)
                }
            });
        }

        const GEMINI_API_KEY = env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            structuredLog('error', 'Missing GEMINI_API_KEY', { endpoint: 'oraculo' });
            return new Response(JSON.stringify({ erro: "O administrador ainda não configurou a chave de IA no servidor." }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        // Produção estável: usar v1beta e modelo explícito (evita hot-swap de alias "latest").
        // Ref: https://ai.google.dev/gemini-api/docs/api-versions
        // Ref: https://ai.google.dev/gemini-api/docs/models#stable
        const modelName = env.GEMINI_MODEL || GEMINI_CONFIG.model;
        const generateUrl = `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.version}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        const instrucao = `Analise a simulação de câmbio abaixo e produza exatamente 3 blocos de texto. Cada bloco DEVE começar na primeira linha com o respectivo rótulo seguido de dois-pontos:

Resumo Executivo:
Aponte qual opção é a mais econômica e quanto se economiza em Reais. Se houver um cenário de "saldo já carregado" (uso de saldo previamente convertido), inclua-o na comparação. Resuma o veredito de forma clara para alguém que não é especialista em câmbio. Máximo 1 parágrafo.

Base Matemática:
Mostre a decomposição dos custos de cada cenário: câmbio base × valor, + spread, + IOF = total. Compare os VETs — explique que VET (Valor Efetivo Total) é o custo real que você paga por cada unidade de moeda estrangeira, incluindo todas as taxas. Use os números exatos da simulação. Máximo 2 parágrafos.

Recomendação Prática:
Dê uma recomendação contextualizada. Considere o status do mercado (aberto ou fechado/plantão), se há vantagem em aguardar uma janela de mercado diferente, e qualquer nuance relevante como a diferença entre comprar saldo agora vs usar saldo existente. Máximo 1 parágrafo.

Dados da simulação:
`;

        // Payload principal (com recursos avançados)
        const geminiPayloadAdvanced = {
            systemInstruction: {
                parts: [{
                    text: `Você é um analista financeiro sênior especializado em operações de câmbio para pessoas físicas no Brasil, com foco em clientes Itaú Personnalité. Sua comunicação é clara, direta e acessível — quando usar um termo técnico, explique brevemente entre parênteses. Tom de relatório executivo, sem saudações, sem rodapé. Use **negrito** para valores-chave. Português do Brasil. Não invente dados — use EXCLUSIVAMENTE os números fornecidos.`
                }]
            },
            contents: [{
                parts: [{
                    text: `${instrucao}${JSON.stringify(promptData, null, 2)}`
                }]
            }],
            generationConfig: {
                temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
                topP: GEMINI_CONFIG.endpoints.oraculo.topP,
                maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensAdvanced,
                thinkingConfig: GEMINI_CONFIG.defaultThinkingConfig
            },
            safetySettings: [
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" }
            ]
        };

        // Fallback 1: remove thinkingConfig (ponto comum de incompatibilidade em algumas combinações de modelo/versão)
        const geminiPayloadCompat = {
            ...geminiPayloadAdvanced,
            generationConfig: {
                temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
                topP: GEMINI_CONFIG.endpoints.oraculo.topP,
                maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensAdvanced
            }
        };

        // Fallback 2: payload mínimo (sem campos opcionais mais sensíveis)
        const geminiPayloadMinimal = {
            contents: [{
                parts: [{
                    text: `Contexto de atuação:\nVocê é um analista financeiro sênior especializado em operações de câmbio para pessoas físicas no Brasil, com foco em clientes Itaú Personnalité. Comunicação clara, direta e acessível. Use negrito para valores-chave. Português do Brasil. Não invente dados — use exclusivamente os números fornecidos.\n\n${instrucao}${JSON.stringify(promptData, null, 2)}`
                }]
            }],
            generationConfig: {
                temperature: GEMINI_CONFIG.endpoints.oraculo.temperature,
                topP: GEMINI_CONFIG.endpoints.oraculo.topP,
                maxOutputTokens: GEMINI_CONFIG.endpoints.oraculo.maxOutputTokensMinimal
            },
            safetySettings: [
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" }
            ]
        };

        // ===== TOKEN COUNTING PRE-VALIDATION =====
        const promptText = `${instrucao}${JSON.stringify(promptData, null, 2)}`;
        const inputTokens = await estimateTokenCount(promptText, GEMINI_API_KEY);
        const validation = validateInputTokens(inputTokens);
        if (validation.shouldReject) {
            structuredLog('warn', 'Input validation failed', {
                endpoint: 'oraculo',
                tokenCount: inputTokens,
                limit: GEMINI_CONFIG.maxTokensInput
            });
            return new Response(JSON.stringify({ erro: validation.error }), {
                status: validation.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        structuredLog('info', 'Token counting validated', {
            endpoint: 'oraculo',
            tokenCount: inputTokens,
            limit: GEMINI_CONFIG.maxTokensInput
        });

        async function callGeminiWithRetry(payload, label) {
            let lastStatus = 502;
            let lastErrorText = '';
            let lastHeaders = new Headers({ 'Content-Type': 'application/json' });

            for (let tentativa = 0; tentativa < GEMINI_CONFIG.maxRetries; tentativa++) {
                try {
                    const attempt = tentativa + 1;
                    structuredLog('info', `Oráculo Gemini request attempt ${attempt}/${GEMINI_CONFIG.maxRetries}`, {
                        endpoint: 'oraculo',
                        payload: label,
                        attempt
                    });

                    const currentResponse = await fetch(generateUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (currentResponse.ok) {
                        structuredLog('info', 'Oráculo Gemini request succeeded', {
                            endpoint: 'oraculo',
                            payload: label,
                            attempt,
                            status: currentResponse.status
                        });
                        return { ok: true, response: currentResponse };
                    }

                    lastStatus = currentResponse.status;
                    lastHeaders = currentResponse.headers;
                    lastErrorText = await currentResponse.text().catch(() => '');

                    structuredLog('warn', 'Oráculo Gemini request failed', {
                        endpoint: 'oraculo',
                        payload: label,
                        attempt,
                        status: currentResponse.status
                    });

                    if (tentativa === 0) {
                        await new Promise((r) => setTimeout(r, GEMINI_CONFIG.retryDelayMs));
                    }
                } catch (err) {
                    structuredLog('error', 'Oráculo Gemini request error', {
                        endpoint: 'oraculo',
                        payload: label,
                        attempt: tentativa + 1,
                        error: err.message
                    });

                    if (tentativa === 0) {
                        await new Promise((r) => setTimeout(r, GEMINI_CONFIG.retryDelayMs));
                    }
                }
            }

            return {
                ok: false,
                status: lastStatus,
                errorText: lastErrorText,
                headers: lastHeaders
            };
        }

        const payloadCandidates = [
            { label: 'advanced', payload: geminiPayloadAdvanced },
            { label: 'compat', payload: geminiPayloadCompat },
            { label: 'minimal', payload: geminiPayloadMinimal }
        ];

        let successfulResponse = null;
        let lastFailure = null;

        for (const candidate of payloadCandidates) {
            const result = await callGeminiWithRetry(candidate.payload, candidate.label);

            if (result.ok) {
                successfulResponse = result.response;
                structuredLog('info', 'Oráculo fallback strategy succeeded', {
                    endpoint: 'oraculo',
                    successfulPayload: candidate.label
                });
                break;
            }

            lastFailure = result;
            structuredLog('warn', `Oráculo Gemini falhou no payload ${candidate.label}`, {
                endpoint: 'oraculo',
                payload: candidate.label,
                status: result.status
            });

            // Fallback somente para erros de formato/validação do payload
            if (![400, 422].includes(result.status)) {
                break;
            }
        }

        if (!successfulResponse) {
            const failureStatus = Number(lastFailure?.status || 502);
            const errText = String(lastFailure?.errorText || '');
            const failureHeaders = lastFailure?.headers || new Headers({ 'Content-Type': 'application/json' });
            structuredLog('error', 'Oráculo Gemini API error após exaustão de fallbacks', {
                endpoint: 'oraculo',
                status: failureStatus,
                errorLength: errText.length
            });

            const mappedStatus = [400, 401, 403, 404, 408, 409, 413, 415, 422, 429, 500, 502, 503, 504].includes(failureStatus)
                ? failureStatus
                : 502;

            const retryAfterFromHeader = Number.parseInt(String(failureHeaders.get('retry-after') || ''), 10);
            const retryAfterSeconds = Number.isFinite(retryAfterFromHeader) && retryAfterFromHeader > 0
                ? retryAfterFromHeader
                : 60;

            const body = {
                erro: mappedStatus === 429
                    ? `Limite temporário da IA do Google atingido (${failureStatus}).`
                    : mappedStatus === 400
                        ? `Falha na IA do Google (${failureStatus}): requisição rejeitada pelo provedor. Tente novamente em instantes.`
                        : `Falha na IA do Google (${failureStatus}).`
            };

            if (mappedStatus === 429) {
                body.code = 'RATE_LIMITED_UPSTREAM';
                body.retry_after_seconds = retryAfterSeconds;
            }

            const headers = { "Content-Type": "application/json" };
            if (mappedStatus === 429) {
                headers['Retry-After'] = String(retryAfterSeconds);
            }

            return new Response(JSON.stringify(body), { status: mappedStatus, headers });
        }

        const data = await successfulResponse.json();

        // ===== EXTRACT METADATA & LOG =====
        const usage = extractUsageMetadata(data);
        structuredLog('info', 'Oráculo Gemini completed', {
            endpoint: 'oraculo',
            promptTokens: usage.promptTokens,
            outputTokens: usage.outputTokens,
            cachedTokens: usage.cachedTokens
        });

        // Modelos thinking retornam thoughts + text em parts separados
        // Filtrar apenas partes com texto visível (ignorar thoughts)
        const parts = data.candidates?.[0]?.content?.parts;
        let text = extractTextFromParts(parts);

        if (!text) {
            text = "Análise indisponível no momento. Tente novamente.";
            structuredLog('warn', 'Empty response from Gemini', {
                endpoint: 'oraculo',
                candidatesLength: data.candidates?.length || 0
            });
        }

        return new Response(JSON.stringify({ analise: text }), { headers: { "Content-Type": "application/json" } });

    } catch (error) {
        structuredLog('error', 'Oráculo handler error', {
            endpoint: 'oraculo',
            error: error.message
        });
        return new Response(JSON.stringify({ erro: "Erro interno no servidor do Oráculo." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}