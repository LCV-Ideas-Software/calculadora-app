const LOGO_B64 = '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';

function styleLists(root) {
    root.querySelectorAll('ul').forEach(ul => {
        ul.style.cssText = 'list-style-type: disc; margin-left: 20px; padding: 0;';
    });
    root.querySelectorAll('li').forEach(li => {
        li.style.cssText = 'margin-bottom: 6px; font-size: 13px; color: #334155; line-height: 1.5;';
    });
    root.querySelectorAll('strong').forEach(s => {
        s.style.cssText = 'color: #0f172a;';
    });
}

function buildSectionFromDom(containerId, contentId, title, wrapperStyles, titleStyles) {
    const container = document.getElementById(containerId);
    const content = document.getElementById(contentId);
    if (!container || container.classList.contains('hidden') || !content) return '';

    const clone = content.cloneNode(true);
    styleLists(clone);

    return `
        <div style="${wrapperStyles}">
            <div style="padding: 16px 24px;">
                <h4 style="${titleStyles}">${title}</h4>
                <div style="font-size: 13px; line-height: 1.6; color: #334155;">${clone.innerHTML}</div>
            </div>
        </div>`;
}

export async function sendSimulationEmail({ emailDestino, simulationData, relatorioTexto }) {
    const d = simulationData;
    const fmt = (val) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmt4 = (val) => val.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    const pct = (val) => (val * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

    const headerCartao = 'background: linear-gradient(to right, rgba(31,41,55,0.95), rgba(55,65,81,0.95));';
    const headerGlobal = 'background: linear-gradient(to right, #f97316, #fb923c);';
    const headerSaldo = 'background: linear-gradient(to right, #0284c7, #3b82f6);';
    const ringVencedor = 'border: 3px solid #fb923c; box-shadow: 0 0 0 4px rgba(251,146,60,0.15);';
    const ringNormal = 'border: 1px solid #e2e8f0;';

    const badgeMercado = d.global && d.global.is_plantao
        ? '<span style="display: inline-block; font-size: 11px; font-weight: bold; padding: 2px 12px; border-radius: 999px; background-color: rgba(251,146,60,0.12); color: #c2410c; margin-top: 4px;">Mercado Fechado</span>'
        : '<span style="display: inline-block; font-size: 11px; font-weight: bold; padding: 2px 12px; border-radius: 999px; background-color: rgba(34,197,94,0.12); color: #166534; margin-top: 4px;">Mercado Aberto</span>';

    let cartaoBloco = '';
    if (d.cartao && d.cartao.suportada) {
        const isWinner = d.melhorOpcao === 'cartao';
        cartaoBloco = `
        <div style="${isWinner ? ringVencedor : ringNormal} border-radius: 1.5rem; overflow: hidden; margin-bottom: 20px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="${headerCartao} color: #ffffff; text-align: center; padding: 14px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">💳 CARTÃO DE CRÉDITO${isWinner ? ' &nbsp;•&nbsp; Mais Barato' : ''}</div>
            <div style="padding: 24px 28px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 12px; margin-bottom: 12px;">
                    <div><p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Câmbio Base</p><p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${d.cartao.fonte_cotacao}</p></div>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${d.moeda} 1 = R$ ${fmt4(d.cartao.taxa_utilizada)}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 12px; margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Spread Itaú (${pct(d.cartao.spread_aplicado)})</p>
                    <p style="margin: 0; font-size: 14px; color: #1e293b;">+ R$ ${fmt(d.cartao.valor_spread)}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 12px; margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">IOF (${pct(d.cartao.iof_aplicado)})</p>
                    <p style="margin: 0; font-size: 14px; color: #1e293b;">+ R$ ${fmt(d.cartao.valor_iof)}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
                    <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">Total na Fatura</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a;">R$ ${fmt(d.cartao.valor_total_brl)}</p>
                </div>
            </div>
            <div style="background-color: rgba(255,255,255,0.5); padding: 14px; text-align: center; border-top: 1px solid rgba(255,255,255,0.6);">
                <p style="margin: 0; font-size: 14px; font-weight: bold; letter-spacing: 0.02em; color: #1e293b;">VET Final: ${d.moeda} 1 = R$ ${fmt4(d.cartao.vet)}</p>
            </div>
        </div>`;
    }

    let globalBloco = '';
    if (d.global && d.global.suportada) {
        const isWinner = d.melhorOpcao === 'global';
        globalBloco = `
        <div style="${isWinner ? ringVencedor : ringNormal} border-radius: 1.5rem; overflow: hidden; margin-bottom: 20px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="${headerGlobal} color: #ffffff; text-align: center; padding: 14px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">🌎 CONTA GLOBAL — COMPRA AGORA${isWinner ? ' &nbsp;•&nbsp; Mais Barato' : ''}</div>
            <div style="padding: 24px 28px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 12px; margin-bottom: 12px;">
                    <div><p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Câmbio Base</p><p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${d.global.fonte_cotacao}</p></div>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${d.moeda} 1 = R$ ${fmt4(d.global.taxa_utilizada)}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 12px; margin-bottom: 12px;">
                    <div><p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Spread Institucional (${pct(d.global.spread_aplicado)})</p>${badgeMercado}</div>
                    <p style="margin: 0; font-size: 14px; color: #1e293b;">+ R$ ${fmt(d.global.valor_spread)}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 12px; margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">IOF (${pct(d.global.iof_aplicado)})</p>
                    <p style="margin: 0; font-size: 14px; color: #1e293b;">+ R$ ${fmt(d.global.valor_iof)}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
                    <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">Total Debitado</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 900; color: #ea580c;">R$ ${fmt(d.global.valor_total_brl)}</p>
                </div>
            </div>
            <div style="background-color: rgba(255,247,237,0.7); padding: 14px; text-align: center; border-top: 1px solid rgba(255,237,213,0.6);">
                <p style="margin: 0; font-size: 14px; font-weight: bold; letter-spacing: 0.02em; color: #9a3412;">VET Final: ${d.moeda} 1 = R$ ${fmt4(d.global.vet)}</p>
            </div>
        </div>`;
    }

    let saldoBloco = '';
    if (d.saldo_existente && d.saldo_existente.suportada) {
        const isWinner = d.melhorOpcao === 'saldo';
        saldoBloco = `
        <div style="${isWinner ? ringVencedor : ringNormal} border-radius: 1.5rem; overflow: hidden; margin-bottom: 20px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="${headerSaldo} color: #ffffff; text-align: center; padding: 14px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">💼 CONTA GLOBAL — SALDO JÁ CARREGADO${isWinner ? ' &nbsp;•&nbsp; Mais Barato' : ''}</div>
            <div style="padding: 24px 28px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 12px; margin-bottom: 12px;">
                    <div><p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Metodologia</p><p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${d.saldo_existente.metodologia}</p></div>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">VET informado: R$ ${fmt4(d.saldo_existente.vet_informado)}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
                    <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">Custo Econômico do Gasto</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 900; color: #0369a1;">R$ ${fmt(d.saldo_existente.valor_total_brl)}</p>
                </div>
                <p style="margin: 12px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">Neste cenário, não há nova compra de moeda agora: o app usa o custo histórico do saldo já carregado informado por você.</p>
            </div>
            <div style="background-color: rgba(240,249,255,0.7); padding: 14px; text-align: center; border-top: 1px solid rgba(224,242,254,0.6);">
                <p style="margin: 0; font-size: 14px; font-weight: bold; letter-spacing: 0.02em; color: #0c4a6e;">VET Histórico: ${d.moeda} 1 = R$ ${fmt4(d.saldo_existente.vet)}</p>
            </div>
        </div>`;
    }

    let analiseIABloco = '';
    const aiResultDiv = document.getElementById('ai-result');
    if (aiResultDiv && !aiResultDiv.classList.contains('hidden') && aiResultDiv.innerHTML.trim()) {
        const aiClone = aiResultDiv.cloneNode(true);
        aiClone.querySelectorAll('.ai-bloco').forEach(bloco => {
            bloco.style.cssText = 'border: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;';
        });
        aiClone.querySelectorAll('.ai-tag').forEach(tag => {
            const isResumo = tag.classList.contains('ai-tag--resumo');
            const isRecomendacao = tag.classList.contains('ai-tag--recomendacao');
            const bgColor = isResumo ? 'rgba(234,88,12,0.12)' : isRecomendacao ? 'rgba(22,163,74,0.12)' : 'rgba(37,99,235,0.12)';
            const txtColor = isResumo ? '#9a3412' : isRecomendacao ? '#15803d' : '#1d4ed8';
            tag.style.cssText = `display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; border-radius: 999px; padding: 3px 9px; margin-bottom: 6px; background-color: ${bgColor}; color: ${txtColor};`;
        });
        aiClone.querySelectorAll('.ai-paragrafo').forEach(p => {
            p.style.cssText = 'margin: 0; text-align: justify; text-indent: 1.5em; color: #1f2937; line-height: 1.7; font-size: 14px;';
        });

        analiseIABloco = `
        <div style="border: 1px solid #e2e8f0; border-radius: 1.5rem; overflow: hidden; margin-top: 20px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: linear-gradient(to right, #0f172a, #1e293b); color: #ffffff; text-align: center; padding: 14px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">✨ Oráculo Financeiro — Análise da IA</div>
            <div style="padding: 24px 28px; color: #1f2937; font-size: 14px; line-height: 1.7;">
                ${aiClone.innerHTML}
            </div>
        </div>`;
    }

    const parametrosBloco = buildSectionFromDom(
        'parametros-vigentes',
        'parametros-vigentes-conteudo',
        'Parâmetros vigentes usados no cálculo',
        'border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; margin-top: 20px; font-family: system-ui, -apple-system, sans-serif; background-color: rgba(248,250,252,0.95);',
        'margin: 0 0 12px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #334155;'
    );

    const sensibilidadeBloco = buildSectionFromDom(
        'sensibilidade-cenarios',
        'sensibilidade-cenarios-conteudo',
        'Sensibilidade (otimista / base / pessimista)',
        'border: 1px solid #c7d2fe; border-radius: 1rem; overflow: hidden; margin-top: 20px; font-family: system-ui, -apple-system, sans-serif; background-color: rgba(238,242,255,0.95);',
        'margin: 0 0 12px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #4338ca;'
    );

    const backtestBloco = buildSectionFromDom(
        'backtest-indicadores',
        'backtest-indicadores-conteudo',
        'Qualidade da estimativa (Backtest 7 dias)',
        'border: 1px solid #a7f3d0; border-radius: 1rem; overflow: hidden; margin-top: 20px; font-family: system-ui, -apple-system, sans-serif; background-color: rgba(236,253,245,0.95);',
        'margin: 0 0 12px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #047857;'
    );

    const htmlFinal = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8">
        <!--[if mso]><style>div, p { font-family: Arial, sans-serif !important; }</style><![endif]-->
        </head>
        <body style="background-color: #f1f5f9; padding: 20px; margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;">
            <div style="max-width: 640px; margin: 0 auto; background: linear-gradient(135deg, #f8fafc, #fff7ed); border-radius: 2rem; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); border-top: 4px solid #f97316;">
                <div style="padding: 32px 30px 24px; text-align: center;">
                    <img src="data:image/webp;base64,${LOGO_B64}" alt="Itaú Personnalité" style="height: 48px; margin-bottom: 12px;" />
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: bold; margin: 0; line-height: 1.3;">Simulação<br>Itaú Personnalité</h1>
                    <p style="color: #475569; font-size: 16px; margin: 12px 0 0;">Valor: <strong style="color: #0f172a;">${d.moeda} ${fmt(d.valorBruto)}</strong><br>Data: ${d.dataBr}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 16px; padding: 0 30px; margin-bottom: 20px; opacity: 0.6;">
                    <div style="flex: 1; height: 1px; background-color: #6b7280;"></div>
                    <span style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.2em; white-space: nowrap;">Painel Comparativo</span>
                    <div style="flex: 1; height: 1px; background-color: #6b7280;"></div>
                </div>
                <div style="padding: 0 30px 24px;">
                    ${globalBloco}
                    ${saldoBloco}
                    ${cartaoBloco}
                    ${parametrosBloco}
                    ${sensibilidadeBloco}
                    ${backtestBloco}
                    ${analiseIABloco}
                </div>
                <div style="padding: 20px 30px; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: justify; line-height: 1.5; margin: 0;">
                        <strong>AVISO DE COMPLIANCE:</strong> Esta calculadora é uma ferramenta de simulação independente e não possui vínculo, homologação ou integração sistêmica com o Banco Itaú Unibanco S.A. Os cálculos e avaliações aqui gerados não são oficiais, não constituem oferta ou promessa de crédito e não substituem as informações emitidas pela instituição financeira. Para propostas reais e contratações, consulte exclusivamente os canais oficiais do banco.
                    </p>
                </div>
                <div style="background-color: #1e293b; color: #94a3b8; padding: 16px 30px; text-align: center; font-size: 12px;">
                    Simulação gerada pela Calculadora Itaú Personnalité
                </div>
            </div>
        </body>
        </html>
    `;

    const resp = await fetch('/api/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emailDestino,
            html: htmlFinal,
            relatorioTexto
        })
    });

    return { response: resp, data: await resp.json() };
}
