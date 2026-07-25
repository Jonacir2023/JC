import { Injectable, Inject, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Buildly Core Integration with Brain ML Engine
 * Production service for material delay predictions
 */

interface MaterialDelayPrediction {
  id: string;
  material_id: string;
  material_name: string;
  predicted_delay_days: number;
  confidence: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  predicted_date: string;
  recommended_action: string;
  requires_approval: boolean;
}

interface PredictionSummary {
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  estimated_impact_brl: number;
}

export interface DelayAlertResponse {
  predictions: MaterialDelayPrediction[];
  summary: PredictionSummary;
  errors?: string[];
}

export interface FormattedAlert {
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
}

@Injectable()
export class BrainDelayService {
  private readonly logger = new Logger(BrainDelayService.name);
  private brainClient: AxiosInstance;

  private readonly severityEmoji = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢',
  };

  private readonly severityOrder = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  };

  constructor() {
    this.brainClient = axios.create({
      baseURL: process.env.BRAIN_ML_URL || 'http://brain-ml:3002',
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (process.env.BRAIN_API_TOKEN) {
      this.brainClient.defaults.headers.common['Authorization'] = `Bearer ${process.env.BRAIN_API_TOKEN}`;
    }
  }

  /**
   * Fetch predictions from Brain ML Engine
   */
  async getPredictions(
    obra_id: string,
    forecast_days: number = 7,
  ): Promise<DelayAlertResponse> {
    try {
      this.logger.debug(`Fetching predictions for obra ${obra_id}, forecast_days=${forecast_days}`);

      const response = await this.brainClient.get('/ml/predict/delays', {
        params: { forecast_days },
        headers: { 'X-Tenant-ID': obra_id },
      });

      const predictions = response.data.data.predictions || [];
      const summary = response.data.data.summary || {
        total_alerts: 0,
        critical_alerts: 0,
        high_alerts: 0,
        estimated_impact_brl: 0,
      };

      this.logger.debug(`Retrieved ${predictions.length} predictions for obra ${obra_id}`);

      return { predictions, summary };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Brain prediction failed for obra ${obra_id}: ${errorMsg}`);

      return {
        predictions: [],
        summary: {
          total_alerts: 0,
          critical_alerts: 0,
          high_alerts: 0,
          estimated_impact_brl: 0,
        },
        errors: [`Brain unavailable: ${errorMsg}`],
      };
    }
  }

  /**
   * Format raw prediction into UI-ready alert
   */
  formatAlertForUI(prediction: MaterialDelayPrediction): FormattedAlert {
    return {
      id: prediction.id,
      title: `${this.severityEmoji[prediction.severity]} Risco de Atraso: ${prediction.material_name}`,
      severity: prediction.severity,
      confidence: Math.round(prediction.confidence * 100),
      material: prediction.material_name,
      predictedDate: new Date(prediction.predicted_date).toLocaleDateString('pt-BR'),
      estimatedDelay: prediction.predicted_delay_days,
      estimatedImpact: this.formatCurrency(prediction.confidence * this.getBaseImpact(prediction.severity)),
      recommendation: prediction.recommended_action,
      requiresApproval: prediction.requires_approval,
    };
  }

  /**
   * Format alerts for list display (sorted by severity)
   */
  formatAlertsForList(predictions: MaterialDelayPrediction[]): FormattedAlert[] {
    return predictions
      .map((p) => this.formatAlertForUI(p))
      .sort((a, b) => this.severityOrder[a.severity] - this.severityOrder[b.severity]);
  }

  /**
   * Submit feedback for a prediction (approval workflow)
   */
  async submitFeedback(
    obra_id: string,
    prediction_id: string,
    outcome: 'occurred' | 'prevented' | 'false_positive',
    actualDate?: string,
    actualImpactBrl?: number,
    notes?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.debug(`Submitting feedback for prediction ${prediction_id}: ${outcome}`);

      await this.brainClient.post(
        '/ml/predict/delays/feedback',
        {
          prediction_id,
          actual_outcome: outcome,
          actual_date: actualDate,
          actual_impact_brl: actualImpactBrl,
          notes: notes || `Feedback from Core API (outcome: ${outcome})`,
        },
        {
          headers: { 'X-Tenant-ID': obra_id },
        },
      );

      this.logger.debug(`Feedback recorded for prediction ${prediction_id}`);

      return {
        success: true,
        message: `Feedback recorded. Model will improve on next training cycle.`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Feedback submission failed: ${errorMsg}`);

      return {
        success: false,
        message: `Failed to record feedback: ${errorMsg}`,
      };
    }
  }

  /**
   * Calculate total impact for summary
   */
  calculateTotalImpact(summary: PredictionSummary): string {
    return this.formatCurrency(summary.estimated_impact_brl);
  }

  /**
   * Check if Brain service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.brainClient.get('/ml/health', {
        timeout: 3000,
      });
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  // Private helpers

  private getBaseImpact(severity: string): number {
    const impacts = {
      CRITICAL: 50000,
      HIGH: 25000,
      MEDIUM: 10000,
      LOW: 5000,
    };
    return impacts[severity] || 0;
  }

  private formatCurrency(value: number): string {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
}
