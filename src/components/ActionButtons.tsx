/* ====================================================================
   ActionButtons — Copiar / WhatsApp / E-Mail
   ==================================================================== */

import type { SimulationResponse } from '../types/api.ts';
import { buildCopyText, shareViaWhatsApp } from '../services/whatsapp.ts';
import { showToast } from './Toast.tsx';

interface Props {
  result: SimulationResponse;
  melhorOpcao: string | null;
  onEmailClick: () => void;
}

export default function ActionButtons({ result, melhorOpcao, onEmailClick }: Props) {
  const handleCopy = async () => {
    const text = buildCopyText(result, melhorOpcao);
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 Copiado para a área de transferência!', 'success');
    } catch {
      showToast('Não foi possível copiar.', 'error');
    }
  };

  const handleWhatsApp = () => {
    shareViaWhatsApp(result, melhorOpcao);
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      <ActionBtn emoji="📋" label="Copiar" onClick={handleCopy} bg="rgba(37,99,235,0.08)" color="#1d4ed8" />
      <ActionBtn emoji="💬" label="WhatsApp" onClick={handleWhatsApp} bg="rgba(22,163,74,0.08)" color="#15803d" />
      <ActionBtn emoji="📧" label="E-mail" onClick={onEmailClick} bg="rgba(168,85,247,0.08)" color="#7e22ce" />
    </div>
  );
}

function ActionBtn({ emoji, label, onClick, bg, color }: {
  emoji: string; label: string; onClick: () => void; bg: string; color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105"
      style={{ background: bg, color, border: `1px solid ${color}22` }}
    >
      {emoji} {label}
    </button>
  );
}
