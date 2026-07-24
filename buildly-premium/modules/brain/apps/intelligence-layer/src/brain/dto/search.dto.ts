/**
 * DTOs for Brain Semantic Search
 * Request/Response validation for search operations
 */

import { IsString, IsOptional, IsInt, IsNumber, Min, Max, IsArray } from 'class-validator';

/**
 * Request DTO para busca semântica
 *
 * Exemplo:
 * POST /brain/search
 * {
 *   "query": "Quando tivemos atraso por chuva?",
 *   "obra_id": "STAGING-001",
 *   "top_k": 5,
 *   "min_similarity": 0.5
 * }
 */
export class SearchQueryDto {
  @IsString()
  query: string;

  @IsString()
  obra_id: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  top_k: number = 5;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_similarity: number = 0.5;
}

/**
 * Request DTO para busca avançada com filtros
 *
 * Exemplo:
 * POST /brain/search-advanced
 * {
 *   "query": "Atrasos de material",
 *   "obra_id": "STAGING-001",
 *   "filters": {
 *     "tipo_evento": ["ATRASO_MATERIAL"],
 *     "resultado": "sucesso",
 *     "min_confiabilidade": 0.7,
 *     "periodo_dias": 90
 *   },
 *   "top_k": 10
 * }
 */
export class SearchAdvancedQueryDto {
  @IsString()
  query: string;

  @IsString()
  obra_id: string;

  @IsOptional()
  filters?: {
    tipo_evento?: string[];
    tags?: string[];
    resultado?: 'sucesso' | 'parcial' | 'falha';
    min_confiabilidade?: number;
    max_confiabilidade?: number;
    periodo_dias?: number;
    impacto_min?: number;
    impacto_max?: number;
  };

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  top_k: number = 5;
}

/**
 * Response DTO para resultado de busca individual
 */
export class SearchResultDto {
  rank: number;
  rdo_id: string;
  similarity_score: number;
  tipo_evento: string;
  resultado: 'sucesso' | 'parcial' | 'falha';
  resumo: string;
  confiabilidade: number;
  solucoes: string[];
  impacto_economia: number;
  impacto_prazo_dias: number;
  data: string;
  tags?: string[];
}

/**
 * Response DTO para busca semântica
 *
 * Exemplo:
 * {
 *   "query": "Quando tivemos atraso por chuva?",
 *   "obra_id": "STAGING-001",
 *   "total_results": 5,
 *   "search_time_ms": 234.5,
 *   "cache_hit": false,
 *   "summary": "Encontramos 5 casos similares...",
 *   "results": [...]
 * }
 */
export class SearchResponseDto {
  query: string;
  obra_id: string;
  total_results: number;
  search_time_ms: number;
  cache_hit?: boolean;
  summary: string;
  results: SearchResultDto[];
}

/**
 * Request DTO para busca de lições similares por tipo de evento
 */
export class SimilarLessonsQueryDto {
  @IsString()
  tipo_evento: string;

  @IsString()
  obra_id: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  top_k: number = 5;

  @IsOptional()
  @IsString()
  resultado?: 'sucesso' | 'parcial' | 'falha';
}

/**
 * Response DTO para estatísticas de lições por obra
 */
export class LessonStatsDto {
  obra_id: string;
  total_lessons: number;
  lesson_count_by_type: Record<string, number>;
  average_confidence: number;
  success_rate: number;
  total_economic_impact: number;
  total_time_impact: number;
  last_lesson_date: string;
  created_at: string;
}

/**
 * Response DTO para health check
 */
export class BrainHealthDto {
  status: 'healthy' | 'degraded' | 'unhealthy';
  neo4j: 'connected' | 'disconnected';
  qdrant: 'connected' | 'disconnected';
  cache: 'connected' | 'disconnected';
  total_lessons: number;
  embeddings_count: number;
  cache_hit_rate: number;
  last_check: string;
}

/**
 * Error response DTO
 */
export class ErrorResponseDto {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
}
