/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — Email Service
   Extração de public/js/email-feature.js
   ==================================================================== */

import type { ChannelResult, EmailSimulationData } from '../types/api.ts';
import { APP_VERSION, fmt, fmt4, moedaParaSimbolo, pct } from './formatting.ts';

/**
 * Envia relatório de simulação por email via backend.
 */
export async function sendSimulationEmail(
  emailDestino: string,
  data: EmailSimulationData,
): Promise<{ ok: boolean; message: string }> {
  const htmlBody = buildEmailHtml(data);

  const res = await fetch('/api/enviar-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailDestino,
      html: htmlBody,
      relatorioTexto: `Simulação ${data.moeda} — ${APP_VERSION}`,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, message: json?.error || `Erro ${res.status}` };
  }
  return { ok: true, message: json?.message || 'E-mail enviado com sucesso!' };
}

/* ------- HTML Builder ------- */

/** Paletas por canal — espelham os gradients do ComparisonCard.tsx */
const CHANNEL_STYLES = {
  cartao: {
    icon: '💳',
    title: 'Cartão de Crédito',
    bg: 'linear-gradient(135deg, rgba(37,99,235,0.07), rgba(99,102,241,0.07))',
    headerColor: '#1d4ed8',
    borderColor: '#bfdbfe',
  },
  global: {
    icon: '🌐',
    title: 'Conta Global — Compra Agora',
    bg: 'linear-gradient(135deg, rgba(168,85,247,0.07), rgba(236,72,153,0.07))',
    headerColor: '#7c3aed',
    borderColor: '#ddd6fe',
  },
  saldo: {
    icon: '💰',
    title: 'Conta Global — Saldo Existente',
    bg: 'linear-gradient(135deg, rgba(22,163,74,0.07), rgba(34,197,94,0.07))',
    headerColor: '#15803d',
    borderColor: '#bbf7d0',
  },
} as const;

type ChannelKey = keyof typeof CHANNEL_STYLES;

/** Monta uma métrica (label à esquerda, valor à direita) */
function metricRow(label: string, value: string, opts?: { bold?: boolean; muted?: boolean; hero?: boolean }): string {
  const labelStyle = `padding:7px 16px;color:#64748b;font-size:13px;`;
  const valueBase = opts?.hero
    ? `text-align:right;padding:7px 16px;font-size:18px;font-weight:800;color:#0f172a;`
    : opts?.bold
      ? `text-align:right;padding:7px 16px;font-weight:700;color:#0f172a;font-size:14px;`
      : opts?.muted
        ? `text-align:right;padding:7px 16px;color:#94a3b8;font-size:12px;`
        : `text-align:right;padding:7px 16px;color:#334155;font-weight:600;font-size:13px;`;

  return `<tr><td style="${labelStyle}">${label}</td><td style="${valueBase}">${value}</td></tr>`;
}

