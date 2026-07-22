/**
 * BrainModule
 * Módulo NestJS que agrupa controller, services, e configurações do Brain
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BrainController } from './controllers/brain.controller';
import { BrainService } from './services/brain.service';
import { BrainCacheService } from './services/brain.cache';

/**
 * Brain Module
 *
 * Responsável por:
 * - Semantic Search (busca em linguagem natural)
 * - Knowledge Graph queries (Neo4j)
 * - Vector similarity search (Qdrant)
 * - Query translation (NLP)
 * - Embedding management
 * - Cache management (Redis)
 *
 * Componentes:
 * - BrainController: REST API endpoints
 * - BrainService: Business logic
 * - BrainCacheService: Redis caching layer
 *
 * Requisitos:
 * - Neo4j 5.0+ (knowledge graph)
 * - Qdrant 1.0+ (vector DB)
 * - Redis 6.0+ (cache)
 * - Python 3.9+ (scripts backend)
 */
@Module({
  imports: [ConfigModule],
  controllers: [BrainController],
  providers: [BrainService, BrainCacheService],
  exports: [BrainService, BrainCacheService],
})
export class BrainModule {}
