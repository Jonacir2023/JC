import { Controller, Get, Query, Header, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MLDelayService, MaterialDelayAlertResponse } from './ml-delay.service';

@ApiTags('ml-delays')
@ApiBearerAuth()
@Controller('ml/predict/delays')
export class MLDelayController {
  constructor(private readonly delayService: MLDelayService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Predict material delay alerts',
    description:
      'Returns predictive alerts for material delays 3+ days in advance using historical data and seasonal patterns',
  })
  @ApiResponse({
    status: 200,
    description: 'Material delay predictions',
    type: MaterialDelayAlertResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid obra_id or forecast_days',
  })
  @ApiResponse({
    status: 404,
    description: 'Obra not found or insufficient historical data',
  })
  async predictDelays(
    @Header('X-Tenant-ID') tenantId: string,
    @Query('obra_id') obraId: string,
    @Query('forecast_days') forecastDaysParam?: string,
  ): Promise<MaterialDelayAlertResponse> {
    const obra_id = obraId || tenantId;
    const forecast_days = forecastDaysParam ? parseInt(forecastDaysParam, 10) : 7;

    if (!obra_id) {
      throw new Error('X-Tenant-ID or obra_id query parameter required');
    }

    if (forecast_days < 1 || forecast_days > 30) {
      throw new Error('forecast_days must be between 1 and 30');
    }

    return this.delayService.predictMaterialDelays(obra_id, forecast_days);
  }
}
