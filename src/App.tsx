/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — Root Component
   Composição de todos os módulos
   ==================================================================== */

import { useState } from 'react';
import ActionButtons from './components/ActionButtons.tsx';
import BackgroundCanvas from './components/BackgroundCanvas.tsx';
import { ComplianceBanner } from './components/ComplianceBanner';
import ContactModal from './components/ContactModal.tsx';
import EmailModal from './components/EmailModal.tsx';
import OracleSection from './components/OracleSection.tsx';
import ResultPanel from './components/ResultPanel.tsx';
import ScrollControls from './components/ScrollControls.tsx';
import SimulationForm from './components/SimulationForm.tsx';
import Toast from './components/Toast.tsx';
import { useOraculo } from './hooks/useOraculo.ts';
import { useSimulation } from './hooks/useSimulation.ts';
import { LicencasModule } from './modules/compliance/LicencasModule';
import { APP_VERSION } from './services/formatting.ts';

export default function App() {
  const simulation = useSimulation();
  const oracle = useOraculo();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);

  return (
    <>
      <BackgroundCanvas />
      <Toast />

      {/* Main container — glassmorphism frame */}
      {!showLicenses ? (
        <main className="relative z-10 min-h-screen flex items-start justify-center py-8 px-4">
          <div
            className="glass-container rounded-3xl w-full transicao-panoramica frame-fluid"
            style={{ maxWidth: simulation.result ? 1200 : 580 }}
          >
            {/* Header */}
            <header className="text-center pt-8 pb-4 px-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src="/Itau_Personnalite.webp" alt="Itaú Personnalité" className="h-8 w-auto" loading="eager" />
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                  Calculadora Itaú Personnalité
                </h1>
              </div>
              <p className="text-sm text-slate-500">Simulador comparativo inteligente de câmbio internacional</p>
            </header>

            {/* Form */}
            <section className="px-6 pb-4" aria-label="Formulário de simulação">
              <SimulationForm
                form={simulation.form}
                setField={simulation.setField}
                onSubmit={simulation.handleSubmit}
                loading={simulation.loading}
                error={simulation.error}
              />
            </section>

            {/* Save badge */}
            {simulation.saveBadge && (
              <div className="save-badge mx-6">✅ Simulação concluída — resultado atualizado</div>
            )}

            {/* Results */}
            {simulation.result && (
              <section className="px-6 pb-4" aria-label="Resultados da simulação">
                <ResultPanel result={simulation.result} melhorOpcao={simulation.melhorOpcao} />

                {/* Action buttons */}
                <ActionButtons
                  result={simulation.result}
                  melhorOpcao={simulation.melhorOpcao}
                  onEmailClick={() => setEmailModalOpen(true)}
                />

                {/* Oracle AI */}
                <OracleSection oracle={oracle} payload={simulation.oraclePayload} />
              </section>
            )}

            {/* Footer — Compliance */}
            <footer className="px-6 pb-6 pt-4">
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/80 hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider transition-all hover:shadow-md"
                >
                  📩 Contato
                </button>
              </div>
              <div className="mt-6 border-t border-gray-300/40 pt-6">
                <p className="text-[11px] text-gray-400 text-justify leading-relaxed">
                  <strong>AVISO DE COMPLIANCE:</strong> Esta calculadora é uma ferramenta de simulação independente e
                  não possui vínculo, homologação ou integração sistêmica com o Banco Itaú Unibanco S.A. Os cálculos e
                  avaliações aqui gerados não são oficiais, não constituem oferta ou promessa de crédito e não
                  substituem as informações emitidas pela instituição financeira. Para propostas reais e contratações,
                  consulte exclusivamente os canais oficiais do banco.
                </p>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-4">
                {APP_VERSION} · Dados de mercado sujeitos a variação
              </p>
            </footer>
          </div>
        </main>
      ) : (
        <main className="relative z-10 min-h-screen flex items-start justify-center py-8 px-4">
          <div
            className="glass-container rounded-3xl w-full transicao-panoramica frame-fluid p-6 lg:p-8"
            style={{ maxWidth: 1000, background: 'rgba(255,255,255,0.95)' }}
          >
            <LicencasModule />
            <div className="flex justify-center mt-8 mb-4">
              <button
                type="button"
                onClick={() => setShowLicenses(false)}
                className="px-6 py-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all shadow-sm"
              >
                Voltar à Calculadora
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Email modal */}
      {simulation.result && (
        <EmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          result={simulation.result}
          melhorOpcao={simulation.melhorOpcao}
          oracleHtml={oracle.html}
        />
      )}

      {/* Contact modal */}
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* Scroll controls */}
      <ScrollControls />
      <ComplianceBanner onViewLicenses={() => setShowLicenses(true)} />
    </>
  );
}
