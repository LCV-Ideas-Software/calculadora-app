/*
 * Copyright © 2026 LCV Ideas & Software
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   Calculadora App — TypeScript API Interfaces
   ==================================================================== */

/** Payload enviado ao POST /api/calcular */
export interface SimulationPayload {
  moeda: string;
  data_compra: string;
  valor_original: number;
  vet_saldo_existente: number | null;
  spread_percent: number | null;
  iof_percent: number | null;
  global_spread_aberto_percent: number | null;
  global_spread_fechado_percent: number | null;
  backtest_mape_boa_percent: number | null;
  backtest_mape_atencao_percent: number | null;
  /** Modo "cobrado em reais": valor_original é o preço em BRL do checkout */
  cobrado_em_reais?: boolean;
  /** Valor efetivamente cobrado na fatura (para diagnóstico reverso) */
  valor_fatura_brl?: number | null;
}

/** Um cenário de compra internacional cobrada em reais */
export interface CenarioReais {
  total_brl: number;
  custo_adicional_brl: number;
  custo_adicional_percent: number;
  descricao: string;
}

/** Análise do modo "cobrado em reais" (DCC) */
export interface CompraEmReaisAnalise {
  cenarios: {
    adquirencia_local: CenarioReais;
    dcc_pura: CenarioReais;
    dupla_conversao: CenarioReais;
  };
  diagnostico: {
    valor_fatura_brl: number;
    markup_implicito_percent: number;
    cenario_provavel: 'adquirencia_local' | 'dcc_pura' | 'dupla_conversao' | 'indeterminado';
    explicacao: string;
  } | null;
}

/** Resultado individual de canal (Cartão / Global) */
export interface ChannelResult {
  suportada: boolean;
  erro?: string | undefined;
  taxa_utilizada: number;
  fonte_cotacao: string;
  spread_aplicado: number;
  valor_spread: number;
  iof_aplicado: number;
  valor_iof: number;
  valor_total_brl: number;
  vet: number;
  base_brl?: number | undefined;
  is_plantao?: boolean | undefined;
  usou_contingencia?: boolean | undefined;
  metodologia?: string | undefined;
  vet_informado?: number | undefined;
}

/** Parâmetros vigentes retornados pelo backend */
export interface ParametrosVigentes {
  spread_cartao: number;
  iof_cartao: number;
  iof_global?: number | undefined;
  spread_global_aberto: number;
  spread_global_fechado: number;
  backtest_mape_boa_percent?: number | undefined;
  backtest_mape_atencao_percent?: number | undefined;
  origem?: Record<string, string> | string | undefined;
}

/** Banda de sensibilidade (otimista/base/pessimista) */
export interface SensibilidadeBanda {
  otimista: { valor_total_brl: number; vet: number };
  base: { valor_total_brl: number; vet: number };
  pessimista: { valor_total_brl: number; vet: number };
}

export interface SensibilidadeData {
  cartao?: SensibilidadeBanda | undefined;
  global?: SensibilidadeBanda | undefined;
}

/** Dados de backtest */
export interface BacktestData {
  mape_7d_percent: number;
  erro_percentual_atual?: number | undefined;
  observacoes_7d?: number | undefined;
  qualidade?: 'excelente' | 'boa' | 'atencao' | undefined;
  faixas_percent?: { boa: number; atencao: number } | undefined;
}

/** Contexto operacional (mercado aberto/fechado) */
export interface ContextoOperacional {
  mercado_fechado?: boolean | null | undefined;
}

/** Response completa do POST /api/calcular */
export interface SimulationResponse {
  moeda: string;
  data_compra: string;
  valor_original: number;
  cartao?: ChannelResult | undefined;
  global?: ChannelResult | undefined;
  global_saldo_existente?: ChannelResult | undefined;
  parametros_vigentes?: ParametrosVigentes | undefined;
  parametros_customizados_salvos?: boolean | undefined;
  parametros_customizados_em?: string | undefined;
  sensibilidade?: SensibilidadeData | undefined;
  backtest?: BacktestData | undefined;
  contexto_operacional?: ContextoOperacional | undefined;
  cobrado_em_reais?: boolean | undefined;
  compra_em_reais?: CompraEmReaisAnalise | undefined;
  erro?: string | undefined;
}

/** Payload para a IA (Oráculo) */
export interface OraclePayload {
  transacao: {
    moeda: string;
    valor_original: number;
    data_compra: string;
  };
  parametros_vigentes: {
    iof_cartao?: number | undefined;
    iof_global?: number | undefined;
    spread_cartao?: number | undefined;
    spread_global_aberto?: number | undefined;
    spread_global_fechado?: number | undefined;
    origem_parametros?: string | null | undefined;
  };
  contexto_operacional: ContextoOperacional;
  cenarios: {
    cartao_credito: ChannelCenario | string;
    conta_global_compra_agora: ChannelCenario | string;
    conta_global_saldo_ja_carregado: SaldoCenario | string;
  };
}

export interface ChannelCenario {
  total_em_reais: number;
  vet: number;
  taxa_spread: number;
  taxa_iof: number;
  taxa_base?: number | undefined;
  taxa_executada?: number | undefined;
  fonte_cotacao: string;
  mercado_fechado?: boolean | undefined;
  usou_contingencia?: boolean | undefined;
}

export interface SaldoCenario {
  total_em_reais: number;
  vet_historico: number;
  vet_informado: number;
  metodologia: string;
}

/** Resultado da análise do Oráculo com metadados */
export interface OracleResultMeta {
  html: string;
  fromCache: boolean;
  ttlMs: number | null;
  ageMs: number | null;
  expiresInMs: number | null;
}

/** Candidato para melhor opção */
export interface MelhorOpcaoCandidato {
  chave: 'cartao' | 'global' | 'saldo';
  total: number;
}

/** Dados para envio de email */
export interface EmailSimulationData {
  moeda: string;
  valorBruto: number;
  dataBr: string;
  melhorOpcao: string | null;
  cartao: ChannelResult;
  global: ChannelResult | null;
  saldo_existente: ChannelResult | null;
  /** HTML renderizado da análise IA (Oráculo), quando disponível */
  oracleHtml?: string | null | undefined;
}

/** Histórico e telemetria de IA */
export interface AiHistoryEntry {
  createdAt: number;
  fromCache: boolean;
  forceRefresh: boolean;
  moeda: string | null;
  valorOriginal: number;
  preview: string;
}

export interface AiTelemetry {
  total: number;
  cacheHits: number;
  liveHits: number;
  errors: number;
  avgMs: number;
  lastMs: number;
  updatedAt: number | null;
}
