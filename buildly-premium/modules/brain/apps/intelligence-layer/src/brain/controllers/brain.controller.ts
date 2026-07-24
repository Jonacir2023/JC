/**
 * BrainController
 * REST API endpoints para Brain (Semantic Search, Statistics, Health)
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import {
  SearchQueryDto,
  SearchAdvancedQueryDto,
  SearchResponseDto,
  SimilarLessonsQueryDto,
  LessonStatsDto,
  BrainHealthDto,
  ErrorResponseDto,
  SearchResultDto,
} from '../dto/search.dto';
import { BrainService } from '../services/brain.service';

/**
 * Brain API Controller
 *
 * Endpoints para acesso ao Brain:
 * - POST /brain/search — Busca semântica simples
 * - POST /brain/search-advanced — Busca com filtros estruturados
 * - GET /brain/similar/:tipo_evento — Busca por tipo de evento
 * - GET /brain/stats/:obra_id — Estatísticas da obra
 * - GET /brain/health — Health check
 */
@ApiTags('Brain')
@Controller('brain')
export class BrainController {
  private readonly logger = new Logger('BrainController');

  constructor(private brainService: BrainService) {}

  /**
   * POST /brain/search
   * Busca semântica simples
   *
   * Request:
   * ```
   * {
   *   "query": "Quando tivemos atraso por chuva?",
   *   "obra_id": "STAGING-001",
   *   "top_k": 5,
   *   "min_similarity": 0.5
   * }
   * ```
   *
   * Response: SearchResponseDto com resultados ranqueados
   */
  @Post('search')
  @ApiOperation({
    summary: 'Busca semântica simples',
    description: 'Buscar lições usando linguagem natural',
  })
  @ApiBody({
    type: SearchQueryDto,
    examples: {
      example1: {
        value: {
          query: 'Quando tivemos atraso por chuva?',
          obra_id: 'STAGING-001',
          top_k: 5,
          min_similarity: 0.5,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados da busca encontrados',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validação de entrada falhou',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao processar busca',
    type: ErrorResponseDto,
  })
  async search(@Body() dto: SearchQueryDto): Promise<SearchResponseDto> {
    try {
      this.logger.log(`Search requested: "${dto.query}" for obra: ${dto.obra_id}`);
      const result = await this.brainService.search(dto);
      return result;
    } catch (error) {
      this.logger.error(`Search error: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Search failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /brain/search-advanced
   * Busca com filtros estruturados
   *
   * Permite filtros por:
   * - tipo_evento
   * - tags
   * - resultado (sucesso|parcial|falha)
   * - confiabilidade (min/max)
   * - impacto (min/max)
   * - período (dias)
   */
  @Post('search-advanced')
  @ApiOperation({
    summary: 'Busca avançada com filtros',
    description:
      'Buscar com filtros estruturados (tipo evento, resultado, impacto, etc)',
  })
  @ApiBody({
    type: SearchAdvancedQueryDto,
    examples: {
      example1: {
        value: {
          query: 'Atrasos de material',
          obra_id: 'STAGING-001',
          filters: {
            tipo_evento: ['ATRASO_MATERIAL'],
            resultado: 'sucesso',
            min_confiabilidade: 0.7,
          },
          top_k: 10,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados filtrados encontrados',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validação de entrada falhou',
    type: ErrorResponseDto,
  })
  async searchAdvanced(
    @Body() dto: SearchAdvancedQueryDto
  ): Promise<SearchResponseDto> {
    try {
      this.logger.log(`Advanced search: "${dto.query}" for obra: ${dto.obra_id}`);
      return await this.brainService.searchAdvanced(dto);
    } catch (error) {
      this.logger.error(`Advanced search error: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Advanced search failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /brain/similar/:tipo_evento?obra_id=...
   * Buscar lições similares por tipo de evento
   *
   * Exemplo:
   * GET /brain/similar/ATRASO_MATERIAL?obra_id=STAGING-001&top_k=5&resultado=sucesso
   */
  @Get('similar/:tipo_evento')
  @ApiOperation({
    summary: 'Buscar lições similares',
    description: 'Encontrar lições similares por tipo de evento',
  })
  @ApiParam({
    name: 'tipo_evento',
    description: 'Tipo de evento (ATRASO_MATERIAL, QUALIDADE, SEGURANÇA, etc)',
    example: 'ATRASO_MATERIAL',
  })
  @ApiQuery({
    name: 'obra_id',
    required: true,
    description: 'ID da obra',
    example: 'STAGING-001',
  })
  @ApiQuery({
    name: 'top_k',
    required: false,
    description: 'Número de resultados',
    example: 5,
  })
  @ApiQuery({
    name: 'resultado',
    required: false,
    description: 'Filtrar por resultado (sucesso|parcial|falha)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lições similares encontradas',
    type: SearchResponseDto,
  })
  async getSimilarLessons(
    @Param('tipo_evento') tipo_evento: string,
    @Query('obra_id') obra_id: string,
    @Query('top_k') top_k?: number,
    @Query('resultado') resultado?: string
  ): Promise<SearchResponseDto> {
    try {
      this.logger.log(
        `Finding similar lessons: ${tipo_evento} for obra: ${obra_id}`
      );

      const dto: SimilarLessonsQueryDto = {
        tipo_evento,
        obra_id,
        top_k: top_k || 5,
        resultado: resultado as any,
      };

      return await this.brainService.getSimilarLessons(dto);
    } catch (error) {
      this.logger.error(`Similar lessons error: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to find similar lessons',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /brain/stats/:obra_id
   * Estatísticas de lições por obra
   *
   * Retorna:
   * - Total de lições
   * - Distribuição por tipo de evento
   * - Taxa de sucesso
   * - Impacto econômico total
   * - Impacto de prazo
   */
  @Get('stats/:obra_id')
  @ApiOperation({
    summary: 'Estatísticas de lições',
    description: 'Obter estatísticas agregadas de lições para uma obra',
  })
  @ApiParam({
    name: 'obra_id',
    description: 'ID da obra',
    example: 'STAGING-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de lições',
    type: LessonStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Obra não encontrada',
  })
  async getLessonStats(@Param('obra_id') obra_id: string): Promise<LessonStatsDto> {
    try {
      this.logger.log(`Getting stats for obra: ${obra_id}`);
      return await this.brainService.getLessonStats(obra_id);
    } catch (error) {
      this.logger.error(`Stats error: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get statistics',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /brain/health
   * Health check do Brain
   *
   * Retorna status de:
   * - Neo4j (connected/disconnected)
   * - Qdrant (connected/disconnected)
   * - Redis Cache (connected/disconnected)
   * - Total de lições
   * - Taxa de acerto de cache
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Verificar status dos componentes do Brain',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do Brain',
    type: BrainHealthDto,
  })
  async getHealth(): Promise<BrainHealthDto> {
    try {
      this.logger.log('Health check requested');
      return await this.brainService.getHealth();
    } catch (error) {
      this.logger.error(`Health check error: ${error.message}`);
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
   * POST /brain/invalidate/:obra_id
   * Invalidar cache para uma obra
   *
   * Chamado automaticamente ao adicionar nova lição à base
   */
  @Post('invalidate/:obra_id')
  @ApiOperation({
    summary: 'Invalidar cache',
    description: 'Limpar cache de uma obra (chamado ao adicionar lição)',
  })
  @ApiParam({
    name: 'obra_id',
    description: 'ID da obra',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidado com sucesso',
  })
  async invalidateCache(@Param('obra_id') obra_id: string): Promise<{ message: string }> {
    try {
      this.logger.log(`Invalidating cache for obra: ${obra_id}`);
      await this.brainService.invalidateObraCache(obra_id);
      return { message: `Cache invalidated for obra: ${obra_id}` };
    } catch (error) {
      this.logger.error(`Cache invalidation error: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Cache invalidation failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
