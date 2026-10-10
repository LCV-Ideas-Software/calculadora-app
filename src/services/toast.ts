/*
 * Copyright © 2026 LCV Ideas & Software
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
export type ToastType = 'info' | 'success' | 'error';

type ToastHandler = (message: string, type?: ToastType, durationMs?: number) => void;

let globalShowToast: ToastHandler | null = null;

export function setToastHandler(handler: ToastHandler | null): void {
  globalShowToast = handler;
}

/** Imperativa: permite disparar toast de qualquer módulo */
export function showToast(message: string, type: ToastType = 'info', durationMs = 3500): void {
  globalShowToast?.(message, type, durationMs);
}
