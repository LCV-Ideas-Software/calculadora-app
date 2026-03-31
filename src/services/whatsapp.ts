/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — WhatsApp / Copy Service
   Build de mensagens formatadas para compartilhamento
   ==================================================================== */

import type { SimulationResponse } from '../types/api.ts';
import { fmt, pct, moedaParaSimbolo, APP_VERSION } from './formatting.ts';

/**
 * Constrói mensagem WhatsApp-friendly com emojis.
 */
export function buildWhatsAppMessage(
  res: SimulationResponse,
  melhorOpcao: string | null,
): string {
  const simbolo = moedaParaSimbolo(res.moeda);
  const lines: string[] = [];

  lines.push(`💱 *Simulação ${res.moeda}*`);
  lines.push(`📅 ${res.data_compra}`);
  lines.push(`💵 Valor: ${simbolo} ${fmt(res.valor_original)}`);
  lines.push('');

  // Cartão
  if (res.cartao?.suportada) {
    const c = res.cartao;
    lines.push('💳 *Cartão de Crédito*');
    lines.push(`  Total: R$ ${fmt(c.valor_total_brl)}`);
    lines.push(`  VET: R$ ${fmt(c.vet)}`);
    lines.push(`  IOF: ${pct(c.iof_aplicado)} · Spread: ${pct(c.spread_aplicado)}`);
    lines.push('');
  }

  // Global
  if (res.global?.suportada) {
    const g = res.global;
    lines.push('🌐 *Conta Global (Compra Agora)*');
    lines.push(`  Total: R$ ${fmt(g.valor_total_brl)}`);
    lines.push(`  VET: R$ ${fmt(g.vet)}`);
    lines.push(`  IOF: ${pct(g.iof_aplicado)} · Spread: ${pct(g.spread_aplicado)}`);
    lines.push('');
  }

  // Saldo existente
  if (res.global_saldo_existente?.suportada) {
    const s = res.global_saldo_existente;
    lines.push('💰 *Saldo Existente*');
    lines.push(`  Total: R$ ${fmt(s.valor_total_brl)}`);
    lines.push(`  VET hist.: R$ ${fmt(s.vet)}`);
    lines.push('');
  }

  if (melhorOpcao) {
    lines.push(`✅ *Melhor opção: ${melhorOpcao}*`);
    lines.push('');
  }

  lines.push(`_${APP_VERSION}_`);

  return lines.join('\n');
}

/**
 * Constrói texto para área de transferência (sem formatação WhatsApp).
 */
export function buildCopyText(
  res: SimulationResponse,
  melhorOpcao: string | null,
): string {
  // Reutiliza mensagem removendo formatação WA (*, _)
  return buildWhatsAppMessage(res, melhorOpcao)
    .replace(/\*/g, '')
    .replace(/_/g, '');
}

/**
 * Abre WhatsApp com mensagem pré-formatada.
 */
export function shareViaWhatsApp(
  res: SimulationResponse,
  melhorOpcao: string | null,
): void {
  const text = buildWhatsAppMessage(res, melhorOpcao);
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}
