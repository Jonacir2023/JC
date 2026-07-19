/**
 * BMI — Buildly Maturity Index
 *
 * Score de 0-100 que mede a maturidade operacional de uma obra em 8 dimensões.
 * Cada dimensão é afetada pelos eventos, objetivos e decisões.
 *
 * BMI Total = Σ (score_dimensão × peso_dimensão)
 */

export type BMIDimensao =
  | 'execucao'
  | 'financeiro'
  | 'risco'
  | 'governanca'
  | 'planejamento'
  | 'recursos'
  | 'sustentabilidade'
  | 'seguranca';

/**
 * Score de uma dimensão individual
 */
export interface IBMIDimensaoScore {
  dimensao: BMIDimensao;
  nome_amigavel: string;

  // Score
  score_atual: number;           // 0-100
  score_anterior?: number;       // Para tracking de mudanças
  variacao_percentual?: number;  // % de mudança

  // Peso na composição final
  peso: number;                  // 0-1, soma de todos = 1
  contribuicao_ao_bmi: number;   // score × peso

  // Indicadores
  indicadores: {
    nome: string;
    valor: number;               // 0-100
    descricao: string;
    peso_local: number;           // Peso dentro da dimensão
  }[];

  // Histórico
  historico_30_dias?: number[];  // Scores dos últimos 30 dias
  tendencia: 'SUBINDO' | 'ESTAVEL' | 'DESCENDO';

  // Insights
  pontos_fortes?: string[];
  pontos_fracos?: string[];
  recomendacoes?: string[];
}

/**
 * Score agregado do BMI (todas as dimensões)
 */
export interface IBMIScore {
  id: string;
  obra_id: string;
  timestamp: string;             // ISO 8601

  // Score total
  bmi_total: number;             // 0-100
  bmi_anterior?: number;
  variacao_percentual?: number;

  // Scores por dimensão
  dimensoes: {
    [key in BMIDimensao]?: IBMIDimensaoScore;
  };

  // Classificação
  classificacao: 'CRITICO' | 'BAIXO' | 'MEDIO' | 'BOM' | 'EXCELENTE';

  // Contexto
  totalEventos: number;
  totalObjetivos: number;
  totalObjetivosAmeacados: number;
  totalDecisoes: number;
  decisoes_com_feedback_positivo: number;

  // Insights
  aspectos_criticos?: string[];
  oportunidades_melhoria?: string[];
  proximos_passos?: string[];
}

/**
 * Especificação de cada dimensão BMI
 */
export const BMI_DIMENSOES: {
  [key in BMIDimensao]: {
    nome: string;
    descricao: string;
    peso_padrao: number;
    indicadores: {
      nome: string;
      descricao: string;
      formula?: string;
    }[];
  };
} = {
  execucao: {
    nome: 'Execução',
    descricao:
      '% de conclusão vs. cronograma. Mede se atividades saem no prazo.',
    peso_padrao: 0.35,
    indicadores: [
      {
        nome: 'Taxa de Conclusão',
        descricao: 'Progresso total da obra',
      },
      {
        nome: 'Cumprimento de Prazo',
        descricao: 'Atividades completadas no prazo',
      },
      {
        nome: 'Estabilidade de Schedule',
        descricao: 'Quantos replanejamentos ocorreram',
      },
    ],
  },

  financeiro: {
    nome: 'Financeiro',
    descricao: 'Custos realizado vs. orçado. Mede eficiência financeira.',
    peso_padrao: 0.25,
    indicadores: [
      {
        nome: 'Aderência ao Orçamento',
        descricao: 'Custos realizado / orçado',
      },
      {
        nome: 'Tendência de Custo',
        descricao: 'Projeção de overrun/underrun',
      },
      {
        nome: 'ROI Parcial',
        descricao: 'Valor entregue vs. investido',
      },
    ],
  },

  risco: {
    nome: 'Risco',
    descricao: 'Eventos mitigados vs. totais. Mede capacidade de resposta.',
    peso_padrao: 0.15,
    indicadores: [
      {
        nome: 'Taxa de Mitigação',
        descricao: 'Eventos mitigados / eventos totais',
      },
      {
        nome: 'Qualidade de Decisões',
        descricao: 'Feedback score médio das decisões',
      },
      {
        nome: 'Capacidade de Resposta',
        descricao: 'Tempo entre evento e decisão',
      },
    ],
  },

  governanca: {
    nome: 'Governança',
    descricao: 'Decisões documentadas e auditáveis. Mede conformidade.',
    peso_padrao: 0.1,
    indicadores: [
      {
        nome: 'Documentação de Decisões',
        descricao: '% de decisões com registro completo',
      },
      {
        nome: 'Conformidade com Processos',
        descricao: 'Adesão aos processos estabelecidos',
      },
      {
        nome: 'Rastreabilidade Completa',
        descricao: 'Auditoria 100% possível',
      },
    ],
  },

  planejamento: {
    nome: 'Planejamento',
    descricao: 'Cronograma cumprido. Mede qualidade do planejamento inicial.',
    peso_padrao: 0.1,
    indicadores: [
      {
        nome: 'Acurácia do Planejamento',
        descricao: 'Previsões vs. realizado',
      },
      {
        nome: 'Estabilidade do Schedule',
        descricao: 'Quantas vezes o cronograma foi alterado',
      },
      {
        nome: 'Margem de Segurança',
        descricao: 'Buffer utilizado vs. buffer planejado',
      },
    ],
  },

  recursos: {
    nome: 'Recursos',
    descricao: 'Equipes mobilizadas e produtivas. Mede eficiência operacional.',
    peso_padrao: 0.03,
    indicadores: [
      {
        nome: 'Taxa de Mobilização',
        descricao: '% de equipe alocada',
      },
      {
        nome: 'Produtividade Média',
        descricao: 'Saída vs. recursos investidos',
      },
      {
        nome: 'Retenção de Talento',
        descricao: 'Rotatividade de equipe',
      },
    ],
  },

  sustentabilidade: {
    nome: 'Sustentabilidade',
    descricao:
      'Uso de materiais eco-friendly e práticas sustentáveis. Mede impacto ambiental.',
    peso_padrao: 0.02,
    indicadores: [
      {
        nome: '% de Materiais Sustentáveis',
        descricao: 'Proporção de materiais eco-friendly',
      },
      {
        nome: 'Redução de Resíduos',
        descricao: 'Resíduos reciclados / resíduos totais',
      },
      {
        nome: 'Conformidade Ambiental',
        descricao: 'Licenças e aprovações ambientais',
      },
    ],
  },

  seguranca: {
    nome: 'Segurança',
    descricao: 'Zero incidentes de segurança. Mede saúde ocupacional.',
    peso_padrao: 0.0,
    indicadores: [
      {
        nome: 'Taxa de Acidente',
        descricao: 'Incidentes / horas trabalhadas',
      },
      {
        nome: 'Conformidade com NR',
        descricao: 'Aderência às Normas Regulamentadoras',
      },
      {
        nome: 'Cultura de Segurança',
        descricao: 'Score de percepção da equipe',
      },
    ],
  },
};

