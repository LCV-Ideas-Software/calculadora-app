/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — useSimulation Hook
   Form state + validation + fetch + results
   ==================================================================== */

import { useState, useCallback, useRef } from 'react';
import type { SimulationPayload, SimulationResponse, MelhorOpcaoCandidato, OraclePayload } from '../types/api.ts';
import { fetchSimulation } from '../services/api.ts';
import { parseLocalizedNumber, isCurrencySupported } from '../services/formatting.ts';

export interface SimulationFormState {
  moeda: string;
  dataCompra: string;
  valorOriginal: string;
  vetSaldoExistente: string;
  spreadPercent: string;
  iofPercent: string;
  globalSpreadAberto: string;
  globalSpreadFechado: string;
  backtestMapeBoa: string;
  backtestMapeAtencao: string;
}

const DEFAULT_FORM: SimulationFormState = {
  moeda: 'USD',
  dataCompra: new Date().toISOString().split('T')[0],
  valorOriginal: '',
  vetSaldoExistente: '',
  spreadPercent: '',
  iofPercent: '',
  globalSpreadAberto: '',
  globalSpreadFechado: '',
  backtestMapeBoa: '',
  backtestMapeAtencao: '',
};

export interface UseSimulationReturn {
  form: SimulationFormState;
  setField: (field: keyof SimulationFormState, value: string) => void;
  resetForm: () => void;
  result: SimulationResponse | null;
  melhorOpcao: string | null;
  oraclePayload: OraclePayload | null;
  loading: boolean;
  error: string | null;
  saveBadge: boolean;
  handleSubmit: () => Promise<void>;
}

export function useSimulation(): UseSimulationReturn {
  const [form, setForm] = useState<SimulationFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [melhorOpcao, setMelhorOpcao] = useState<string | null>(null);
  const [oraclePayload, setOraclePayload] = useState<OraclePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveBadge, setSaveBadge] = useState(false);
  const saveBadgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setField = useCallback((field: keyof SimulationFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setMelhorOpcao(null);
    setOraclePayload(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setResult(null);
    setMelhorOpcao(null);
    setOraclePayload(null);

    // Validação
    const valor = parseLocalizedNumber(form.valorOriginal);
    if (isNaN(valor) || valor <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }
    if (!form.dataCompra) {
      setError('Selecione a data da compra.');
      return;
    }

    // Montar payload
    const payload: SimulationPayload = {
      moeda: form.moeda,
      data_compra: form.dataCompra,
      valor_original: valor,
      vet_saldo_existente: form.vetSaldoExistente ? parseLocalizedNumber(form.vetSaldoExistente) : null,
      spread_percent: form.spreadPercent ? parseLocalizedNumber(form.spreadPercent) : null,
      iof_percent: form.iofPercent ? parseLocalizedNumber(form.iofPercent) : null,
      global_spread_aberto_percent: form.globalSpreadAberto ? parseLocalizedNumber(form.globalSpreadAberto) : null,
      global_spread_fechado_percent: form.globalSpreadFechado ? parseLocalizedNumber(form.globalSpreadFechado) : null,
      backtest_mape_boa_percent: form.backtestMapeBoa ? parseLocalizedNumber(form.backtestMapeBoa) : null,
      backtest_mape_atencao_percent: form.backtestMapeAtencao ? parseLocalizedNumber(form.backtestMapeAtencao) : null,
    };

    setLoading(true);
    try {
      const res = await fetchSimulation(payload);
      setResult(res);

      // Determinar melhor opção
      const candidatos: MelhorOpcaoCandidato[] = [];
      if (res.cartao?.suportada && res.cartao.valor_total_brl > 0) {
        candidatos.push({ chave: 'cartao', total: res.cartao.valor_total_brl });
      }
      if (res.global?.suportada && res.global.valor_total_brl > 0) {
        candidatos.push({ chave: 'global', total: res.global.valor_total_brl });
      }
      if (res.global_saldo_existente?.suportada && res.global_saldo_existente.valor_total_brl > 0) {
        candidatos.push({ chave: 'saldo', total: res.global_saldo_existente.valor_total_brl });
      }

      if (candidatos.length > 0) {
        candidatos.sort((a, b) => a.total - b.total);
        const labels: Record<string, string> = {
          cartao: '💳 Cartão de Crédito',
          global: '🌐 Conta Global',
          saldo: '💰 Saldo Existente',
        };
        setMelhorOpcao(labels[candidatos[0].chave] || null);
      }

      // Montar payload para IA
      if (isCurrencySupported(res.moeda)) {
        const iaPayload: OraclePayload = {
          transacao: {
            moeda: res.moeda,
            valor_original: res.valor_original,
            data_compra: res.data_compra,
          },
          parametros_vigentes: {
            iof_cartao: res.parametros_vigentes?.iof_cartao,
            iof_global: res.parametros_vigentes?.iof_global,
            spread_cartao: res.parametros_vigentes?.spread_cartao,
            spread_global_aberto: res.parametros_vigentes?.spread_global_aberto,
            spread_global_fechado: res.parametros_vigentes?.spread_global_fechado,
            origem_parametros: typeof res.parametros_vigentes?.origem === 'string'
              ? res.parametros_vigentes.origem
              : res.parametros_vigentes?.origem
                ? JSON.stringify(res.parametros_vigentes.origem)
                : null,
          },
          contexto_operacional: res.contexto_operacional ?? {},
          cenarios: {
            cartao_credito: res.cartao?.suportada ? {
              total_em_reais: res.cartao.valor_total_brl,
              vet: res.cartao.vet,
              taxa_spread: res.cartao.spread_aplicado,
              taxa_iof: res.cartao.iof_aplicado,
              taxa_base: res.cartao.base_brl,
              taxa_executada: res.cartao.taxa_utilizada,
              fonte_cotacao: res.cartao.fonte_cotacao,
              mercado_fechado: res.contexto_operacional?.mercado_fechado ?? undefined,
              usou_contingencia: res.cartao.usou_contingencia,
            } : 'Moeda não suportada',
            conta_global_compra_agora: res.global?.suportada ? {
              total_em_reais: res.global.valor_total_brl,
              vet: res.global.vet,
              taxa_spread: res.global.spread_aplicado,
              taxa_iof: res.global.iof_aplicado,
              taxa_base: res.global.base_brl,
              taxa_executada: res.global.taxa_utilizada,
              fonte_cotacao: res.global.fonte_cotacao,
              mercado_fechado: res.contexto_operacional?.mercado_fechado ?? undefined,
              usou_contingencia: res.global.usou_contingencia,
            } : 'Moeda não suportada',
            conta_global_saldo_ja_carregado: res.global_saldo_existente?.suportada ? {
              total_em_reais: res.global_saldo_existente.valor_total_brl,
              vet_historico: res.global_saldo_existente.vet,
              vet_informado: res.global_saldo_existente.vet_informado ?? 0,
              metodologia: res.global_saldo_existente.metodologia ?? '',
            } : 'Sem saldo informado',
          },
        };
        setOraclePayload(iaPayload);
      }

      // Save badge flash
      setSaveBadge(true);
      if (saveBadgeTimer.current) clearTimeout(saveBadgeTimer.current);
      saveBadgeTimer.current = setTimeout(() => setSaveBadge(false), 4000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido na simulação.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  return {
    form, setField, resetForm,
    result, melhorOpcao, oraclePayload,
    loading, error, saveBadge,
    handleSubmit,
  };
}
