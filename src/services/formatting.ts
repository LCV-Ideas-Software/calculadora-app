/*
 * Copyright © 2026 LCV Ideas & Software
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — Formatting Service
   Funções de formatação numérica e moeda
   ==================================================================== */

const APP_VERSION = 'APP v04.02.01';

export { APP_VERSION };

const brlFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl4Formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

/** Formata valor com 2 casas decimais padrão BR (ex: 1.234,56) */
export function fmt(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return brlFormatter.format(v);
}

/** Formata valor com 4 casas decimais padrão BR (ex: 5,7340) */
export function fmt4(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return brl4Formatter.format(v);
}

/** Formata fração como percentual com 2 casas (ex: 0,0638 → 6,38%) */
export function pct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${brlFormatter.format(v * 100)}%`;
}

/**
 * Converte input localizado em número, detectando o último separador como
 * decimal (BR "1.234,56" → 1234.56; en-US "1,234.56" → 1234.56; "5.5" → 5.5).
 */
export function parseLocalizedNumber(str: string): number {
  if (!str) return NaN;
  const s = str.trim();
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalized: string;
  if (lastDot >= 0 && lastComma >= 0) {
    // Ambos presentes: o último é o decimal, o outro é separador de milhar
    normalized = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    // Só vírgula: decimal BR
    normalized = s.replace(',', '.');
  } else {
    // Só ponto (ou nenhum separador): ponto é decimal
    normalized = s;
  }
  return parseFloat(normalized);
}

/** Formata taxa de spread como input display: 3.5 → "3,50" */
export function formatPercentInputFromRate(rate: number): string {
  return brlFormatter.format(rate);
}

/** Mapa de siglas de moeda para símbolo display */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: 'US$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'Fr.',
  CAD: 'C$',
  AUD: 'A$',
  ARS: 'AR$',
  CLP: 'CL$',
  COP: 'CO$',
  MXN: 'MX$',
  PEN: 'S/.',
  UYU: 'UY$',
  PYG: '₲',
  BOB: 'Bs.',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  THB: '฿',
  ILS: '₪',
  TRY: '₺',
  ZAR: 'R',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  HRK: 'kn',
  RUB: '₽',
  UAH: '₴',
  EGP: 'E£',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  MAD: 'د.م.',
  SAR: '﷼',
  AED: 'د.إ',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: '.د.ب',
  OMR: '﷼',
  JOD: 'د.ا',
  TWD: 'NT$',
  SGD: 'S$',
  HKD: 'HK$',
  MYR: 'RM',
  PHP: '₱',
  IDR: 'Rp',
  VND: '₫',
  PKR: '₨',
  BDT: '৳',
  LKR: '₨',
  NZD: 'NZ$',
  FJD: 'FJ$',
};

export function moedaParaSimbolo(codigo: string): string {
  return CURRENCY_SYMBOLS[codigo] ?? codigo;
}

/** Formata duração em milissegundos para legível curto: "1.5s", "230ms" */
export function formatDurationShort(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

/** Moedas que possuem suporte completo (Cartão + Global) */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'];

/** Verifica se a moeda tem suporte completo (não-exótica) */
export function isCurrencySupported(codigo: string): boolean {
  return SUPPORTED_CURRENCIES.includes(codigo);
}
