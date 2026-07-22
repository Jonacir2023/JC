/**
 * BrainService
 * Lógica de negócio para operações de Brain (extração, busca, análise)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  SearchQueryDto,
  SearchAdvancedQueryDto,
  SearchResponseDto,
  SearchResultDto,
  SimilarLessonsQueryDto,
  LessonStatsDto,
  BrainHealthDto,
} from '../dto/search.dto';
import { BrainCacheService } from './brain.cache';

/**
 * Interface para resultado de busca do Qdrant/Neo4j
 */
interface RawSearchResult {
  rank: number;
  rdo_id: string;
  similarity_score: number;
  tipo_evento: string;
  resultado: string;
  resumo: string;
  confiabilidade: number;
  solucoes: string[];
  impacto_economia: number;
  impacto_prazo_dias: number;
  data: string;
  tags?: string[];
}

@Injectable()
export class BrainService {
  private readonly logger = new Logger('BrainService');
  private pythonScriptPath: string;

  constructor(
    private configService: ConfigService,
    private cacheService: BrainCacheService,
  ) {
    this.pythonScriptPath = this.configService.get<string>(
      'BRAIN_SCRIPTS_PATH',
      './buildly-premium/scripts'
    );
  }

  /**
   * Busca semântica simples
   * 1. Verifica cache
   * 2. Chama Python script (brain_semantic_search.py)
   * 3. Processa resultado
   * 4. Armazena em cache
   */
  async search(dto: SearchQueryDto): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(dto.query, dto.obra_id);

