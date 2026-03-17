export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const promptData = await request.json();

        // Recupera a chave do Google Gemini a partir das variáveis de ambiente criptografadas (Secrets)
        const GEMINI_API_KEY = env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return new Response(JSON.stringify({ erro: "O administrador ainda não configurou a chave de IA no servidor." }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        // O sistema já escolhe automaticamente o modelo mais rápido e inteligente do Google nos bastidores
        const modelName = "gemini-2.5-pro";
        const generateUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        const instrucao = "Aja como um oráculo financeiro implacável, focado estritamente na matemática cambial e otimização para clientes VIP do Itaú Personnalité. Forneça uma análise técnica concisa e direta (máximo de 2 a 3 parágrafos curtos), apontando a diferença de custos (como spread e IOF) entre o Cartão de Crédito e a Conta Global. Responda em Português do Brasil. Sem saudações. Analise criticamente os seguintes dados numéricos para apontar o vencedor e cravar o valor exato economizado em Reais: \n\n";

        const geminiPayload = {
            contents: [{ parts: [{ text: `${instrucao}${JSON.stringify(promptData)}` }] }]
        };

        const response = await fetch(generateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!response.ok) {
            const errText = await response.text();
            return new Response(JSON.stringify({ erro: `Falha na IA do Google.` }), { status: 502, headers: { "Content-Type": "application/json" } });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Análise concluída sem retorno de texto.";

        return new Response(JSON.stringify({ analise: text }), { headers: { "Content-Type": "application/json" } });

    } catch (error) {
        return new Response(JSON.stringify({ erro: "Erro interno no servidor do Oráculo." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}