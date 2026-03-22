function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function markdownBasico(texto) {
    return texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function detectarClasseTagAI(texto) {
    const normalizado = texto.toLowerCase();
    if (normalizado.startsWith('resumo executivo:')) return 'ai-tag--resumo';
    if (normalizado.startsWith('base matemática:') || normalizado.startsWith('base matematica:')) return 'ai-tag--base';
    if (normalizado.startsWith('recomendação prática:') || normalizado.startsWith('recomendacao pratica:')) return 'ai-tag--recomendacao';
    return 'ai-tag--base';
}

export function formatarAnaliseIA(textoBruto) {
    const textoSeguro = escaparHtml(textoBruto || 'Análise concluída sem retorno de texto.');
    const paragrafos = textoSeguro
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

    if (!paragrafos.length) {
        return '<div class="ai-bloco"><p class="ai-paragrafo">Análise concluída sem retorno de texto.</p></div>';
    }

    return paragrafos.map((paragrafo) => {
        const htmlParagrafo = markdownBasico(paragrafo).replace(/\n/g, '<br>');
        const classeTag = detectarClasseTagAI(paragrafo);

        return `
            <div class="ai-bloco">
                <span class="ai-tag ${classeTag}">${classeTag === 'ai-tag--resumo' ? 'Resumo Executivo' : classeTag === 'ai-tag--recomendacao' ? 'Recomendação Prática' : 'Base Matemática'}</span>
                <p class="ai-paragrafo">${htmlParagrafo}</p>
            </div>
        `;
    }).join('');
}

export async function obterAnaliseOraculo(payloadGlobalParaIA) {
    const response = await fetch('/api/oraculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadGlobalParaIA)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.erro || 'Falha ao consultar o Oráculo.');
    }

    return formatarAnaliseIA(data.analise);
}
