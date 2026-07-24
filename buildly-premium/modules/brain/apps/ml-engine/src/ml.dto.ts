import { IsString, IsNumber, IsDateString, IsOptional, IsArray, IsObject } from 'class-validator';

export class PatternWeightLearning {
  @IsString()
  pattern_id: string;

  @IsString()
  pattern_type: string;

  @IsNumber()
  current_weight: number;

  @IsNumber()
  confidence_score: number;

  @IsNumber()
  recent_effectiveness: number;

  @IsNumber()
  feedback_count: number;

  @IsDateString()
  last_updated: string;
}

export class PredictiveAlertRequest {
  @IsString()
  obra_id: string;

  @IsOptional()
  @IsNumber()
  forecast_days?: number;

  @IsOptional()
  @IsString()
  tenant_id?: string;
}

export class PredictiveAlertResponse {
  @IsString()
  obra_id: string;

  @IsString()
  forecast_period: string;

  @IsNumber()
  predicted_alerts_count: number;

  @IsNumber()
  confidence_level: number;

  predictions: PredictedAlert[];

  @IsString()
  recommendation: string;

  @IsDateString()
  generated_at: string;
}

export class PredictedAlert {
  @IsDateString()
  predicted_date: string;

  @IsString()
  pattern_type: string;

  @IsNumber()
  probability: number;

  @IsString()
  severity: string;

  @IsNumber()
  estimated_impact_value: number;

  @IsString()
  recommended_action: string;
}

export class CostAttributionRequest {
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
  @IsString()
  attribution_by?: 'pattern' | 'team' | 'activity';
}

export class CostAttributionResponse {
  @IsString()
  obra_id: string;

  @IsString()
  attribution_by: string;

  @IsString()
  period: string;

  @IsNumber()
  total_cost_savings: number;

  @IsNumber()
  total_cost_prevention: number;

  @IsNumber()
  total_cost_optimization: number;

  attributions: CostAttribution[];

  @IsNumber()
  roi_multiplier: number;

  @IsDateString()
  generated_at: string;
}

export class CostAttribution {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  savings_value: number;

  @IsNumber()
  prevention_value: number;

  @IsNumber()
  optimization_value: number;

  @IsNumber()
  total_value: number;

  @IsNumber()
  percentage_of_total: number;

  @IsString()
  status: string;
}

export class ModelPerformanceMetrics {
  @IsString()
  model_name: string;

  @IsNumber()
  accuracy: number;

  @IsNumber()
  precision: number;

  @IsNumber()
  recall: number;

  @IsNumber()
  f1_score: number;

  @IsNumber()
  mean_absolute_error: number;

  @IsNumber()
  roc_auc: number;

  @IsNumber()
  training_samples: number;

  @IsDateString()
  last_trained: string;
}

export class TrainingDataRequest {
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
  sample_type?: 'balanced' | 'stratified' | 'random';
}

export class TrainingDataResponse {
  @IsNumber()
  total_samples: number;

  @IsNumber()
  pattern_samples: number;

  @IsNumber()
  alert_samples: number;

  @IsNumber()
  feedback_samples: number;

  @IsNumber()
  class_balance: number;

  @IsString()
  status: string;

  @IsDateString()
  generated_at: string;
}

export class FeatureImportance {
  @IsString()
  feature_name: string;

  @IsNumber()
  importance_score: number;

  @IsNumber()
  shap_value: number;

  @IsString()
  direction: 'positive' | 'negative';
}

export class ModelExplanation {
  @IsString()
  pattern_type: string;

  @IsArray()
  top_features: FeatureImportance[];

  @IsNumber()
  model_confidence: number;

  @IsString()
  interpretation: string;
}
