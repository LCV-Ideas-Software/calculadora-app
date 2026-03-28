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
}

/** Resultado individual de canal (Cartão / Global) */
export interface ChannelResult {
  suportada: boolean;
  erro?: string;
  taxa_utilizada: number;
  fonte_cotacao: string;
  spread_aplicado: number;
  valor_spread: number;
  iof_aplicado: number;
  valor_iof: number;
  valor_total_brl: number;
  vet: number;
  base_brl?: number;
  is_plantao?: boolean;
  usou_contingencia?: boolean;
  metodologia?: string;
  vet_informado?: number;
}

/** Parâmetros vigentes retornados pelo backend */
export interface ParametrosVigentes {
  spread_cartao: number;
  iof_cartao: number;
  iof_global?: number;
  spread_global_aberto: number;
  spread_global_fechado: number;
  backtest_mape_boa_percent?: number;
  backtest_mape_atencao_percent?: number;
  origem?: Record<string, string> | string;
}

/** Banda de sensibilidade (otimista/base/pessimista) */
export interface SensibilidadeBanda {
  otimista: { valor_total_brl: number; vet: number };
  base: { valor_total_brl: number; vet: number };
  pessimista: { valor_total_brl: number; vet: number };
}

export interface SensibilidadeData {
  cartao?: SensibilidadeBanda;
  global?: SensibilidadeBanda;
}

/** Dados de backtest */
export interface BacktestData {
  mape_7d_percent: number;
  erro_percentual_atual?: number;
  observacoes_7d?: number;
  qualidade?: 'excelente' | 'boa' | 'atencao';
  faixas_percent?: { boa: number; atencao: number };
}

/** Contexto operacional (mercado aberto/fechado) */
export interface ContextoOperacional {
  mercado_fechado?: boolean | null;
}

/** Response completa do POST /api/calcular */
export interface SimulationResponse {
  moeda: string;
  data_compra: string;
  valor_original: number;
  cartao: ChannelResult;
  global?: ChannelResult;
  global_saldo_existente?: ChannelResult;
  parametros_vigentes?: ParametrosVigentes;
  parametros_customizados_salvos?: boolean;
  parametros_customizados_em?: string;
  sensibilidade?: SensibilidadeData;
  backtest?: BacktestData;
  contexto_operacional?: ContextoOperacional;
  erro?: string;
}

/** Payload para a IA (Oráculo) */
export interface OraclePayload {
  transacao: {
    moeda: string;
    valor_original: number;
    data_compra: string;
  };
  parametros_vigentes: {
    iof_cartao?: number;
    iof_global?: number;
    spread_cartao?: number;
    spread_global_aberto?: number;
    spread_global_fechado?: number;
    origem_parametros?: string | null;
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
  taxa_base?: number;
  taxa_executada?: number;
  fonte_cotacao: string;
  mercado_fechado?: boolean;
  usou_contingencia?: boolean;
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
  oracleHtml?: string | null;
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
