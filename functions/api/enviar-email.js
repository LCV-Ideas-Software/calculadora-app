import { enforceRateLimit, jsonResponse, requireAllowedOrigin } from './_shared/security.js';

function sanitizeRichEmailHtml(input) {
    return String(input ?? '')
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
        .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, '')
        .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '')
        .slice(0, 120000);
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const originError = requireAllowedOrigin(request);
    if (originError) return originError;
    const rateLimitError = await enforceRateLimit(request, env, 'enviar_email');
    if (rateLimitError) return rateLimitError;

    try {
        const payload = await request.json();
        const emailDestino = String(payload.emailDestino ?? '').trim();
        const html = sanitizeRichEmailHtml(payload.html);
        const relatorioTexto = String(payload.relatorioTexto ?? '');

        if (!/^\S+@\S+\.\S+$/.test(emailDestino)) {
            return jsonResponse({ success: false, error: "E-mail de destino inválido." }, 400);
        }

        if (!html && !relatorioTexto) {
            return jsonResponse({ success: false, error: "Relatório vazio." }, 400);
        }

        const RESEND_API_KEY = env.RESEND_API_KEY || env['RESEND_APP_KEY'] || env['RESEND_APPKEY'] || env['resend-api-key'] || env['resend-appkey'] || env.RESEND_APPKEY;
        if (!RESEND_API_KEY) {
            return jsonResponse({ success: false, error: "Chave do Resend não configurada." }, 500);
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: "Calculadora Itaú <calculadora@lcv.app.br>",
                to: [emailDestino],
                subject: "💰 Simulação Itaú Personnalité — Comparativo de Câmbio",
                html: html,
                text: relatorioTexto
            })
        });

        const data = await res.json();

        if (res.ok) {
            return jsonResponse({ success: true, message: "E-mail enviado com sucesso!" });
        } else {
            return jsonResponse({ success: false, error: String(data.message || "Falha no Resend.") }, 500);
        }
    } catch (error) {
        return jsonResponse({ success: false, error: "Falha interna ao enviar e-mail." }, 500);
    }
}

export async function onRequestGet() {
    return jsonResponse({ success: false, error: "Método não permitido." }, 405);
}