    // 1. Verificar cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return {
        ...cached,
        cache_hit: true,
      };
    }

    this.logger.log(`Searching: "${dto.query}" for obra: ${dto.obra_id}`);

    try {
      // 2. Chamar Python script (mock em TypeScript)
      const results = await this.callPythonSearch(
        dto.query,
        dto.obra_id,
        dto.top_k,
        dto.min_similarity
      );

      // 3. Processar resultado
      const response: SearchResponseDto = {
        query: dto.query,
        obra_id: dto.obra_id,
        total_results: results.length,
        search_time_ms: Date.now() - startTime,
        summary: this.generateSummary(results),
        results: results,
        cache_hit: false,
      };

      // 4. Armazenar em cache (24h)
      await this.cacheService.set(cacheKey, response, 86400);

      return response;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca avançada com filtros estruturados
   */
  async searchAdvanced(dto: SearchAdvancedQueryDto): Promise<SearchResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `Advanced search: "${dto.query}" for obra: ${dto.obra_id} with filters`
    );

    try {
      // Construir filtros Qdrant a partir de dto.filters
      const qdrantFilters = this.buildQdrantFilters(dto.filters);

      // Chamar Python script com filtros
      const results = await this.callPythonSearchWithFilters(
        dto.query,
        dto.obra_id,
        qdrantFilters,
        dto.top_k
      );

      const response: SearchResponseDto = {
        query: dto.query,
        obra_id: dto.obra_id,
        total_results: results.length,
        search_time_ms: Date.now() - startTime,
        summary: this.generateSummary(results),
        results: results,
      };

      return response;
    } catch (error) {
      this.logger.error(`Advanced search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar lições similares por tipo de evento
   */
  async getSimilarLessons(
    dto: SimilarLessonsQueryDto
  ): Promise<SearchResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `Finding similar lessons for tipo_evento: ${dto.tipo_evento}`
    );

    try {
      const results = await this.callPythonSimilarSearch(
        dto.tipo_evento,
        dto.obra_id,
        dto.resultado,
        dto.top_k
      );

      const response: SearchResponseDto = {
        query: `Casos similares a: ${dto.tipo_evento}`,
        obra_id: dto.obra_id,
        total_results: results.length,
        search_time_ms: Date.now() - startTime,
        summary: this.generateSummary(results),
        results: results,
      };

      return response;
    } catch (error) {
      this.logger.error(`Similar lessons search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Estatísticas de lições por obra
   */
  async getLessonStats(obra_id: string): Promise<LessonStatsDto> {
    this.logger.log(`Getting stats for obra: ${obra_id}`);

    try {
      // Chamar Python script para colher estatísticas
      const stats = await this.callPythonGetStats(obra_id);

      return {
        obra_id,
        total_lessons: stats.total,
        lesson_count_by_type: stats.by_type,
        average_confidence: stats.avg_confidence,
        success_rate: stats.success_rate,
        total_economic_impact: stats.total_impact,
        total_time_impact: stats.total_time,
        last_lesson_date: stats.last_date,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check do Brain
   */
  async getHealth(): Promise<BrainHealthDto> {
    this.logger.log('Checking Brain health...');

    try {
      const health = await this.callPythonHealth();

      return {
        status: health.neo4j === 'connected' && health.qdrant === 'connected'
          ? 'healthy'
          : 'degraded',
        neo4j: health.neo4j,
        qdrant: health.qdrant,
        cache: 'connected', // Redis check
        total_lessons: health.lessons_count,
        embeddings_count: health.embeddings_count,
        cache_hit_rate: health.cache_hits / (health.cache_hits + health.cache_misses),
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        neo4j: 'disconnected',
        qdrant: 'disconnected',
        cache: 'disconnected',
        total_lessons: 0,
        embeddings_count: 0,
        cache_hit_rate: 0,
        last_check: new Date().toISOString(),
      };
    }
  }

  /**
   * Invalidar cache para uma obra (ao adicionar nova lição)
   */
  async invalidateObraCache(obra_id: string): Promise<void> {
    this.logger.log(`Invalidating cache for obra: ${obra_id}`);
    await this.cacheService.invalidateObraCache(obra_id);
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Gerar chave de cache
   */
  private generateCacheKey(query: string, obra_id: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${obra_id}:${query}`)
      .digest('hex');
    return `brain:search:${hash}`;
  }

  /**
   * Chamar Python script de busca
   * Em produção, usa subprocess.run ou HTTP request
   */
  private async callPythonSearch(
    query: string,
    obra_id: string,
    top_k: number,
    min_similarity: number
  ): Promise<SearchResultDto[]> {
    // TODO: Implementar chamada real via subprocess ou HTTP
    // Por agora, retorna mock data
    this.logger.debug(`Mock search: ${query}`);

    return [
      {
        rank: 1,
        rdo_id: 'RDO-20260814-001',
        similarity_score: 0.92,
        tipo_evento: 'ATRASO_MATERIAL',
        resultado: 'sucesso',
        resumo: 'Cimento chegou 15 dias atrasado. Reordenação resolveu.',
        confiabilidade: 0.85,
        solucoes: ['reordenacao_tarefas', 'equipe_extra'],
        impacto_economia: 150000,
        impacto_prazo_dias: 8,
        data: '2026-08-14',
      },
    ];
  }

  /**
   * Chamar Python script com filtros Qdrant
   */
  private async callPythonSearchWithFilters(
    query: string,
    obra_id: string,
    filters: Record<string, any>,
    top_k: number
  ): Promise<SearchResultDto[]> {
    // TODO: Implementar com filtros
    return this.callPythonSearch(query, obra_id, top_k, 0.5);
  }

  /**
   * Chamar Python script para busca por similaridade
   */
  private async callPythonSimilarSearch(
    tipo_evento: string,
    obra_id: string,
    resultado?: string,
    top_k?: number
  ): Promise<SearchResultDto[]> {
    // TODO: Implementar
    return [];
  }

  /**
   * Chamar Python script para estatísticas
   */
  private async callPythonGetStats(obra_id: string): Promise<any> {
    // TODO: Implementar
    return {
      total: 50,
      by_type: {
        ATRASO_MATERIAL: 20,
        QUALIDADE: 15,
        SEGURANCA: 8,
        CUSTO: 7,
      },
      avg_confidence: 0.82,
      success_rate: 0.68,
      total_impact: 5170000,
      total_time: 45,
      last_date: new Date().toISOString(),
    };
  }

  /**
   * Chamar Python script para health check
   */
  private async callPythonHealth(): Promise<any> {
    // TODO: Implementar
    return {
      neo4j: 'connected',
      qdrant: 'connected',
      lessons_count: 50,
      embeddings_count: 50,
      cache_hits: 1000,
      cache_misses: 200,
    };
  }

  /**
   * Construir filtros Qdrant a partir de DTO
   */
  private buildQdrantFilters(filters?: any): Record<string, any> {
    if (!filters) return null;

    const qdrantFilter: any = { must: [] };

    if (filters.tipo_evento) {
      qdrantFilter.must.push({
        key: 'tipo_evento',
        match: { any: { options: filters.tipo_evento } },
      });
    }

    if (filters.tags) {
      qdrantFilter.must.push({
        key: 'tags',
        match: { any: { options: filters.tags } },
      });
    }

    if (filters.resultado) {
      qdrantFilter.must.push({
        key: 'resultado',
        match: { value: filters.resultado },
      });
    }

    if (filters.min_confiabilidade) {
      qdrantFilter.must.push({
        key: 'confiabilidade',
        range: { gte: filters.min_confiabilidade },
      });
    }

    return qdrantFilter.must.length > 0 ? qdrantFilter : null;
  }

  /**
   * Gerar resumo conversacional
   */
  private generateSummary(results: SearchResultDto[]): string {
    if (!results || results.length === 0) {
      return 'Nenhuma lição similar encontrada.';
    }

    const topResult = results[0];
    const count = results.length;

    return `Encontramos ${count} caso(s) similar(es). O mais relevante (${(topResult.similarity_score * 100).toFixed(0)}% similaridade): ${topResult.resumo.substring(0, 80)}...`;
  }
}
