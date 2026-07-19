/**
 * Digital Twin Interface — Comparação de 3 Realidades
 *
 * O Digital Twin compara:
 * 1. REAL — O que realmente aconteceu (eventos, decisões executadas)
 * 2. PLANEJADO — O cronograma original da obra
 * 3. FORECAST — Previsão para próximos 30 dias baseada em ML
 */

export type TwinState = 'REAL' | 'PLANEJADO' | 'FORECAST';

/**
 * Estado de um Objetivo em uma das 3 realidades
 */
export interface ITwinObjetivoState {
  objetivo_id: string;
  obra_id: string;
  nome: string;
  dominio: string;

  // Progresso
  progresso_percentual: number;
  valor_atual_metrica: number;
  valor_alvo_metrica: number;

  // Temporal
  data_inicio: string;
  data_alvo: string;
  data_conclusao?: string;      // Apenas em REAL
  dias_atraso?: number;          // REAL vs PLANEJADO

  // Status
  status: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ATRASADO' | 'CANCELADO';

  // Impactos
  custo_total_estimado: number;
  custo_realizado?: number;      // Apenas em REAL
  custos_adicionais?: number;    // Apenas em REAL

  // Eventos que o afetaram
  eventos_afetadores?: string[]; // array de evento IDs
}

/**
 * Estado de uma Atividade em uma das 3 realidades
 */
export interface ITwinAtividadeState {
  atividade_id: string;
  objetivo_pai_id: string;
  nome: string;

  progresso_percentual: number;
  data_inicio_planejada: string;
  data_fim_planejada: string;
  data_fim_real?: string;

  status: 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ATRASADA' | 'PAUSADA';

  recursos_alocados: number;
  recursos_reais?: number;
  produtividade_estimada: number;
  produtividade_real?: number;
}

/**
 * Comparação entre dois estados (ex: REAL vs PLANEJADO)
 */
export interface ITwinComparacao {
  de: TwinState;
  para: TwinState;

  // Variâncias
  variancia_progresso: number;       // % (positivo = melhor que planejado)
  variancia_prazo_dias: number;      // dias (positivo = adiantado)
  variancia_custo: number;           // R$ (positivo = economizado)

  // Health
  divergencia_nivel: 'VERDE' | 'AMARELO' | 'VERMELHO';
  confianca_forecast: number;        // 0-1, quão confiável é a previsão

  descricao: string;                 // Análise em português
}

/**
 * Snapshot Completo do Digital Twin
 */
export interface IDigitalTwinSnapshot {
  id: string;
  obra_id: string;

  timestamp: string;                 // Quando foi gerado
  data_comparacao: string;            // Data de corte para análise

  // Os 3 estados
  real: {
    objetivos: ITwinObjetivoState[];
    atividades: ITwinAtividadeState[];
    eventos_ocorridos: number;
    decisoes_tomadas: number;
    custo_realizado: number;
  };

  planejado: {
    objetivos: ITwinObjetivoState[];
    atividades: ITwinAtividadeState[];
    custo_orcado: number;
  };

  forecast: {
    objetivos: ITwinObjetivoState[];
    atividades: ITwinAtividadeState[];
    custo_projetado: number;
    confianca: number;
  };

  // Comparações
  comparacoes: {
    real_vs_planejado: ITwinComparacao;
    real_vs_forecast: ITwinComparacao;
    planejado_vs_forecast: ITwinComparacao;
  };

  // Insights
  insights: {
    risco_nao_conclusao?: string;
    oportunidades_economia?: string;
    intervencoes_recomendadas?: string[];
  };
}

/**
 * Métrica agregada do Twin (simplificada)
 */
export interface ITwinMetrica {
  nome: string;
  unidade: string;

  valor_real: number;
  valor_planejado: number;
  valor_forecast: number;

  variancia_percentual: number;  // (real - planejado) / planejado
  status: 'OK' | 'ATENCAO' | 'CRITICO';
}

/**
 * Builder para DigitalTwinSnapshot
 */
export class DigitalTwinBuilder {
  private twin: Partial<IDigitalTwinSnapshot>;

  constructor(obra_id: string) {
    this.twin = {
      id: `twin_${Date.now()}`,
      obra_id,
      timestamp: new Date().toISOString(),
      real: {
        objetivos: [],
        atividades: [],
        eventos_ocorridos: 0,
        decisoes_tomadas: 0,
        custo_realizado: 0,
      },
      planejado: {
        objetivos: [],
        atividades: [],
        custo_orcado: 0,
      },
      forecast: {
        objetivos: [],
        atividades: [],
        custo_projetado: 0,
        confianca: 0,
      },
      comparacoes: {
        real_vs_planejado: {
          de: 'REAL',
          para: 'PLANEJADO',
          variancia_progresso: 0,
          variancia_prazo_dias: 0,
          variancia_custo: 0,
          divergencia_nivel: 'VERDE',
          confianca_forecast: 1,
          descricao: '',
        },
        real_vs_forecast: {
          de: 'REAL',
          para: 'FORECAST',
          variancia_progresso: 0,
          variancia_prazo_dias: 0,
          variancia_custo: 0,
          divergencia_nivel: 'VERDE',
          confianca_forecast: 1,
          descricao: '',
        },
        planejado_vs_forecast: {
          de: 'PLANEJADO',
          para: 'FORECAST',
          variancia_progresso: 0,
          variancia_prazo_dias: 0,
          variancia_custo: 0,
          divergencia_nivel: 'VERDE',
          confianca_forecast: 1,
          descricao: '',
        },
      },
      insights: {},
    };
  }

  withDataComparacao(data: string): this {
    this.twin.data_comparacao = data;
    return this;
  }

  addObjetivoReal(objetivo: ITwinObjetivoState): this {
    if (!this.twin.real) this.twin.real = {} as any;
    this.twin.real.objetivos.push(objetivo);
    return this;
  }

  addObjetivoPlaynejado(objetivo: ITwinObjetivoState): this {
    if (!this.twin.planejado) this.twin.planejado = {} as any;
    this.twin.planejado.objetivos.push(objetivo);
    return this;
  }

  addObjetivoForecast(objetivo: ITwinObjetivoState): this {
    if (!this.twin.forecast) this.twin.forecast = {} as any;
    this.twin.forecast.objetivos.push(objetivo);
    return this;
  }

  withComparacao(
    tipo: 'real_vs_planejado' | 'real_vs_forecast' | 'planejado_vs_forecast',
    comparacao: ITwinComparacao
  ): this {
    if (!this.twin.comparacoes) this.twin.comparacoes = {} as any;
    this.twin.comparacoes[tipo] = comparacao;
    return this;
  }

  withInsight(tipo: string, conteudo: string): this {
    if (!this.twin.insights) this.twin.insights = {};
    this.twin.insights[tipo as keyof typeof this.twin.insights] = conteudo;
    return this;
  }

  build(): IDigitalTwinSnapshot {
    if (!this.twin.obra_id || !this.twin.data_comparacao) {
      throw new Error('obra_id e data_comparacao são obrigatórios');
    }
    return this.twin as IDigitalTwinSnapshot;
  }
}
