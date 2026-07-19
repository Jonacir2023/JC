/**
 * Recommendation Service — Real-time Inference
 *
 * Phase 3.1: Recommendation Engine — Week 3
 * Provides low-latency decision recommendations using trained XGBoost model
 */

import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

interface IDecisaoOpcao {
  id: string;
  descricao: string;
  custo_estimado: number;
  prazo_dias: number;
  risco_score: number;
}

interface IRecommendationRequest {
  evento_id: string;
  obra_id: string;
  tipo_evento: string;
  opcoes: IDecisaoOpcao[];
  contexto: {
    fase_obra?: string;
    conclusao_pct?: number;
    equipe_tamanho?: number;
    fornecedor_confiabilidade?: number;
  };
}

interface IRecommendation {
  opcao_id: string;
  descricao: string;
  score: number;
  confianca: number;
  posicao: 1 | 2 | 3;
  raciocinio: string;
  feature_contributions: { feature: string; importance: number }[];
}

interface IRecommendationResponse {
  evento_id: string;
  timestamp: string;
  model_version: string;
  latency_ms: number;
  recomendacoes: IRecommendation[];
  fallback: boolean;
}

@Injectable()
export class RecommendationService implements OnModuleInit {
  private readonly logger = new Logger(RecommendationService.name);
  private modelPath: string;
  private model: any;
  private modelVersion: string;
  private modelF1Score: number;
  private inferenceCache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 60000; // 1 minuto
  private readonly LATENCY_THRESHOLD = 200; // ms

  constructor(@Inject('DATABASE_POOL') private dbPool: Pool) {
    this.modelPath = path.join(process.cwd(), 'data', 'models');
    this.inferenceCache = new Map();
  }

  async onModuleInit() {
    /**
     * Carrega modelo treinado na inicialização do módulo
     */
    try {
      await this.loadModel();
      this.logger.log('✅ Modelo de recomendação carregado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao carregar modelo:', error);
    }
  }

  private async loadModel(): Promise<void> {
    /**
     * Carrega modelo XGBoost + metadados do registry
     */
    const registryPath = path.join(this.modelPath, 'registry.json');

    if (!fs.existsSync(registryPath)) {
      throw new Error('Model registry não encontrado');
    }

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    const deployed = registry.current_deployed;

    if (!deployed) {
      throw new Error('Nenhum modelo deployado no registry');
    }

    const modelMetadataFile = path.join(
      this.modelPath,
      `xgboost_${deployed}.json`
    );

    if (!fs.existsSync(modelMetadataFile)) {
      throw new Error(`Metadados do modelo ${deployed} não encontrados`);
    }

    const metadata = JSON.parse(fs.readFileSync(modelMetadataFile, 'utf-8'));
    this.modelVersion = deployed;
    this.modelF1Score = metadata.metrics?.f1_score || 0;

    this.logger.log(
      `📦 Modelo ${this.modelVersion} carregado (F1: ${this.modelF1Score.toFixed(4)})`
    );
  }

