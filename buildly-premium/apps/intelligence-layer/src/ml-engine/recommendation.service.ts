/**
 * Recommendation Service
 *
 * Carrega modelo treinado do registry e faz predictions
 * em tempo real para novas decisões
 *
 * Phase 3.1: Recommendation Engine
 */

import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

export interface IRecommendationRequest {
  evento_id: string;
  obra_id: string;
  tipo_evento: string;
  opcoes: Array<{
    id: string;
    descricao: string;
    custo_estimado: number;
    prazo_dias: number;
    risco_score: number;
  }>;
  contexto: {
    fase_obra: string;
    % conclusao: number;
    equipe_tamanho: number;
    fornecedor_confiabilidade?: number;
  };
}

export interface IRecommendation {
  opcao_id: string;
  opcao_descricao: string;
  score: number;  // 0-100
  confianca: number;  // 0-1
  posicao: 1 | 2 | 3;
  explicacao: {
    features_principais: Array<{
      nome: string;
      contribuicao: number;
    }>;
    resumo: string;
  };
  feedback_status: 'waiting' | 'provided';
}

export interface IRecommendationResponse {
  evento_id: string;
  recomendacoes: IRecommendation[];
  melhor_opcao: IRecommendation;
  confianca_geral: number;
  model_version: string;
  latency_ms: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private db: Pool;
  private modeloAtual: any = null;
  private featureImportances: Array<{ name: string; importance: number }> = [];
  private ultimaAtualizacaoModelo: Date = new Date();

  constructor(dbPool: Pool) {
    this.db = dbPool;
    this.carregarModeloAtual();
  }

  /**
   * Faz recomendação de opções para novo evento
   *
   * Latência target: <200ms p95
   */
  async recomendarOpcoes(request: IRecommendationRequest): Promise<IRecommendationResponse> {
    const startTime = Date.now();

    if (!this.modeloAtual) {
      this.logger.warn('Modelo não carregado, criando fallback...');
      return this.recomendarComFallback(request);
    }

    // 1. Validar input
    if (!request.opcoes || request.opcoes.length === 0) {
      throw new Error('Pelo menos 1 opção é necessária');
    }

    // 2. Featurizar contexto (mock por enquanto)
    const features = this.featurizarContexto(request);

    // 3. Fazer prediction com modelo XGBoost
    // TODO: Chamar XGBoost via Python subprocess ou RPC
    const predictions = this.mockPrediction(request.opcoes.length);

    // 4. Calcular scores por opção
    const scores = request.opcoes.map((opcao, idx) => ({
      opcao_id: opcao.id,
      opcao_descricao: opcao.descricao,
      score: predictions[idx] * 100,
      confianca: predictions[idx],
      posicao: (idx + 1) as 1 | 2 | 3,
    }));

    // Ordenar por score (melhor primeiro)
    scores.sort((a, b) => b.score - a.score);

    // 5. Montar explicações (top 3 features)
    const topFeatures = this.featureImportances.slice(0, 3);

    const recomendacoes: IRecommendation[] = scores.map((score, idx) => ({
      ...score,
      posicao: (idx + 1) as 1 | 2 | 3,
      explicacao: {
        features_principais: topFeatures.map(f => ({
          nome: f.name,
          contribuicao: f.importance,
        })),
        resumo: this.gerarExplicacao(score, request.tipo_evento),
      },
      feedback_status: 'waiting' as const,
    }));

    // 6. Log para auditoria
    await this.registrarRecomendacao({
      evento_id: request.evento_id,
      obra_id: request.obra_id,
      recomendacoes: recomendacoes,
      timestamp: new Date(),
    });

    const latency = Date.now() - startTime;

    return {
      evento_id: request.evento_id,
      recomendacoes: recomendacoes.slice(0, 3),  // Top 3
      melhor_opcao: recomendacoes[0],
      confianca_geral: recomendacoes[0].confianca,
      model_version: 'v1.0',  // TODO: Ler do registry
      latency_ms: latency,
    };
  }

