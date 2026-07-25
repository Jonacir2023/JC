import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MLController } from './ml.controller';
import { MLService } from './ml.service';
import { MLDelayController } from './ml-delay.controller';
import { MLDelayService } from './ml-delay.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      isGlobal: false,
    }),
  ],
  controllers: [MLController, MLDelayController],
  providers: [MLService, MLDelayService],
  exports: [MLService, MLDelayService],
})
export class MLModule {}
