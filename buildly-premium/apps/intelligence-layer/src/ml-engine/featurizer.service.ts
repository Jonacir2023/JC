/**
 * Decision Store Featurizer Service
 *
 * Extrai 25 features de decisões históricas com feedback
 * para alimentar treinamento de modelo ML (XGBoost)
 *
 * Phase 3.1: Recommendation Engine
 */

import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

export interface IDecisaoComFeedback {
  id: string;
  evento_id: string;
  tipo_evento: string;
  num_opcoes: number;
  opcoes: Array<{
    id: string;
    descricao: string;
    custo_estimado: number;
    prazo_dias: number;
    risco_score: number;
  }>;
  opcao_escolhida_id: string;
  contexto: {
    fase_obra: string;
    % conclusao: number;
    equipe_tamanho: number;
    fornecedor_confiabilidade: number;
  };
  resultado?: {
    prazo_real_dias: number;
    custo_real: number;
    qualidade_entregue: number;
    satisfacao: number;
  };
  feedback_score: -1 | 0 | 1;
  criado_em: string;
}

export interface IFeatureVector {
  features: number[];
  featureNames: string[];
  label?: -1 | 0 | 1;  // feedback_score
}

@Injectable()
export class FeaturizerService {
  private db: Pool;
  private readonly FEATURE_NAMES = [
    'event_type_encoded',
    'num_opcoes',
    'opcao_escolhida_ranking',
    'fase_obra_encoded',
    'top1_option_cost_norm',
    'top2_option_cost_norm',
    'top3_option_cost_norm',
    'top1_option_prazo',
    'top2_option_prazo',
    'top3_option_prazo',
    'top1_option_risco',
    'top2_option_risco',
    'top3_option_risco',
    'obra_completion_pct',
    'equipe_tamanho_norm',
    'fornecedor_confiabilidade',
    'dias_desde_ultimo_atraso',
    'custo_acumulado_obra',
    'variacao_custo_vs_planejado',
    'escolha_era_mais_cara',
    'escolha_era_mais_rapida',
    'escolha_era_menor_risco',
    'season_encoded',
    'day_of_week_encoded',
    'historical_success_rate_similar_events',
  ];

  constructor(dbPool: Pool) {
    this.db = dbPool;
  }

