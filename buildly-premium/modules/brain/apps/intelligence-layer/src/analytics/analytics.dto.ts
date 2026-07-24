import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum AggregationPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum MetricType {
  EVENTS = 'events',
  ALERTS = 'alerts',
  PATTERNS = 'patterns',
  EFFECTIVENESS = 'effectiveness',
}

export class EventsAggregatedRequest {
  @IsString()
  obra_id: string;

  @IsOptional()
  @IsEnum(AggregationPeriod)
  period?: AggregationPeriod = AggregationPeriod.DAILY;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  tenant_id?: string;
}

export class PatternEffectivenessRequest {
  @IsString()
  obra_id: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  tenant_id?: string;
}

export class AlertsTimelineRequest {
  @IsString()
  obra_id: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  tenant_id?: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;
}

export class ObrasSummaryRequest {
  @IsOptional()
  @IsString()
  tenant_id?: string;

  @IsOptional()
  @IsDateString()
  period_start?: string;

  @IsOptional()
  @IsDateString()
  period_end?: string;
}

// Response DTOs

export class EventCountMetric {
  @IsDateString()
  date: string;

  @IsNumber()
  count: number;

  @IsNumber()
  extraction_rate: number;

  @IsNumber()
  avg_duration_minutes: number;
}

export class EventsAggregatedResponse {
  @IsString()
  obra_id: string;

  @IsString()
  period: AggregationPeriod;

  @IsString()
  start_date: string;

  @IsString()
  end_date: string;

  metrics: EventCountMetric[];

  @IsNumber()
  total_events: number;

  @IsNumber()
  daily_average: number;
}

export class PatternEffectivenessMetric {
  @IsString()
  pattern_type: string;

  @IsNumber()
  confidence: number;

  @IsNumber()
  effectiveness_score: number;

  @IsNumber()
  recommendations_generated: number;

  @IsNumber()
  recommendations_accepted: number;

  @IsNumber()
  actual_impact_value: number;

  @IsString()
  status: string;
}

export class PatternEffectivenessResponse {
  @IsString()
  obra_id: string;

  @IsString()
  start_date: string;

  @IsString()
  end_date: string;

  patterns: PatternEffectivenessMetric[];

  @IsNumber()
  overall_effectiveness: number;

  @IsNumber()
  total_patterns_detected: number;

  @IsNumber()
  recommendation_adoption_rate: number;
}

export class AlertMetric {
  @IsDateString()
  date: string;

  @IsString()
  severity: string;

  @IsNumber()
  count: number;

  @IsNumber()
  avg_resolution_hours: number;

  @IsString()
  most_common_pattern_type: string;
}

export class AlertsTimelineResponse {
  @IsString()
  obra_id: string;

  @IsString()
  start_date: string;

  @IsString()
  end_date: string;

  timeline: AlertMetric[];

  @IsNumber()
  total_alerts: number;

  @IsNumber()
  critical_alerts: number;

  @IsNumber()
  avg_resolution_time: number;

  @IsNumber()
  alert_resolution_rate: number;
}

export class ObraKPI {
  @IsString()
  obra_id: string;

  @IsString()
  obra_name: string;

  @IsNumber()
  total_events: number;

  @IsNumber()
  total_alerts: number;

  @IsNumber()
  active_patterns: number;

  @IsNumber()
  effectiveness_score: number;

  @IsNumber()
  recommendations_implemented: number;

  @IsNumber()
  cost_savings_estimated: number;

  @IsString()
  status: string;

  @IsDateString()
  last_alert_date: string;
}

export class ObrasSummaryResponse {
  @IsString()
  tenant_id: string;

  @IsNumber()
  total_obras: number;

  @IsNumber()
  total_events: number;

  @IsNumber()
  total_alerts: number;

  @IsNumber()
  avg_effectiveness: number;

  obras: ObraKPI[];

  @IsDateString()
  generated_at: string;
}
