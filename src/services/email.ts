/* ====================================================================
   Calculadora App — Email Service
   Extração de public/js/email-feature.js
   ==================================================================== */

import type { EmailSimulationData, ChannelResult } from '../types/api.ts';
import { fmt, pct, moedaParaSimbolo, APP_VERSION } from './formatting.ts';

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
      destinatario: emailDestino,
      assunto: `Simulação ${data.moeda} — Calculadora Itaú Personnalité`,
      html: htmlBody,
      versao: APP_VERSION,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, message: json?.erro || `Erro ${res.status}` };
  }
  return { ok: true, message: json?.mensagem || 'E-mail enviado com sucesso!' };
}

/* ------- HTML Builder ------- */

function buildChannelSection(label: string, ch: ChannelResult, simbolo: string): string {
  return `
    <tr><td colspan="2" style="padding:12px 0 6px;font-weight:700;font-size:14px;color:#1e3a8a;border-bottom:1px solid #e2e8f0;">${label}</td></tr>
    <tr><td style="padding:6px 0;color:#475569;">Taxa utilizada</td><td style="text-align:right;color:#0f172a;">${fmt(ch.taxa_utilizada)}</td></tr>
    <tr><td style="padding:6px 0;color:#475569;">Spread</td><td style="text-align:right;color:#0f172a;">${pct(ch.spread_aplicado)} (${simbolo} ${fmt(ch.valor_spread)})</td></tr>
    <tr><td style="padding:6px 0;color:#475569;">IOF</td><td style="text-align:right;color:#0f172a;">${pct(ch.iof_aplicado)} (R$ ${fmt(ch.valor_iof)})</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-weight:700;">Total em Reais</td><td style="text-align:right;color:#0f172a;font-weight:700;font-size:15px;">R$ ${fmt(ch.valor_total_brl)}</td></tr>
    <tr><td style="padding:6px 0;color:#475569;">VET</td><td style="text-align:right;color:#64748b;">R$ ${fmt(ch.vet)}</td></tr>
  `;
}

function buildEmailHtml(data: EmailSimulationData): string {
  const simbolo = moedaParaSimbolo(data.moeda);
  const melhor = data.melhorOpcao ?? '—';

  let channelsSections = buildChannelSection('💳 Cartão de Crédito', data.cartao, simbolo);

  if (data.global) {
    channelsSections += buildChannelSection('🌐 Conta Global (Compra Agora)', data.global, simbolo);
  }

  if (data.saldo_existente) {
    channelsSections += buildChannelSection('💰 Conta Global (Saldo Existente)', data.saldo_existente, simbolo);
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:28px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Calculadora Itaú Personnalité</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Relatório de Simulação</p>
      </td>
    </tr>
    <!-- Summary -->
    <tr>
      <td style="padding:24px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px;">
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Moeda</td><td style="text-align:right;color:#0f172a;font-weight:600;">${data.moeda}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Valor</td><td style="text-align:right;color:#0f172a;font-weight:600;">${simbolo} ${fmt(data.valorBruto)}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Data</td><td style="text-align:right;color:#0f172a;font-weight:600;">${data.dataBr}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Melhor Opção</td><td style="text-align:right;color:#15803d;font-weight:700;">${melhor}</td></tr>
        </table>
      </td>
    </tr>
    <!-- Channels -->
    <tr>
      <td style="padding:20px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${channelsSections}
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 28px 24px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">${APP_VERSION} · Gerado em ${new Date().toLocaleString('pt-BR')}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
