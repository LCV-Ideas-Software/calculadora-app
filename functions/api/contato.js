export async function onRequestPost(context) {
    const { request, env } = context;
    const headers = { "Content-Type": "application/json" };

    try {
        const payload = await request.json();
        const name = String(payload.name ?? '').trim();
        const phone = String(payload.phone ?? '').trim();
        const email = String(payload.email ?? '').trim();
        const message = String(payload.message ?? '').trim();

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ ok: false, error: "Nome, e-mail e mensagem são obrigatórios." }), { status: 400, headers });
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return new Response(JSON.stringify({ ok: false, error: "E-mail inválido." }), { status: 400, headers });
        }

        const RESEND_API_KEY = env.RESEND_API_KEY;
        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ ok: false, error: "Chave do Resend não configurada." }), { status: 500, headers });
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: "Calculadora Itaú <calculadora@lcv.app.br>",
                to: ["calculadora@lcv.app.br"],
                reply_to: email,
                subject: `📬 Contato — ${name}`,
                html: `
                    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
                        <h2 style="color: #0d0d0d; margin: 0 0 24px;">Nova mensagem de contato</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr><td style="padding: 8px 0; color: #888; width: 100px;">Nome</td><td style="padding: 8px 0; font-weight: 700;">${name}</td></tr>
                            <tr><td style="padding: 8px 0; color: #888;">E-mail</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #1a73e8;">${email}</a></td></tr>
                            ${phone ? `<tr><td style="padding: 8px 0; color: #888;">Telefone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ''}
                        </table>
                        <div style="background: #f5f4f4; border-radius: 12px; padding: 20px; color: #0d0d0d; line-height: 1.6;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `
            })
        });

        if (res.ok) {
            return new Response(JSON.stringify({ ok: true, message: "Mensagem enviada com sucesso!" }), { headers });
        } else {
            const data = await res.json();
            return new Response(JSON.stringify({ ok: false, error: String(data.message || "Falha no envio.") }), { status: 500, headers });
        }
    } catch (error) {
        return new Response(JSON.stringify({ ok: false, error: "Falha interna ao enviar mensagem." }), { status: 500, headers });
    }
}
