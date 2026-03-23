// Módulo: itau-calculadora/functions/api/oraculo.js
// Versão: v03.24.03
// Descrição: API do Oráculo IA — modelo estável explícito, v1, payload canônico REST, safetySettings, retry.

import { checkAndTrackRateLimit } from './_lib/rate-limit.mjs';

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
            return new Response(JSON.stringify({ erro: "O administrador ainda não configurou a chave de IA no servidor." }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        // Produção estável: usar v1 e modelo explícito (evita hot-swap de alias "latest").
        // Ref: https://ai.google.dev/gemini-api/docs/api-versions
        // Ref: https://ai.google.dev/gemini-api/docs/models#stable
        const modelName = env.GEMINI_MODEL || "gemini-2.5-pro";
        const generateUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        const instrucao = `Analise a simulação de câmbio abaixo e produza exatamente 3 blocos de texto. Cada bloco DEVE começar na primeira linha com o respectivo rótulo seguido de dois-pontos:

Resumo Executivo:
Aponte qual opção é a mais econômica e quanto se economiza em Reais. Se houver um cenário de "saldo já carregado" (uso de saldo previamente convertido), inclua-o na comparação. Resuma o veredito de forma clara para alguém que não é especialista em câmbio. Máximo 1 parágrafo.

Base Matemática:
Mostre a decomposição dos custos de cada cenário: câmbio base × valor, + spread, + IOF = total. Compare os VETs — explique que VET (Valor Efetivo Total) é o custo real que você paga por cada unidade de moeda estrangeira, incluindo todas as taxas. Use os números exatos da simulação. Máximo 2 parágrafos.

Recomendação Prática:
Dê uma recomendação contextualizada. Considere o status do mercado (aberto ou fechado/plantão), se há vantagem em aguardar uma janela de mercado diferente, e qualquer nuance relevante como a diferença entre comprar saldo agora vs usar saldo existente. Máximo 1 parágrafo.

Dados da simulação:
`;

        // Estrutura REST canônica conforme API reference (camelCase)
        const geminiPayload = {
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
                temperature: 0.3,
                topP: 0.8,
                maxOutputTokens: 4096,
                thinkingConfig: {
                    thinkingLevel: "HIGH"
                }
            },
            safetySettings: [
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" }
            ]
        };

        // Retry: 1 tentativa extra em caso de falha transitória
        let response;
        for (let tentativa = 0; tentativa < 2; tentativa++) {
            response = await fetch(generateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiPayload)
            });
            if (response.ok) break;
            if (tentativa === 0) {
                console.warn(`Gemini tentativa 1 falhou (${response.status}), retrying...`);
                await new Promise(r => setTimeout(r, 800));
            }
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error após retry:', response.status, errText);

            let upstreamMessage = '';
            try {
                const parsed = JSON.parse(errText);
                upstreamMessage = String(parsed?.error?.message || '').trim();
            } catch {
                upstreamMessage = '';
            }

            const mappedStatus = [400, 401, 403, 404, 408, 409, 413, 415, 422, 429, 500, 502, 503, 504].includes(response.status)
                ? response.status
                : 502;

            const retryAfterFromHeader = Number.parseInt(String(response.headers.get('retry-after') || ''), 10);
            const retryAfterSeconds = Number.isFinite(retryAfterFromHeader) && retryAfterFromHeader > 0
                ? retryAfterFromHeader
                : 60;

            const body = {
                erro: mappedStatus === 429
                    ? `Limite temporário da IA do Google atingido (${response.status}).`
                    : `Falha na IA do Google (${response.status}).`
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

        const data = await response.json();

        // Modelos thinking retornam thoughts + text em parts separados
        // Filtrar apenas partes com texto visível (ignorar thoughts)
        let text = '';
        const parts = data.candidates?.[0]?.content?.parts;
        if (parts && parts.length > 0) {
            for (const part of parts) {
                if (part.text && !part.thought) {
                    text += part.text;
                }
            }
        }

        if (!text) {
            text = "Análise indisponível no momento. Tente novamente.";
        }

        return new Response(JSON.stringify({ analise: text }), { headers: { "Content-Type": "application/json" } });

    } catch (error) {
        console.error('Oráculo error:', error.message);
        return new Response(JSON.stringify({ erro: "Erro interno no servidor do Oráculo." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}