/**
 * Builder para BMIScore
 */
export class BMIScoreBuilder {
  private score: Partial<IBMIScore>;
  private dimensoes_map: Map<BMIDimensao, IBMIDimensaoScore>;

  constructor(obra_id: string) {
    this.score = {
      id: `bmi_${Date.now()}`,
      obra_id,
      timestamp: new Date().toISOString(),
      bmi_total: 0,
      classificacao: 'MEDIO',
      totalEventos: 0,
      totalObjetivos: 0,
      totalObjetivosAmeacados: 0,
      totalDecisoes: 0,
      decisoes_com_feedback_positivo: 0,
      dimensoes: {},
    };
    this.dimensoes_map = new Map();
  }

  addDimensao(dimensao: BMIDimensao, scoreValue: number): this {
    const config = BMI_DIMENSOES[dimensao];
    if (!config) {
      throw new Error(`Dimensão ${dimensao} não existe`);
    }

    const dim: IBMIDimensaoScore = {
      dimensao,
      nome_amigavel: config.nome,
      score_atual: Math.max(0, Math.min(100, scoreValue)),
      peso: config.peso_padrao,
      contribuicao_ao_bmi: 0, // Calculado no build()
      indicadores: config.indicadores.map((ind) => ({
        nome: ind.nome,
        valor: Math.random() * 100, // Placeholder
        descricao: ind.descricao,
        peso_local: 1 / config.indicadores.length,
      })),
      tendencia: 'ESTAVEL',
    };

    this.dimensoes_map.set(dimensao, dim);
    return this;
  }

  withContext(eventos: number, objetivos: number, decisoes: number): this {
    this.score.totalEventos = eventos;
    this.score.totalObjetivos = objetivos;
    this.score.totalDecisoes = decisoes;
    return this;
  }

  withInsights(criticos?: string[], oportunidades?: string[]): this {
    if (criticos) this.score.aspectos_criticos = criticos;
    if (oportunidades) this.score.oportunidades_melhoria = oportunidades;
    return this;
  }

  build(): IBMIScore {
    if (!this.score.obra_id) {
      throw new Error('obra_id é obrigatório');
    }

    // Calcula BMI total
    let bmi_total = 0;
    let peso_total = 0;

    for (const [_, dim] of this.dimensoes_map) {
      dim.contribuicao_ao_bmi = dim.score_atual * dim.peso;
      bmi_total += dim.contribuicao_ao_bmi;
      peso_total += dim.peso;
    }

    // Normaliza
    if (peso_total > 0) {
      bmi_total = (bmi_total / peso_total) * 100;
    }

    this.score.bmi_total = Math.max(0, Math.min(100, bmi_total));

    // Classifica
    if (this.score.bmi_total >= 80) this.score.classificacao = 'EXCELENTE';
    else if (this.score.bmi_total >= 60) this.score.classificacao = 'BOM';
    else if (this.score.bmi_total >= 40) this.score.classificacao = 'MEDIO';
    else if (this.score.bmi_total >= 20) this.score.classificacao = 'BAIXO';
    else this.score.classificacao = 'CRITICO';

    // Popula dimensões
    this.score.dimensoes = Object.fromEntries(this.dimensoes_map);

    return this.score as IBMIScore;
  }
}
