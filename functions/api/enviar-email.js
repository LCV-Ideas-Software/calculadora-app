import { checkAndTrackRateLimit } from './_lib/rate-limit.mjs';

export async function onRequestPost(context) {
    const { request, env } = context;
    const headers = { "Content-Type": "application/json" };

    try {
        const payload = await request.json();
        const emailDestino = String(payload.emailDestino ?? '').trim();
        const html = String(payload.html ?? '');
        const relatorioTexto = String(payload.relatorioTexto ?? '');

        if (!/^\S+@\S+\.\S+$/.test(emailDestino)) {
            return new Response(JSON.stringify({ success: false, error: "E-mail de destino inválido." }), { status: 400, headers });
        }

        if (!html && !relatorioTexto) {
            return new Response(JSON.stringify({ success: false, error: "Relatório vazio." }), { status: 400, headers });
        }

        const RESEND_API_KEY = env.RESEND_API_KEY;
        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ success: false, error: "Chave do Resend não configurada." }), { status: 500, headers });
        }

        // Rate-limit configurável via D1 (por IP)
        const rate = await checkAndTrackRateLimit({ env, request, routeKey: 'enviar_email' });
        if (!rate.allowed) {
            return new Response(JSON.stringify({
                success: false,
                error: `Limite de envios atingido. Tente novamente em ${rate.retry_after_seconds}s.`,
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
                    ...headers,
                    "Retry-After": String(rate.retry_after_seconds)
                }
            });
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
            return new Response(JSON.stringify({ success: true, message: "E-mail enviado com sucesso!" }), { headers });
        } else {
            return new Response(JSON.stringify({ success: false, error: String(data.message || "Falha no Resend.") }), { status: 500, headers });
        }
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: "Falha interna ao enviar e-mail." }), { status: 500, headers });
    }
}

export async function onRequestGet() {
    return new Response(JSON.stringify({ success: true, message: "Endpoint de enviar-email ativo." }), {
        headers: { "Content-Type": "application/json" }
    });
}
