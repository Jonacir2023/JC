import { Module } from '@nestjs/common';
import { BrainDelayService } from '../services/brain-delay.service';
import { DelayAlertsController } from '../controllers/delay-alerts.controller';

/**
 * Delay Alerts Module
 * Provides integration between Buildly Core and Buildly Brain
 *
 * Services:
 *  - BrainDelayService: Orchestrates calls to Brain ML Engine
 *
 * Controllers:
 *  - DelayAlertsController: REST endpoints for alerts
 */

@Module({
  providers: [BrainDelayService],
  controllers: [DelayAlertsController],
  exports: [BrainDelayService],
})
export class DelayAlertsModule {}
