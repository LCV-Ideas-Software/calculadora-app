/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Toast — Global notification component
   ==================================================================== */

import { useState, useCallback, useEffect, useRef } from 'react';

export type ToastType = 'info' | 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

let globalShowToast: ((message: string, type?: ToastType, durationMs?: number) => void) | null = null;

/** Imperativa: permite disparar toast de qualquer módulo */
export function showToast(message: string, type: ToastType = 'info', durationMs = 3500): void {
  globalShowToast?.(message, type, durationMs);
}

const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  info:    { bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)',  text: '#1d4ed8' },
  success: { bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.25)',  text: '#15803d' },
  error:   { bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.25)', text: '#b91c1c' },
};

export default function Toast() {
  const [state, setState] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = 'info', durationMs = 3500) => {
    if (timer.current) clearTimeout(timer.current);
    setState({ message, type, visible: true });
    timer.current = setTimeout(() => setState(prev => ({ ...prev, visible: false })), durationMs);
  }, []);

  useEffect(() => {
    globalShowToast = show;
    return () => { globalShowToast = null; };
  }, [show]);

  if (!state.visible) return null;
  const c = COLORS[state.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        padding: '12px 24px',
        borderRadius: 12,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 14,
        fontWeight: 600,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        animation: 'slideUp 0.3s ease',
        maxWidth: '90vw',
      }}
    >
      {state.message}
    </div>
  );
}