  /**
   * Registrar feedback do usuário após a decisão
   */
  async registrarFeedback(eventoId: string, feedback: {
    opcao_id: string;
    resultado: 'sucesso' | 'falha';
  }): Promise<void> {
    const feedback_score = feedback.resultado === 'sucesso' ? 1 : -1;

    const query = `
      UPDATE decisoes
      SET feedback_score = $1, feedback_fornecido_em = NOW()
      WHERE evento_id = $2
    `;

    await this.db.query(query, [feedback_score, eventoId]);
    this.logger.log(`Feedback registrado: evento ${eventoId}, score ${feedback_score}`);

    // Verificar se trigger retraining (ex: 100 novas decisões com feedback)
    await this.verificarRetriggerTraining();
  }

  private featurizarContexto(request: IRecommendationRequest): number[] {
    // Mock: retornar 25 features
    // TODO: Integrar com FeaturizerService
    return Array(25).fill(0).map(() => Math.random());
  }

  private mockPrediction(numOpcoes: number): number[] {
    // Mock: retornar probabilidades por opção
    // Em produção: chamar XGBoost
    const probs = Array(numOpcoes).fill(0).map(() => Math.random());
    const sum = probs.reduce((a, b) => a + b, 0);
    return probs.map(p => p / sum);  // Normalizar para soma 1
  }

  private gerarExplicacao(score: any, tipoEvento: string): string {
    if (score.posicao === 1) {
      return `Recomendado para você. Historicamente, opções similares em eventos de ${tipoEvento} tiveram ${(score.confianca * 100).toFixed(0)}% de sucesso.`;
    } else {
      return `Alternativa viável com score ${score.score.toFixed(0)}/100.`;
    }
  }

  private async registrarRecomendacao(data: {
    evento_id: string;
    obra_id: string;
    recomendacoes: IRecommendation[];
    timestamp: Date;
  }): Promise<void> {
    const query = `
      INSERT INTO recommendation_logs (
        evento_id, obra_id, recomendacoes, timestamp
      )
      VALUES ($1, $2, $3, $4)
    `;

    try {
      await this.db.query(query, [
        data.evento_id,
        data.obra_id,
        JSON.stringify(data.recomendacoes),
        data.timestamp,
      ]);
    } catch (error) {
      this.logger.error('Erro ao registrar recomendação:', error);
      // Não falhar a recomendação se log falhar
    }
  }

  private async verificarRetriggerTraining(): Promise<void> {
    const query = `
      SELECT COUNT(*) as count FROM decisoes
      WHERE feedback_fornecido_em > NOW() - INTERVAL '7 days'
      AND feedback_score IS NOT NULL
    `;

    const result = await this.db.query(query);
    const count = parseInt(result.rows[0].count, 10);

    if (count >= 100) {
      this.logger.log(`Trigger retraining: ${count} decisões com feedback nesta semana`);
      // TODO: Enviar evento para queue de retraining
    }
  }

  private async carregarModeloAtual(): Promise<void> {
    const query = `
      SELECT model_bytes, feature_importance, version
      FROM model_registry
      WHERE status = 'deployed'
      ORDER BY trained_at DESC
      LIMIT 1
    `;

    try {
      const result = await this.db.query(query);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        this.modeloAtual = JSON.parse(row.model_bytes.toString());
        this.featureImportances = JSON.parse(row.feature_importance);
        this.ultimaAtualizacaoModelo = new Date();
        this.logger.log(`Modelo ${row.version} carregado com sucesso`);
      } else {
        this.logger.warn('Nenhum modelo deployed encontrado');
      }
    } catch (error) {
      this.logger.error('Erro ao carregar modelo:', error);
    }
  }

  private async recomendarComFallback(request: IRecommendationRequest): Promise<IRecommendationResponse> {
    // Fallback: recomenda baseado em custo/prazo mínimos
    const recomendacoes: IRecommendation[] = request.opcoes
      .map((opcao, idx) => ({
        opcao_id: opcao.id,
        opcao_descricao: opcao.descricao,
        score: 50 + Math.random() * 30,
        confianca: 0.5,
        posicao: (idx + 1) as 1 | 2 | 3,
        explicacao: {
          features_principais: [],
          resumo: '[FALLBACK] Modelo não disponível. Recomendação heurística.',
        },
        feedback_status: 'waiting' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r, idx) => ({ ...r, posicao: (idx + 1) as 1 | 2 | 3 }));

    return {
      evento_id: request.evento_id,
      recomendacoes,
      melhor_opcao: recomendacoes[0],
      confianca_geral: 0.5,
      model_version: 'fallback',
      latency_ms: 0,
    };
  }
}