/** Monta o card de um canal — visual espelhado do ComparisonCard.tsx */
function buildChannelCard(key: ChannelKey, ch: ChannelResult, simbolo: string, isWinner: boolean): string {
  const s = CHANNEL_STYLES[key];

  const winnerBadge = isWinner
    ? `<td style="text-align:right;"><span style="display:inline-block;background:#fbbf24;color:#78350f;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;">⭐ MELHOR</span></td>`
    : '';

  const winnerBorder = isWinner
    ? 'border:2px solid #fbbf24;box-shadow:0 0 0 3px rgba(251,191,36,0.18),0 12px 28px -8px rgba(251,191,36,0.12);'
    : `border:1px solid ${s.borderColor};box-shadow:0 8px 24px -8px rgba(0,0,0,0.05);`;

  // Badges extras (plantão / contingência)
  let badges = '';
  if (ch.is_plantao) {
    badges += `<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-right:4px;">🌙 Plantão</span>`;
  }
  if (ch.usou_contingencia) {
    badges += `<span style="display:inline-block;background:#ffedd5;color:#9a3412;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">⚡ Contingência</span>`;
  }

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${s.bg};border-radius:16px;${winnerBorder}margin-bottom:16px;overflow:hidden;">
    <!-- Card header -->
    <tr>
      <td style="padding:14px 16px 10px;" ${winnerBadge ? '' : 'colspan="2"'}>
        <span style="font-size:18px;vertical-align:middle;">${s.icon}</span>
        <span style="font-size:15px;font-weight:700;color:${s.headerColor};vertical-align:middle;margin-left:6px;">${s.title}</span>
      </td>
      ${winnerBadge}
    </tr>
    <!-- Metrics -->
    ${metricRow('Taxa utilizada', `R$ ${fmt4(ch.taxa_utilizada)}`)}
    ${metricRow('Fonte cotação', ch.fonte_cotacao ?? '—', { muted: true })}
    ${metricRow('Spread', `${pct(ch.spread_aplicado)} (${simbolo} ${fmt(ch.valor_spread)})`)}
    ${metricRow('IOF', `${pct(ch.iof_aplicado)} (R$ ${fmt(ch.valor_iof)})`)}
    <!-- Separator -->
    <tr><td colspan="2" style="padding:0 16px;"><div style="border-top:1px solid ${s.borderColor};"></div></td></tr>
    <!-- Hero total -->
    ${metricRow('Total em Reais', `R$ ${fmt(ch.valor_total_brl)}`, { hero: true })}
    ${metricRow('VET', `R$ ${fmt4(ch.vet)}`, { muted: true })}
    ${badges ? `<tr><td colspan="2" style="padding:6px 16px 12px;">${badges}</td></tr>` : ''}
  </table>`;
}

function buildEmailHtml(data: EmailSimulationData): string {
  const simbolo = moedaParaSimbolo(data.moeda);
  const melhor = data.melhorOpcao ?? '—';

  // Determinar winner key
  const winnerKey: ChannelKey | null = melhor.includes('Cartão')
    ? 'cartao'
    : melhor.includes('Saldo')
      ? 'saldo'
      : melhor.includes('Global')
        ? 'global'
        : null;

  // Montar cards dos canais disponíveis
  let cards = buildChannelCard('cartao', data.cartao, simbolo, winnerKey === 'cartao');
  if (data.global) {
    cards += buildChannelCard('global', data.global, simbolo, winnerKey === 'global');
  }
  if (data.saldo_existente) {
    cards += buildChannelCard('saldo', data.saldo_existente, simbolo, winnerKey === 'saldo');
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',sans-serif;background:linear-gradient(135deg,#f0f4ff 0%,#e8eaf6 50%,#f5e6ff 100%);-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:32px auto;">
    <tr><td>

      <!-- ===== Main Card ===== -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.92);border-radius:24px;overflow:hidden;box-shadow:0 20px 60px -12px rgba(0,0,0,0.08),0 0 0 1px rgba(255,255,255,0.7);backdrop-filter:blur(20px);">

        <!-- Header gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 28px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">Calculadora Financeira</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.65);font-size:13px;font-weight:500;">Simulador comparativo inteligente de câmbio internacional</p>
          </td>
        </tr>

        <!-- Summary pills -->
        <tr>
          <td style="padding:24px 24px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:14px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:14px 18px;color:#64748b;font-size:13px;font-weight:500;">Moeda</td>
                <td style="padding:14px 18px;text-align:right;font-weight:700;color:#1e293b;font-size:14px;">${data.moeda}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0 18px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
              </tr>
              <tr>
                <td style="padding:14px 18px;color:#64748b;font-size:13px;font-weight:500;">Valor</td>
                <td style="padding:14px 18px;text-align:right;font-weight:700;color:#1e293b;font-size:14px;">${simbolo} ${fmt(data.valorBruto)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0 18px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
              </tr>
              <tr>
                <td style="padding:14px 18px;color:#64748b;font-size:13px;font-weight:500;">Data</td>
                <td style="padding:14px 18px;text-align:right;font-weight:700;color:#1e293b;font-size:14px;">${data.dataBr}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Winner badge -->
        <tr>
          <td style="padding:12px 24px;text-align:center;">
            <span style="display:inline-block;background:linear-gradient(135deg,#f0fdf4,#dcfce7);color:#15803d;font-size:13px;font-weight:700;padding:8px 20px;border-radius:28px;border:1px solid #bbf7d0;">✅ ${melhor}</span>
          </td>
        </tr>

        <!-- Channel cards -->
        <tr>
          <td style="padding:8px 24px 24px;">
            ${cards}
          </td>
        </tr>

        ${
          data.oracleHtml
            ? `
        <!-- Oracle AI Analysis -->
        <tr>
          <td style="padding:0 24px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(124,58,237,0.05),rgba(99,102,241,0.05));border-radius:16px;border:1px solid #ddd6fe;overflow:hidden;">
              <tr>
                <td style="padding:14px 18px 10px;">
                  <span style="font-size:16px;vertical-align:middle;">🤖</span>
                  <span style="font-size:14px;font-weight:700;color:#7c3aed;vertical-align:middle;margin-left:6px;">Análise Inteligente (IA)</span>
                </td>
              </tr>
              <tr>
                <td style="padding:0 18px 16px;">
                  <div style="font-size:13px;color:#334155;line-height:1.7;">
                    ${data.oracleHtml}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        `
            : ''
        }

        <!-- Compliance -->
        <tr>
          <td style="padding:0 24px 16px;">
            <p style="margin:0;color:#94a3b8;font-size:10px;line-height:1.5;text-align:justify;">
              <strong>AVISO DE COMPLIANCE:</strong> Esta calculadora é uma ferramenta de simulação independente e não possui vínculo, homologação ou integração sistêmica com qualquer instituição financeira específica. Os cálculos e avaliações aqui gerados não são oficiais, não constituem oferta ou promessa de crédito e não substituem as informações emitidas pela instituição financeira.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:12px 24px 20px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#cbd5e1;font-size:11px;font-weight:500;">${APP_VERSION} · Gerado em ${new Date().toLocaleString('pt-BR')}</p>
          </td>
        </tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}
