import { enforceRateLimit, jsonResponse, requireAllowedOrigin } from './_shared/security.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const originError = requireAllowedOrigin(request);
    if (originError) return originError;
    const rateLimitError = await enforceRateLimit(request, env, 'contato');
    if (rateLimitError) return rateLimitError;

    try {
        const payload = await request.json();
        const name = String(payload.name ?? '').trim();
        const phone = String(payload.phone ?? '').trim();
        const email = String(payload.email ?? '').trim();
        const message = String(payload.message ?? '').trim();
        const safeName = escapeHtml(name);
        const safePhone = escapeHtml(phone);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

        if (!name || !email || !message) {
            return jsonResponse({ ok: false, error: "Nome, e-mail e mensagem são obrigatórios." }, 400);
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return jsonResponse({ ok: false, error: "E-mail inválido." }, 400);
        }

        const RESEND_API_KEY = env.RESEND_API_KEY || env['RESEND_APP_KEY'] || env['RESEND_APPKEY'] || env['resend-api-key'] || env['resend-appkey'] || env.RESEND_APPKEY;
        if (!RESEND_API_KEY) {
            return jsonResponse({ ok: false, error: "Chave do Resend não configurada." }, 500);
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: "Calculadora Financeira <calculadora@lcv.app.br>",
                to: ["calculadora@lcv.app.br"],
                reply_to: email,
                subject: `📬 Contato — ${name}`,
                html: `
                    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
                        <h2 style="color: #0d0d0d; margin: 0 0 24px;">Nova mensagem de contato</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr><td style="padding: 8px 0; color: #888; width: 100px;">Nome</td><td style="padding: 8px 0; font-weight: 700;">${safeName}</td></tr>
                            <tr><td style="padding: 8px 0; color: #888;">E-mail</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #1a73e8;">${safeEmail}</a></td></tr>
                            ${phone ? `<tr><td style="padding: 8px 0; color: #888;">Telefone</td><td style="padding: 8px 0;">${safePhone}</td></tr>` : ''}
                        </table>
                        <div style="background: #f5f4f4; border-radius: 12px; padding: 20px; color: #0d0d0d; line-height: 1.6;">
                            ${safeMessage}
                        </div>
                    </div>
                `
            })
        });

        if (res.ok) {
            return jsonResponse({ ok: true, message: "Mensagem enviada com sucesso!" });
        } else {
            const data = await res.json();
            return jsonResponse({ ok: false, error: String(data.message || "Falha no envio.") }, 500);
        }
    } catch (error) {
        return jsonResponse({ ok: false, error: "Falha interna ao enviar mensagem." }, 500);
    }
}
