import { Injectable, Inject } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Example: How Core API consumes Brain's Material Delay Predictions
 *
 * This is NOT production code yet (PR #5 integration example)
 * Actual implementation depends on Core's service architecture
 */

@Injectable()
export class BrainDelayIntegrationService {
  private brainClient: AxiosInstance;

  constructor() {
    this.brainClient = axios.create({
      baseURL: process.env.BRAIN_ML_URL || 'http://brain-ml:3002',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${process.env.BRAIN_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getPredictionsForObra(
    obra_id: string,
    forecast_days: number = 7,
  ): Promise<{
    predictions: any[];
    summary: any;
    errors?: string[];
  }> {
    try {
      const response = await this.brainClient.get('/ml/predict/delays', {
        params: { forecast_days },
        headers: { 'X-Tenant-ID': obra_id },
      });

      return {
        predictions: response.data.data.predictions,
        summary: response.data.data.summary,
      };
    } catch (error) {
      console.error(`Brain prediction failed for obra ${obra_id}:`, error.message);
      return {
        predictions: [],
        summary: { total_alerts: 0, critical_alerts: 0, high_alerts: 0, estimated_impact_brl: 0 },
        errors: [`Brain unavailable: ${error.message}`],
      };
    }
  }

  async submitApprovalFeedback(
    obra_id: string,
    prediction_id: string,
    outcome: 'occurred' | 'prevented' | 'false_positive',
    actualDate?: string,
    actualImpactBrl?: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.brainClient.post(
        '/ml/predict/delays/feedback',
        {
          prediction_id,
          actual_outcome: outcome,
          actual_date: actualDate,
          actual_impact_brl: actualImpactBrl,
          notes: `Feedback submitted by Gestor for obra ${obra_id}`,
        },
        {
          headers: { 'X-Tenant-ID': obra_id },
        },
      );

      return {
        success: true,
        message: `Feedback recorded. Prediction model will improve on next training cycle.`,
      };
    } catch (error) {
      console.error(`Feedback submission failed:`, error.message);
      return {
        success: false,
        message: `Failed to record feedback: ${error.message}`,
      };
    }
  }

  formatAlertForUI(prediction: any): {
    title: string;
    severity: string;
    confidence: number;
    material: string;
    expectedDate: string;
    estimatedImpact: number;
    recommendation: string;
    requiresApproval: boolean;
  } {
    const severityEmoji = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢',
    };

    return {
      title: `${severityEmoji[prediction.severity]} Risco de Atraso: ${prediction.material_name}`,
      severity: prediction.severity,
      confidence: Math.round(prediction.confidence * 100),
      material: prediction.material_name,
      expectedDate: new Date(prediction.predicted_date).toLocaleDateString('pt-BR'),
      estimatedImpact: Math.round(prediction.predicted_delay_days),
      recommendation: prediction.recommended_action,
      requiresApproval: prediction.requires_approval,
    };
  }

  calculateTotalImpact(summary: any): string {
    const impact = summary.estimated_impact_brl;
    return `R$ ${(impact / 1000).toFixed(1)}k`;
  }
}

/**
 * Example usage in a REST endpoint:
 *
 * @Get('obras/:obra_id/delay-alerts')
 * async getDelayAlerts(@Param('obra_id') obra_id: string) {
 *   const { predictions, summary, errors } = await this.brainService.getPredictionsForObra(obra_id);
 *
 *   return {
 *     status: 'success',
 *     alerts: predictions.map(p => this.brainService.formatAlertForUI(p)),
 *     summary: {
 *       total: summary.total_alerts,
 *       critical: summary.critical_alerts,
 *       totalImpact: this.brainService.calculateTotalImpact(summary),
 *     },
 *     errors,
 *   };
 * }
 *
 * @Post('alerts/:prediction_id/approve')
 * async approveAlert(
 *   @Param('prediction_id') prediction_id: string,
 *   @Body() body: { obra_id: string; actualDate?: string; actualImpact?: number }
 * ) {
 *   return this.brainService.submitApprovalFeedback(
 *     body.obra_id,
 *     prediction_id,
 *     'occurred',
 *     body.actualDate,
 *     body.actualImpact,
 *   );
 * }
 */
