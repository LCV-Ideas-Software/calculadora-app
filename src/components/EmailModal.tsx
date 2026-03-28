/* ====================================================================
   EmailModal — Modal overlay com input de email
   ==================================================================== */

import { useState } from 'react';
import type { SimulationResponse, EmailSimulationData } from '../types/api.ts';
import { sendSimulationEmail } from '../services/email.ts';
import { showToast } from './Toast.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationResponse;
  melhorOpcao: string | null;
}

export default function EmailModal({ isOpen, onClose, result, melhorOpcao }: Props) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      showToast('Informe um e-mail válido.', 'error');
      return;
    }

    const data: EmailSimulationData = {
      moeda: result.moeda,
      valorBruto: result.valor_original,
      dataBr: result.data_compra.split('-').reverse().join('/'),
      melhorOpcao,
      cartao: result.cartao,
      global: result.global ?? null,
      saldo_existente: result.global_saldo_existente ?? null,
    };

    setSending(true);
    try {
      const res = await sendSimulationEmail(email, data);
      if (res.ok) {
        showToast(res.message, 'success');
        setEmail('');
        onClose();
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Erro ao enviar e-mail.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="email-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enviar relatório por e-mail"
    >
      <div
        className="email-modal-content glass-container rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-800 mb-1">📧 Enviar por E-mail</h3>
        <p className="text-sm text-slate-500 mb-4">Receba o relatório completo no seu e-mail.</p>

        <input
          type="email"
          placeholder="seu@email.com"
          className="glass-input w-full rounded-xl px-4 py-3 text-sm text-slate-800 mb-4"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: sending ? '#94a3b8' : 'linear-gradient(135deg, #ea580c, #f97316)',
              cursor: sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? '⏳ Enviando...' : '📨 Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
