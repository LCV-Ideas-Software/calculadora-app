/* ====================================================================
   Calculadora App — Root Component
   Composição de todos os módulos
   ==================================================================== */

import { useState } from 'react';
import { useSimulation } from './hooks/useSimulation.ts';
import { useOraculo } from './hooks/useOraculo.ts';
import { APP_VERSION } from './services/formatting.ts';

import BackgroundCanvas from './components/BackgroundCanvas.tsx';
import Toast from './components/Toast.tsx';
import SimulationForm from './components/SimulationForm.tsx';
import ResultPanel from './components/ResultPanel.tsx';
import ActionButtons from './components/ActionButtons.tsx';
import OracleSection from './components/OracleSection.tsx';
import EmailModal from './components/EmailModal.tsx';
import ScrollControls from './components/ScrollControls.tsx';

export default function App() {
  const simulation = useSimulation();
  const oracle = useOraculo();
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  return (
    <>
      <BackgroundCanvas />
      <Toast />

      {/* Main container — glassmorphism frame */}
      <main className="relative z-10 min-h-screen flex items-start justify-center py-8 px-4">
        <div
          className="glass-container rounded-3xl w-full transicao-panoramica frame-fluid"
          style={{ maxWidth: simulation.result ? 1200 : 580 }}
        >
          {/* Header */}
          <header className="text-center pt-8 pb-4 px-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src="/Itau_Personnalite.webp"
                alt="Itaú Personnalité"
                className="h-8 w-auto"
                loading="eager"
              />
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                Calculadora Itaú Personnalité
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Simulador comparativo inteligente de câmbio internacional
            </p>
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
            <div className="save-badge mx-6">
              ✅ Simulação concluída — resultado atualizado
            </div>
          )}

          {/* Results */}
          {simulation.result && (
            <section className="px-6 pb-4" aria-label="Resultados da simulação">
              <ResultPanel
                result={simulation.result}
                melhorOpcao={simulation.melhorOpcao}
              />

              {/* Action buttons */}
              <ActionButtons
                result={simulation.result}
                melhorOpcao={simulation.melhorOpcao}
                onEmailClick={() => setEmailModalOpen(true)}
              />

              {/* Oracle AI */}
              <OracleSection
                oracle={oracle}
                payload={simulation.oraclePayload}
              />
            </section>
          )}

          {/* Footer */}
          <footer className="text-center py-4 px-6">
            <p className="text-[10px] text-slate-400">
              {APP_VERSION} · Dados de mercado sujeitos a variação
            </p>
          </footer>
        </div>
      </main>

      {/* Email modal */}
      {simulation.result && (
        <EmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          result={simulation.result}
          melhorOpcao={simulation.melhorOpcao}
        />
      )}

      {/* Scroll controls */}
      <ScrollControls />
    </>
  );
}
