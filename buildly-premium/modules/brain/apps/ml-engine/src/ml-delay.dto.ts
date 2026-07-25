import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MaterialDelayPredictionDTO {
  @ApiProperty({ example: 'pred-uuid', description: 'Unique prediction ID' })
  id: string;

  @ApiProperty({ example: 'obra-123', description: 'Construction site ID' })
  obra_id: string;

  @ApiProperty({ example: 'mat-cimento', description: 'Material ID' })
  material_id: string;

  @ApiProperty({ example: 'Cimento CP II', description: 'Material name' })
  material_name: string;

  @ApiProperty({ example: 8, description: 'Predicted delay in days' })
  predicted_delay_days: number;

  @ApiProperty({ example: 0.78, description: 'Confidence score (0-1)' })
  confidence: number;

  @ApiProperty({
    example: 'CRITICAL',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    description: 'Alert severity level',
  })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ example: '2026-08-02', description: 'Predicted delay date' })
  predicted_date: string;

  @ApiProperty({
    example: 'Reordenar cronograma (risco crítico)',
    description: 'Recommended action',
  })
  recommended_action: string;

  @ApiProperty({
    example: true,
    description: 'Whether approval is required before action',
  })
  requires_approval: boolean;
}

export class MaterialDelayAlertSummaryDTO {
  @ApiProperty({ example: 3, description: 'Total number of alerts' })
  total_alerts: number;

  @ApiProperty({ example: 1, description: 'Critical severity alerts' })
  critical_alerts: number;

  @ApiProperty({ example: 1, description: 'High severity alerts' })
  high_alerts: number;

  @ApiProperty({ example: 85000, description: 'Estimated financial impact in BRL' })
  estimated_impact_brl: number;
}

export class MaterialDelayAlertDataDTO {
  @ApiProperty({ example: 'obra-123' })
  obra_id: string;

  @ApiProperty({ type: [MaterialDelayPredictionDTO] })
  predictions: MaterialDelayPredictionDTO[];

  @ApiProperty({ type: MaterialDelayAlertSummaryDTO })
  summary: MaterialDelayAlertSummaryDTO;
}

export class MaterialDelayAlertMetadataDTO {
  @ApiProperty({ example: 340, description: 'Query execution time in milliseconds' })
  query_time_ms: number;

  @ApiProperty({ example: false, description: 'Whether result was served from cache' })
  cache_hit: boolean;

  @ApiProperty({ example: 7, description: 'Forecast days requested' })
  forecast_days: number;
}

export class MaterialDelayAlertResponseDTO {
  @ApiProperty({ example: 'success', enum: ['success', 'error'] })
  status: 'success' | 'error';

  @ApiProperty({ type: MaterialDelayAlertDataDTO })
  data: MaterialDelayAlertDataDTO;

  @ApiProperty({ type: MaterialDelayAlertMetadataDTO })
  metadata: MaterialDelayAlertMetadataDTO;
}

export class PredictMaterialDelayQueryDTO {
  @ApiProperty({
    required: false,
    example: 'obra-123',
    description: 'Construction site ID (fallback for X-Tenant-ID header)',
  })
  @IsOptional()
  @IsString()
  obra_id?: string;

  @ApiProperty({
    required: false,
    example: 7,
    description: 'Number of days to forecast (1-30)',
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  forecast_days?: number;
}

export class MaterialDelayFeedbackDTO {
  @ApiProperty({
    example: 'pred-uuid',
    description: 'Prediction ID to provide feedback on',
  })
  @IsString()
  prediction_id: string;

  @ApiProperty({
    example: 'occurred',
    enum: ['occurred', 'prevented', 'false_positive'],
    description: 'Actual outcome of the prediction',
  })
  @IsString()
  actual_outcome: 'occurred' | 'prevented' | 'false_positive';

  @ApiProperty({
    required: false,
    example: '2026-08-01',
    description: 'Actual delay date if occurred',
  })
  @IsOptional()
  @IsString()
  actual_date?: string;

  @ApiProperty({
    required: false,
    example: 35000,
    description: 'Actual financial impact in BRL',
  })
  @IsOptional()
  @IsNumber()
  actual_impact_brl?: number;

  @ApiProperty({
    required: false,
    example: 'Reordenamos e economizamos R$ 30k',
    description: 'Notes about the outcome',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
