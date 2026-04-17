/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   ContactModal — Formulário de Contato modal overlay
   Paridade com Astrólogo e Oráculo Financeiro
   ==================================================================== */

import { useState } from 'react';
import { showToast } from './Toast.tsx';

interface ContactForm {
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** Máscara de telefone brasileiro: (XX) X XXXX-XXXX */
function phoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').substring(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ContactModal({ isOpen, onClose }: Props) {
  const [form, setForm] = useState<ContactForm>({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast('Preencha nome, e-mail e mensagem.', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.ok) {
        showToast(json.message ?? 'Mensagem enviada com sucesso!', 'success');
        setForm({ name: '', phone: '', email: '', message: '' });
        onClose();
      } else {
        showToast(json?.error ?? `Erro ${res.status}`, 'error');
      }
    } catch {
      showToast('Erro na comunicação com o servidor.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      tabIndex={-1}
    >
      <div
        className="glass-container rounded-2xl p-6 w-full max-w-md mx-4"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)' }}
      >
        <h3 id="contact-modal-title" className="text-lg font-bold text-slate-800 mb-1">
          📩 Formulário de Contato
        </h3>
        <p className="text-sm text-slate-500 mb-4">Entre em contato e responderemos o mais breve possível.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            type="text"
            placeholder="Seu Nome"
            autoComplete="name"
            className="glass-input w-full rounded-xl px-4 py-3 text-sm text-slate-800"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <div className="flex gap-3">
            <input
              type="tel"
              placeholder="Telefone"
              autoComplete="tel-national"
              inputMode="tel"
              maxLength={16}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm text-slate-800"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: phoneMask(e.target.value) }))}
            />
            <input
              required
              type="email"
              placeholder="E-mail"
              autoComplete="email"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm text-slate-800"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <textarea
            required
            placeholder="Sua mensagem..."
            maxLength={500}
            rows={4}
            className="glass-input w-full rounded-xl px-4 py-3 text-sm text-slate-800 resize-none"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: sending ? '#94a3b8' : 'linear-gradient(135deg, #ea580c, #f97316)',
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? '⏳ Enviando...' : '📨 Enviar Mensagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
