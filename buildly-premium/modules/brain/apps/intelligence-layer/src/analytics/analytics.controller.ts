import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  EventsAggregatedRequest,
  EventsAggregatedResponse,
  PatternEffectivenessRequest,
  PatternEffectivenessResponse,
  AlertsTimelineRequest,
  AlertsTimelineResponse,
  ObrasSummaryRequest,
  ObrasSummaryResponse,
} from './analytics.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('events/aggregated')
  @ApiOperation({
    summary: 'Get aggregated events by period',
    description: 'Returns event counts, extraction rates, and processing times by day/week/month',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated event metrics',
    type: EventsAggregatedResponse,
  })
  async getEventsAggregated(
    @Query() req: EventsAggregatedRequest,
  ): Promise<EventsAggregatedResponse> {
    return this.analyticsService.getEventsAggregated(req);
  }

  @Get('patterns/effectiveness')
  @ApiOperation({
    summary: 'Get pattern detection effectiveness metrics',
    description: 'Returns effectiveness scores, confidence, and recommendation adoption for each pattern type',
  })
  @ApiResponse({
    status: 200,
    description: 'Pattern effectiveness metrics',
    type: PatternEffectivenessResponse,
  })
  async getPatternEffectiveness(
    @Query() req: PatternEffectivenessRequest,
  ): Promise<PatternEffectivenessResponse> {
    return this.analyticsService.getPatternEffectiveness(req);
  }

  @Get('alerts/timeline')
  @ApiOperation({
    summary: 'Get alerts timeline by severity',
    description: 'Returns alert counts and resolution times grouped by date and severity',
  })
  @ApiResponse({
    status: 200,
    description: 'Alerts timeline metrics',
    type: AlertsTimelineResponse,
  })
  async getAlertsTimeline(
    @Query() req: AlertsTimelineRequest,
  ): Promise<AlertsTimelineResponse> {
    return this.analyticsService.getAlertsTimeline(req);
  }

  @Get('obras/summary')
  @ApiOperation({
    summary: 'Get summary KPIs for all obras',
    description: 'Returns aggregated metrics for all projects in a tenant: events, alerts, effectiveness, savings',
  })
  @ApiResponse({
    status: 200,
    description: 'Obras summary with KPIs',
    type: ObrasSummaryResponse,
  })
  async getObrasSummary(
    @Query() req: ObrasSummaryRequest,
    @Req() request: any,
  ): Promise<ObrasSummaryResponse> {
    const tenant_id = request.headers['x-tenant-id'] || req.tenant_id || 'default';
    return this.analyticsService.getObrasSummary({
      ...req,
      tenant_id,
    });
  }

  @Get('health')
  @ApiOperation({
    summary: 'Analytics service health check',
    description: 'Returns health status of analytics data pipeline',
  })
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    cache_status: string;
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache_status: 'active (24h TTL)',
    };
  }
}