  /**
   * Transforma decisão histórica em feature vector
   */
  async transformDecisao(decisao: IDecisaoComFeedback): Promise<IFeatureVector> {
    const features: number[] = [];

    // 1. event_type_encoded
    const eventTypeMap = { ATRASO: 0, CUSTO: 1, RISCO: 2, QUALIDADE: 3 };
    features.push(eventTypeMap[decisao.tipo_evento] ?? 0);

    // 2. num_opcoes
    features.push(decisao.num_opcoes);

    // 3. opcao_escolhida_ranking
    const indexEscolhida = decisao.opcoes.findIndex(o => o.id === decisao.opcao_escolhida_id);
    features.push(indexEscolhida + 1);

    // 4. fase_obra_encoded
    const faseMap = { fundacao: 0, estrutura: 1, acabamento: 2, entrega: 3 };
    features.push(faseMap[decisao.contexto.fase_obra] ?? 0);

    // 5-7. top3 custos normalizados
    const custos = decisao.opcoes.map(o => o.custo_estimado).sort((a, b) => a - b);
    const maxCusto = Math.max(...custos);
    features.push(custos[0] / maxCusto);
    features.push((custos[1] ?? custos[0]) / maxCusto);
    features.push((custos[2] ?? custos[0]) / maxCusto);

    // 8-10. top3 prazos normalizados
    const prazos = decisao.opcoes.map(o => o.prazo_dias).sort((a, b) => a - b);
    const maxPrazo = Math.max(...prazos);
    features.push(prazos[0] / maxPrazo);
    features.push((prazos[1] ?? prazos[0]) / maxPrazo);
    features.push((prazos[2] ?? prazos[0]) / maxPrazo);

    // 11-13. top3 riscos normalizados
    const riscos = decisao.opcoes.map(o => o.risco_score).sort((a, b) => a - b);
    const maxRisco = Math.max(...riscos);
    features.push(riscos[0] / maxRisco);
    features.push((riscos[1] ?? riscos[0]) / maxRisco);
    features.push((riscos[2] ?? riscos[0]) / maxRisco);

    // 14. obra_completion_pct (0-100)
    features.push(decisao.contexto.% conclusao / 100);

    // 15. equipe_tamanho_norm
    // Assumindo range 0-100 pessoas
    features.push(Math.min(decisao.contexto.equipe_tamanho / 100, 1));

    // 16. fornecedor_confiabilidade (0-100)
    features.push(decisao.contexto.fornecedor_confiabilidade / 100);

    // 17. dias_desde_ultimo_atraso (estimar 30 como default)
    const diasAtraso = await this.calcularDiasDesdeUltimoAtrasoSimilar(decisao.tipo_evento);
    features.push(Math.min(diasAtraso / 365, 1));

    // 18. custo_acumulado_obra (normalizado)
    const custoAcumulado = await this.obterCustoAcumuladoObra(decisao.evento_id);
    features.push(Math.min(custoAcumulado / 1_000_000, 1));  // 1M cap

    // 19. variacao_custo_vs_planejado (%)
    const variacao = await this.obterVariacaoCustoVsPlanejado(decisao.evento_id);
    features.push(variacao / 100);  // -50 a +50 → -0.5 a +0.5

    // 20. escolha_era_mais_cara (binary)
    const opcaoEscolhida = decisao.opcoes.find(o => o.id === decisao.opcao_escolhida_id);
    const ehMaisCara = opcaoEscolhida && custos[custos.length - 1] === opcaoEscolhida.custo_estimado ? 1 : 0;
    features.push(ehMaisCara);

    // 21. escolha_era_mais_rapida (binary)
    const ehMaisRapida = opcaoEscolhida && prazos[0] === opcaoEscolhida.prazo_dias ? 1 : 0;
    features.push(ehMaisRapida);

    // 22. escolha_era_menor_risco (binary)
    const ehMenorRisco = opcaoEscolhida && riscos[0] === opcaoEscolhida.risco_score ? 1 : 0;
    features.push(ehMenorRisco);

    // 23. season_encoded (estimar de criado_em)
    const month = new Date(decisao.criado_em).getMonth();
    const season = Math.floor(month / 3);  // 0=inverno, 1=primavera, 2=verão, 3=outono
    features.push(season);

    // 24. day_of_week_encoded
    const dayOfWeek = new Date(decisao.criado_em).getDay();
    features.push(dayOfWeek);

    // 25. historical_success_rate_similar_events
    const successRate = await this.obterTaxaSucessoEventosSimilares(decisao.tipo_evento);
    features.push(successRate / 100);

    return {
      features,
      featureNames: this.FEATURE_NAMES,
      label: decisao.feedback_score,
    };
  }

  /**
   * Transforma batch de decisões em matrizes X (features) e y (labels)
   */
  async transformBatch(decisoes: IDecisaoComFeedback[]): Promise<{
    X: number[][];
    y: (-1 | 0 | 1)[];
  }> {
    const X: number[][] = [];
    const y: (-1 | 0 | 1)[] = [];

    for (const decisao of decisoes) {
      const vector = await this.transformDecisao(decisao);
      X.push(vector.features);
      y.push(vector.label ?? 0);
    }

    return { X, y };
  }

  /**
   * Busca decisões com feedback do banco para treinar modelo
   */
  async obterDecisoesTreino(opcoes?: {
    min_date?: Date;
    feedback_provided?: boolean;
  }): Promise<IDecisaoComFeedback[]> {
    const query = `
      SELECT
        id,
        evento_id,
        tipo_evento,
        ARRAY_LENGTH(opcoes, 1) as num_opcoes,
        opcoes,
        opcao_escolhida_id,
        contexto,
        resultado,
        feedback_score,
        criado_em
      FROM decisoes
      WHERE feedback_score IS NOT NULL
      ${opcoes?.min_date ? `AND criado_em >= $1` : ''}
      ORDER BY criado_em DESC
      LIMIT 10000
    `;

    const params: any[] = [];
    if (opcoes?.min_date) params.push(opcoes.min_date);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  private async calcularDiasDesdeUltimoAtrasoSimilar(tipoEvento: string): Promise<number> {
    // TODO: Implementar query real
    return 30;
  }

  private async obterCustoAcumuladoObra(eventoId: string): Promise<number> {
    // TODO: Implementar query real
    return 500_000;
  }

  private async obterVariacaoCustoVsPlanejado(eventoId: string): Promise<number> {
    // TODO: Implementar query real
    return 5;
  }

  private async obterTaxaSucessoEventosSimilares(tipoEvento: string): Promise<number> {
    // TODO: Implementar query real
    return 75;
  }
}
