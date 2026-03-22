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

        // Rate-limit via D1 (4 envios por hora por IP)
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const windowMs = 60 * 60 * 1000;
        const maxPerHour = 4;

        try {
            const cutoff = Date.now() - windowMs;
            await env.DB.prepare("DELETE FROM email_rate_limit WHERE timestamp < ?").bind(cutoff).run();
            const count = await env.DB.prepare("SELECT COUNT(*) as total FROM email_rate_limit WHERE ip = ? AND timestamp >= ?").bind(ip, cutoff).first();

            if (count && count.total >= maxPerHour) {
                return new Response(JSON.stringify({ success: false, error: "Limite de envios atingido. Aguarde antes de tentar novamente." }), { status: 429, headers });
            }

            await env.DB.prepare("INSERT INTO email_rate_limit (ip, timestamp) VALUES (?, ?)").bind(ip, Date.now()).run();
        } catch (e) {
            try {
                await env.DB.prepare("CREATE TABLE IF NOT EXISTS email_rate_limit (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT NOT NULL, timestamp INTEGER NOT NULL)").run();
                await env.DB.prepare("INSERT INTO email_rate_limit (ip, timestamp) VALUES (?, ?)").bind(ip, Date.now()).run();
            } catch (e2) { /* prosseguir sem rate-limit */ }
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
