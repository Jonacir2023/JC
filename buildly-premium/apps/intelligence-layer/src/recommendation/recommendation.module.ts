/**
 * Recommendation Module
 *
 * Phase 3.1: Recommendation Engine — Week 3
 * Configures DI for RecommendationService and RecommendationController
 */

import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';

@Module({
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
