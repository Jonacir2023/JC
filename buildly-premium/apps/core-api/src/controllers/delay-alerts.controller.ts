import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BrainDelayService } from '../services/brain-delay.service';
import { GetDelayAlertsDto, SubmitFeedbackDto, DelayAlertResponse } from '../dtos/delay-alerts.dto';

/**
 * Material Delay Alerts Controller
 * Exposes Brain predictions to Core API clients
 *
 * Endpoints:
 *   GET  /obras/:obra_id/delay-alerts?forecast_days=7
 *   POST /alerts/:prediction_id/approve
 *   POST /alerts/:prediction_id/reject
 *   GET  /alerts/health
 */

@Controller('alerts')
export class DelayAlertsController {
  private readonly logger = new Logger(DelayAlertsController.name);

  constructor(private readonly brainDelayService: BrainDelayService) {}

  /**
   * GET /obras/:obra_id/delay-alerts
   * Fetch material delay predictions for a construction site
   */
  @Get('/obras/:obra_id/delay-alerts')
  async getDelayAlerts(
    @Param('obra_id') obra_id: string,
    @Query('forecast_days') forecast_days?: number,
  ): Promise<DelayAlertResponse> {
    try {
      if (!obra_id || obra_id.trim() === '') {
        throw new BadRequestException('obra_id is required');
      }

      const forecastDays = forecast_days || 7;
      if (forecastDays < 1 || forecastDays > 30) {
        throw new BadRequestException('forecast_days must be between 1 and 30');
      }

      this.logger.log(`Fetching alerts for obra ${obra_id}, forecast_days=${forecastDays}`);

      const brainHealthy = await this.brainDelayService.checkHealth();
      const { predictions, summary, errors } = await this.brainDelayService.getPredictions(
        obra_id,
        forecastDays,
      );

      const formattedAlerts = this.brainDelayService.formatAlertsForList(predictions);

      const response: DelayAlertResponse = {
        status: errors && errors.length > 0 ? 'partial' : 'success',
        alerts: formattedAlerts,
        summary: {
          total: summary.total_alerts,
          critical: summary.critical_alerts,
          high: summary.high_alerts,
          totalImpact: this.brainDelayService.calculateTotalImpact(summary),
        },
        metadata: {
          obraId: obra_id,
          forecastDays: forecastDays,
          retrievedAt: new Date().toISOString(),
          brainHealthy,
        },
      };

      if (errors && errors.length > 0) {
        response.errors = errors;
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error fetching alerts: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch delay alerts');
    }
  }

  /**
   * POST /alerts/:prediction_id/approve
   * Approve an alert and record feedback (occurred)
   */
  @Post('/alerts/:prediction_id/approve')
  async approveAlert(
    @Param('prediction_id') prediction_id: string,
    @Body() body: { obra_id: string; actual_date?: string; actual_impact_brl?: number; notes?: string },
  ): Promise<{
    status: 'success' | 'error';
    message: string;
    prediction_id: string;
  }> {
    try {
      if (!body.obra_id) {
        throw new BadRequestException('obra_id is required in request body');
      }

      this.logger.log(`Approving alert ${prediction_id} for obra ${body.obra_id}`);

      const result = await this.brainDelayService.submitFeedback(
        body.obra_id,
        prediction_id,
        'occurred',
        body.actual_date,
        body.actual_impact_brl,
        body.notes || 'Approved by gestor',
      );

      return {
        status: result.success ? 'success' : 'error',
        message: result.message,
        prediction_id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error approving alert: ${error.message}`);
      throw new InternalServerErrorException('Failed to approve alert');
    }
  }

  /**
   * POST /alerts/:prediction_id/reject
   * Reject an alert and record feedback (false_positive)
   */
  @Post('/alerts/:prediction_id/reject')
  async rejectAlert(
    @Param('prediction_id') prediction_id: string,
    @Body() body: { obra_id: string; notes?: string },
  ): Promise<{
    status: 'success' | 'error';
    message: string;
    prediction_id: string;
  }> {
    try {
      if (!body.obra_id) {
        throw new BadRequestException('obra_id is required in request body');
      }

      this.logger.log(`Rejecting alert ${prediction_id} for obra ${body.obra_id}`);

      const result = await this.brainDelayService.submitFeedback(
        body.obra_id,
        prediction_id,
        'false_positive',
        undefined,
        undefined,
        body.notes || 'Rejected by gestor (false positive)',
      );

      return {
        status: result.success ? 'success' : 'error',
        message: result.message,
        prediction_id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error rejecting alert: ${error.message}`);
      throw new InternalServerErrorException('Failed to reject alert');
    }
  }

  /**
   * GET /alerts/health
   * Check if Brain service is available
   */
  @Get('/alerts/health')
  async checkBrainHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    brain_available: boolean;
  }> {
    const healthy = await this.brainDelayService.checkHealth();
    return {
      status: healthy ? 'healthy' : 'unhealthy',
      brain_available: healthy,
    };
  }
}