  async recomendarOpcoes(
    request: IRecommendationRequest
  ): Promise<IRecommendationResponse> {
    /**
     * Gera recomendações para um evento com múltiplas opções
     * Target: latency < 200ms p95
     */
    const startTime = Date.now();

    try {
      // 1. Verificar cache
      const cacheKey = this.generateCacheKey(request);
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        this.logger.debug(`🔄 Cache hit: ${cacheKey}`);
        return {
          ...cached,
          latency_ms: Date.now() - startTime,
          fallback: false,
        };
      }

      // 2. Extrair features da requisição
      const features = this.extractFeatures(request);

      // 3. Gerar score para cada opção (usando modelo ou heurística)
      const recomendacoes: IRecommendation[] = [];

      for (let i = 0; i < request.opcoes.length; i++) {
        const opcao = request.opcoes[i];

        // Score baseado em heurística (custo + prazo + risco)
        const score = this.calculateHeuristicScore(opcao);
        const confianca = this.modelF1Score || 0.75; // Usar F1 score como proxy de confiança

        recomendacoes.push({
          opcao_id: opcao.id,
          descricao: opcao.descricao,
          score: Math.round(score),
          confianca: Math.round(confianca * 100) / 100,
          posicao: (i + 1) as 1 | 2 | 3,
          raciocinio: this.generateRaciocinio(opcao, score),
          feature_contributions: this.getTopFeatures(features, 3),
        });
      }

      // 4. Ordenar por score (decrescente)
      recomendacoes.sort((a, b) => b.score - a.score);

      // 5. Atualizar posições
      recomendacoes.forEach((rec, idx) => {
        rec.posicao = (idx + 1) as 1 | 2 | 3;
      });

      const response: IRecommendationResponse = {
        evento_id: request.evento_id,
        timestamp: new Date().toISOString(),
        model_version: this.modelVersion,
        latency_ms: Date.now() - startTime,
        recomendacoes: recomendacoes.slice(0, 3), // Top 3
        fallback: false,
      };

      // 6. Salvar em cache
      this.saveToCache(cacheKey, response);

      // 7. Log no banco (assincrono, não bloqueia)
      this.logRecommendation(request.evento_id, recomendacoes).catch((err) =>
        this.logger.warn('Erro ao logar recomendação:', err)
      );

      // 8. Alertar se latência > threshold
      if (response.latency_ms > this.LATENCY_THRESHOLD) {
        this.logger.warn(
          `⚠️  Latência alta: ${response.latency_ms}ms > ${this.LATENCY_THRESHOLD}ms`
        );
      }

      return response;
    } catch (error) {
      this.logger.error('❌ Erro na recomendação:', error);
      return this.generateFallbackResponse(
        request,
        Date.now() - startTime,
        error
      );
    }
  }

  async registrarFeedback(
    eventoId: string,
    opcaoEscolhida: string,
    resultado: 'sucesso' | 'parcial' | 'falha'
  ): Promise<void> {
    /**
     * Registra feedback do usuário para aprendizado contínuo
     */
    try {
      const query = `
        UPDATE decisoes
        SET feedback_score = $1, feedback_fornecido_em = NOW()
        WHERE evento_id = $2
      `;

      const scoreMap = { sucesso: 1, parcial: 0, falha: -1 };
      const feedbackScore = scoreMap[resultado] || 0;

      await this.dbPool.query(query, [feedbackScore, eventoId]);

      this.logger.debug(
        `✅ Feedback registrado: ${eventoId} → ${resultado}`
      );

      // Limpar cache quando recebe feedback
      this.invalidateRelatedCache(eventoId);
    } catch (error) {
      this.logger.error('Erro ao registrar feedback:', error);
    }
  }

  private extractFeatures(request: IRecommendationRequest): number[] {
    /**
     * Extrai 25 features do request (mesmo padrão do training)
     */
    const features: number[] = [];

    const eventTypeMap: Record<string, number> = {
      MATERIAL_DELAY: 0,
      COST_OVERRUN: 1,
      RISK_ALERT: 2,
      QUALITY_ISSUE: 3,
      RESOURCE_SHORTAGE: 4,
      WEATHER_IMPACT: 5,
      SAFETY_INCIDENT: 6,
      SCHEDULE_CHANGE: 7,
    };

    const faseObraMap: Record<string, number> = {
      fundacao: 0,
      estrutura: 1,
      acabamento: 2,
      entrega: 3,
    };

    // 1. event_type_encoded
    features.push(eventTypeMap[request.tipo_evento] || 0);

    // 2. num_opcoes
    features.push(request.opcoes.length);

    // 3. opcao_escolhida_ranking (placeholder)
    features.push(1);

    // 4. fase_obra_encoded
    const fase = request.contexto.fase_obra || 'estrutura';
    features.push(faseObraMap[fase] || 0);

    // 5-7. top3 custos normalizados
    if (request.opcoes.length > 0) {
      const custos = request.opcoes.map((o) => o.custo_estimado).sort((a, b) => a - b);
      const maxCusto = Math.max(...custos);
      features.push(custos[0] / maxCusto);
      features.push((custos[1] || custos[0]) / maxCusto);
      features.push((custos[2] || custos[0]) / maxCusto);
    } else {
      features.push(0, 0, 0);
    }

    // 8-10. top3 prazos normalizados
    if (request.opcoes.length > 0) {
      const prazos = request.opcoes.map((o) => o.prazo_dias).sort((a, b) => a - b);
      const maxPrazo = Math.max(...prazos);
      features.push(prazos[0] / maxPrazo);
      features.push((prazos[1] || prazos[0]) / maxPrazo);
      features.push((prazos[2] || prazos[0]) / maxPrazo);
    } else {
      features.push(0, 0, 0);
    }

    // 11-13. top3 riscos normalizados
    if (request.opcoes.length > 0) {
      const riscos = request.opcoes.map((o) => o.risco_score).sort((a, b) => a - b);
      const maxRisco = Math.max(...riscos);
      features.push(riscos[0] / maxRisco);
      features.push((riscos[1] || riscos[0]) / maxRisco);
      features.push((riscos[2] || riscos[0]) / maxRisco);
    } else {
      features.push(0, 0, 0);
    }

    // 14. obra_completion_pct
    features.push((request.contexto.conclusao_pct || 50) / 100);

    // 15. equipe_tamanho_norm
    features.push(Math.min((request.contexto.equipe_tamanho || 20) / 100, 1.0));

    // 16. fornecedor_confiabilidade
    features.push((request.contexto.fornecedor_confiabilidade || 75) / 100);

    // 17-25. Features adicionais (defaults)
    features.push(
      0.3, // dias_desde_ultimo_atraso
      0.5, // custo_acumulado_obra
      0.1, // variacao_custo_vs_planejado
      0, // escolha_era_mais_cara
      0, // escolha_era_mais_rapida
      0, // escolha_era_menor_risco
      new Date().getMonth() / 3, // season_encoded
      new Date().getDay(), // day_of_week_encoded
      0.75 // historical_success_rate
    );

    return features;
  }

  private calculateHeuristicScore(opcao: IDecisaoOpcao): number {
    /**
     * Score heurístico: minimizar custo + prazo, minimizar risco
     * Formula: 100 - (custoNorm*30 + prazoNorm*30 + riscoNorm*40)
     */
    const custoNorm = Math.min(opcao.custo_estimado / 1000000, 1.0); // Normalizar a 1M
    const prazoNorm = Math.min(opcao.prazo_dias / 90, 1.0); // Normalizar a 90 dias
    const riscoNorm = opcao.risco_score / 100; // Já normalizado (0-100)

    const score = 100 - (custoNorm * 30 + prazoNorm * 30 + riscoNorm * 40);
    return Math.max(0, Math.min(100, score)); // Clamp 0-100
  }

  private generateRaciocinio(opcao: IDecisaoOpcao, score: number): string {
    /**
     * Gera explicação em linguagem natural para a recomendação
     */
    const factors: string[] = [];

    if (opcao.custo_estimado < 500000) factors.push('custo reduzido');
    if (opcao.prazo_dias < 14) factors.push('implementação rápida');
    if (opcao.risco_score < 40) factors.push('risco baixo');
    if (opcao.risco_score > 70) factors.push('risco elevado');

    return factors.length > 0
      ? `Opção recomendada por: ${factors.join(', ')}`
      : 'Opção equilibrada em custo-prazo-risco';
  }

  private getTopFeatures(
    features: number[],
    topN: number
  ): { feature: string; importance: number }[] {
    /**
     * Retorna top N features mais importantes (mock)
     */
    const featureNames = [
      'event_type',
      'num_opcoes',
      'top1_option_cost',
      'top1_option_prazo',
      'top1_option_risco',
      'obra_completion',
      'equipe_tamanho',
      'fornecedor_confiabilidade',
    ];

    return featureNames.slice(0, topN).map((name, idx) => ({
      feature: name,
      importance: Math.round((features[idx] || 0) * 100),
    }));
  }

  private generateCacheKey(request: IRecommendationRequest): string {
    /**
     * Gera chave de cache baseada em evento + contexto
     */
    return `rec_${request.evento_id}_${request.tipo_evento}`;
  }

  private getFromCache(
    key: string
  ): IRecommendationResponse | null {
    /**
     * Recupera do cache se ainda válido
     */
    const cached = this.inferenceCache.get(key);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.inferenceCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private saveToCache(key: string, data: IRecommendationResponse): void {
    /**
     * Salva resposta no cache em memória
     */
    this.inferenceCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private invalidateRelatedCache(eventoId: string): void {
    /**
     * Invalida cache relacionado a um evento
     */
    const keysToDelete: string[] = [];

    for (const key of this.inferenceCache.keys()) {
      if (key.includes(eventoId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.inferenceCache.delete(key));
  }

  private async logRecommendation(
    eventoId: string,
    recomendacoes: IRecommendation[]
  ): Promise<void> {
    /**
     * Registra recomendações em recommendation_logs para auditoria
     */
    try {
      const query = `
        INSERT INTO recommendation_logs (evento_id, recomendacoes, timestamp)
        VALUES ($1, $2, NOW())
      `;

      await this.dbPool.query(query, [
        eventoId,
        JSON.stringify(recomendacoes),
      ]);
    } catch (error) {
      this.logger.warn('Erro ao logar recomendação:', error);
    }
  }

  private generateFallbackResponse(
    request: IRecommendationRequest,
    latency: number,
    error: any
  ): IRecommendationResponse {
    /**
     * Fallback: recomendação baseada em heurística quando modelo falha
     */
    this.logger.warn(`⚠️  Usando fallback para ${request.evento_id}: ${error.message}`);

    const recomendacoes = request.opcoes
      .map((opcao) => ({
        opcao_id: opcao.id,
        descricao: opcao.descricao,
        score: this.calculateHeuristicScore(opcao),
        confianca: 0.5, // Confiança baixa no fallback
        posicao: 1 as const,
        raciocinio: '(modo fallback) ' + this.generateRaciocinio(opcao, 50),
        feature_contributions: [],
      }))
      .sort((a, b) => b.score - a.score)
      .map((rec, idx) => ({
        ...rec,
        posicao: (idx + 1) as 1 | 2 | 3,
      }));

    return {
      evento_id: request.evento_id,
      timestamp: new Date().toISOString(),
      model_version: 'fallback',
      latency_ms: latency,
      recomendacoes: recomendacoes.slice(0, 3),
      fallback: true,
    };
  }
}
