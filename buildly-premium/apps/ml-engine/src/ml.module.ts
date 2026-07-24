import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MLController } from './ml.controller';
import { MLService } from './ml.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      isGlobal: false,
    }),
  ],
  controllers: [MLController],
  providers: [MLService],
  exports: [MLService],
})
export class MLModule {}
