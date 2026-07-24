import { Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MLService } from './ml.service';
import {
  PredictiveAlertRequest,
  PredictiveAlertResponse,
  CostAttributionRequest,
  CostAttributionResponse,
  TrainingDataRequest,
  TrainingDataResponse,
  ModelPerformanceMetrics,
} from './ml.dto';

@ApiTags('ml')
@ApiBearerAuth()
@Controller('ml')
export class MLController {
  constructor(private readonly mlService: MLService) {}

  @Post('train/patterns')
  @ApiOperation({
    summary: 'Train pattern weights from feedback data',
    description: 'Retrains pattern weights using adaptive EMA based on recent feedback and effectiveness scores',
  })
  @ApiResponse({
    status: 200,
    description: 'Training complete',
    schema: {
      properties: {
        status: { type: 'string' },
        patterns_trained: { type: 'number' },
      },
    },
  })
  async trainPatterns(): Promise<{ status: string; patterns_trained: number }> {
    return this.mlService.trainPatternWeights();
  }

  @Get('predict/alerts')
  @ApiOperation({
    summary: 'Get predictive alert forecast',
    description: 'Returns predicted alerts for the next N days using seasonal patterns and historical data',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert predictions',
    type: PredictiveAlertResponse,
  })
  async predictAlerts(
    @Query() req: PredictiveAlertRequest,
  ): Promise<PredictiveAlertResponse> {
    return this.mlService.predictAlerts(req);
  }

  @Get('cost/attribution')
  @ApiOperation({
    summary: 'Get cost attribution and ROI breakdown',
    description: 'Returns cost savings, prevention values, and optimization values attributed to patterns, teams, or activities',
  })
  @ApiResponse({
    status: 200,
    description: 'Cost attribution analysis',
    type: CostAttributionResponse,
  })
  async calculateCosts(
    @Query() req: CostAttributionRequest,
    @Req() request: any,
  ): Promise<CostAttributionResponse> {
    const tenant_id = request.headers['x-tenant-id'] || req.tenant_id || 'default';
    return this.mlService.calculateCostAttribution({
      ...req,
      tenant_id,
    });
  }

  @Get('models/performance')
  @ApiOperation({
    summary: 'Get ML model performance metrics',
    description: 'Returns accuracy, precision, recall, F1 score for each pattern detection model',
  })
  @ApiResponse({
    status: 200,
    description: 'Model performance metrics',
    type: [ModelPerformanceMetrics],
  })
  async getPerformance(
    @Query('pattern_type') pattern_type?: string,
  ): Promise<ModelPerformanceMetrics[]> {
    return this.mlService.getModelPerformance(pattern_type);
  }

  @Post('training/prepare')
  @ApiOperation({
    summary: 'Prepare training dataset',
    description: 'Prepares balanced and stratified training data for model retraining',
  })
  @ApiResponse({
    status: 200,
    description: 'Training data summary',
    type: TrainingDataResponse,
  })
  async prepareTraining(
    @Query() req: TrainingDataRequest,
  ): Promise<TrainingDataResponse> {
    return this.mlService.prepareTrainingData(req);
  }

  @Get('health')
  @ApiOperation({
    summary: 'ML engine health check',
    description: 'Returns ML pipeline health status',
  })
  async getHealth(): Promise<{
    status: string;
    models_active: number;
    last_training: string;
    prediction_ready: boolean;
  }> {
    const metrics = await this.mlService.getModelPerformance();
    return {
      status: metrics.length > 0 ? 'healthy' : 'degraded',
      models_active: metrics.length,
      last_training: metrics[0]?.last_trained || 'Never',
      prediction_ready: metrics.length > 0,
    };
  }
}
