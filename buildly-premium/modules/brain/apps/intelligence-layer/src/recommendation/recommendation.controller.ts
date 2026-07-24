/**
 * Recommendation Controller — REST API Endpoints
 *
 * Phase 3.1: Recommendation Engine — Week 3
 * Exposes inference and feedback endpoints for decision recommendations
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

interface IRecommendationRequest {
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
    fase_obra?: string;
    conclusao_pct?: number;
    equipe_tamanho?: number;
    fornecedor_confiabilidade?: number;
  };
}

interface IFeedbackRequest {
  resultado: 'sucesso' | 'parcial' | 'falha';
}

@Controller('recommendations')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(private readonly recommendationService: RecommendationService) {}

  @Post('infer')
  @HttpCode(HttpStatus.OK)
  async infer(@Body() request: IRecommendationRequest) {
    /**
     * POST /recommendations/infer
     *
     * Request:
     * {
     *   "evento_id": "uuid",
     *   "obra_id": "uuid",
     *   "tipo_evento": "MATERIAL_DELAY",
     *   "opcoes": [
     *     {
     *       "id": "opt1",
     *       "descricao": "Esperar",
     *       "custo_estimado": 150000,
     *       "prazo_dias": 15,
     *       "risco_score": 80
     *     }
     *   ],
     *   "contexto": {
     *     "fase_obra": "estrutura",
     *     "conclusao_pct": 45,
     *     "equipe_tamanho": 25,
     *     "fornecedor_confiabilidade": 75
     *   }
     * }
     *
     * Response (200 OK):
     * {
     *   "evento_id": "uuid",
     *   "timestamp": "2026-08-06T10:30:00Z",
     *   "model_version": "v2.0",
     *   "latency_ms": 87,
     *   "recomendacoes": [
     *     {
     *       "opcao_id": "opt2",
     *       "descricao": "Reordenar",
     *       "score": 75,
     *       "confianca": 0.85,
     *       "posicao": 1,
     *       "raciocinio": "Opção recomendada por: custo reduzido, implementação rápida, risco baixo",
     *       "feature_contributions": [
     *         { "feature": "event_type", "importance": 15 },
     *         { "feature": "top1_option_cost", "importance": 12 }
     *       ]
     *     }
     *   ],
     *   "fallback": false
     * }
     */
    try {
      this.logger.debug(`🔍 Recomendação: ${request.evento_id}`);
      const response = await this.recommendationService.recomendarOpcoes(
        request
      );

      this.logger.log(
        `✅ Recomendação gerada (${response.latency_ms}ms, fallback: ${response.fallback})`
      );

      return response;
    } catch (error) {
      this.logger.error('Erro na inference:', error);
      throw error;
    }
  }

  @Post('infer/batch')
  @HttpCode(HttpStatus.OK)
  async inferBatch(@Body() requests: IRecommendationRequest[]) {
    /**
     * POST /recommendations/infer/batch
     *
     * Process multiple recommendations in parallel (max 10 per request)
     * Response: Array of recommendations with aggregated metrics
     */
    this.logger.debug(`📦 Batch inference: ${requests.length} eventos`);

    const startTime = Date.now();
    const responses = await Promise.all(
      requests
        .slice(0, 10) // Limit to 10 per batch
        .map((req) => this.recommendationService.recomendarOpcoes(req))
    );

    const totalLatency = Date.now() - startTime;
    const avgLatency = Math.round(totalLatency / responses.length);

    this.logger.log(
      `✅ Batch inference completo: ${responses.length} recomendações em ${totalLatency}ms (avg: ${avgLatency}ms)`
    );

    return {
      timestamp: new Date().toISOString(),
      count: responses.length,
      total_latency_ms: totalLatency,
      avg_latency_ms: avgLatency,
      responses,
    };
  }

  @Post(':eventoId/feedback')
  @HttpCode(HttpStatus.CREATED)
  async registerFeedback(
    @Param('eventoId') eventoId: string,
    @Body() feedback: IFeedbackRequest
  ) {
    /**
     * POST /recommendations/:eventoId/feedback
     *
     * Request:
     * {
     *   "resultado": "sucesso"
     * }
     *
     * Response (201 Created):
     * {
     *   "evento_id": "uuid",
     *   "feedback": "sucesso",
     *   "timestamp": "2026-08-06T10:35:00Z",
     *   "message": "Feedback registrado com sucesso"
     * }
     */
    try {
      this.logger.debug(`📝 Feedback: ${eventoId} → ${feedback.resultado}`);

      await this.recommendationService.registrarFeedback(
        eventoId,
        'unknown', // opcao_escolhida would come from previous recommendation
        feedback.resultado
      );

      this.logger.log(`✅ Feedback registrado: ${eventoId}`);

      return {
        evento_id: eventoId,
        feedback: feedback.resultado,
        timestamp: new Date().toISOString(),
        message: 'Feedback registrado com sucesso',
      };
    } catch (error) {
      this.logger.error('Erro ao registrar feedback:', error);
      throw error;
    }
  }

  @Get('health')
  async health() {
    /**
     * GET /recommendations/health
     *
     * Service health check endpoint
     *
     * Response:
     * {
     *   "status": "ok",
     *   "timestamp": "2026-08-06T10:30:00Z",
     *   "model_loaded": true
     * }
     */
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      model_loaded: true,
      message: 'Recommendation service is running',
    };
  }

  @Get('metrics')
  async metrics() {
    /**
     * GET /recommendations/metrics
     *
     * Service performance metrics (for monitoring)
     *
     * Response:
     * {
     *   "cache_size": 45,
     *   "cache_hits": 1234,
     *   "cache_misses": 567,
     *   "avg_latency_ms": 87,
     *   "max_latency_ms": 198,
     *   "errors_total": 3,
     *   "fallback_count": 2
     * }
     */
    return {
      timestamp: new Date().toISOString(),
      message: 'Metrics endpoint (to be implemented)',
      status: 'planning',
    };
  }
}
