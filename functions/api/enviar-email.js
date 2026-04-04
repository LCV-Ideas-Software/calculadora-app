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

        const RESEND_API_KEY = env.RESEND_API_KEY || env['resend-api-key'] || env['resend-appkey'] || env.RESEND_APPKEY;
        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ success: false, error: "Chave do Resend não configurada." }), { status: 500, headers });
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
