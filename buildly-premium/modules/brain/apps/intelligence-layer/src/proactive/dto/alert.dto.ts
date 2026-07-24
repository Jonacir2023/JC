/**
 * Alert DTOs for Phase 3.4 Proactive
 */

import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export enum PatternType {
  TEMPORAL = 'temporal',
  CAUSAL = 'causal',
  CASCADE = 'cascade',
  RESOURCE = 'resource',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * DTO para representar um padrão detectado
 */
export class DetectedPatternDto {
  @IsString()
  pattern_id: string;

  @IsEnum(PatternType)
  type: PatternType;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsString()
  rdo_id: string;

  @IsString()
  obra_id: string;

  @IsOptional()
  @IsNumber()
  estimated_impact_days?: number;

  @IsOptional()
  @IsNumber()
  estimated_impact_cost?: number;
}

/**
 * DTO para alerta gerado
 */
export class AlertDto {
  @IsString()
  id: string;

  @IsString()
  rdo_id: string;

  @IsString()
  obra_id: string;

  @IsEnum(PatternType)
  pattern_type: PatternType;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsString()
  recommended_action?: string;

  detected_at: string;
  expires_at?: string;
}

/**
 * DTO para recomendação de ação
 */
export class RecommendationDto {
  @IsString()
  id: string;

  @IsString()
  alert_id: string;

  @IsString()
  action_title: string;

  @IsString()
  action_description: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  historical_effectiveness: number;

  @IsOptional()
  @IsNumber()
  estimated_savings?: number;

  @IsOptional()
  @IsString()
  responsible_team?: string;
}

/**
 * DTO para feedback de implementação
 */
export class AlertFeedbackDto {
  @IsString()
  alert_id: string;

  @IsString()
  action_taken: 'implemented' | 'ignored' | 'partial';

  @IsOptional()
  @IsString()
  feedback_text?: string;

  @IsOptional()
  @IsNumber()
  actual_outcome_days?: number;

  @IsOptional()
  @IsNumber()
  actual_outcome_cost?: number;
}

/**
 * DTO para resposta de alert
 */
export class AlertResponseDto {
  alert: AlertDto;
  recommendations: RecommendationDto[];
  notification_sent: boolean;
  notification_channels: string[];
}
