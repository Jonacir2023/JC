import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';

/**
 * DTOs for Material Delay Alerts API
 */

export class GetDelayAlertsDto {
  @IsString()
  obra_id: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  forecast_days?: number = 7;
}

export class SubmitFeedbackDto {
  @IsString()
  prediction_id: string;

  @IsEnum(['occurred', 'prevented', 'false_positive'])
  outcome: 'occurred' | 'prevented' | 'false_positive';

  @IsOptional()
  @IsString()
  actual_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actual_impact_brl?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DelayAlertResponse {
  status: 'success' | 'partial' | 'error';
  alerts: {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    material: string;
    predictedDate: string;
    estimatedDelay: number;
    estimatedImpact: string;
    recommendation: string;
    requiresApproval: boolean;
  }[];
  summary: {
    total: number;
    critical: number;
    high: number;
    totalImpact: string;
  };
  metadata: {
    obraId: string;
    forecastDays: number;
    retrievedAt: string;
    brainHealthy: boolean;
  };
  errors?: string[];
}
