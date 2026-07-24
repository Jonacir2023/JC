/**
 * Intelligence Layer App Module
 *
 * Phase 3: IA & Automation
 * Main NestJS application module integrating all services
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Pool } from 'pg';
import { RecommendationModule } from './recommendation/recommendation.module';
import { BrainModule } from './brain/brain.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    RecommendationModule,
    BrainModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'DATABASE_POOL',
      useFactory: async () => {
        const pool = new Pool({
          host: process.env.PG_HOST || 'localhost',
          port: parseInt(process.env.PG_PORT || '5432'),
          database: process.env.PG_DATABASE || 'buildly',
          user: process.env.PG_USER || 'postgres',
          password: process.env.PG_PASSWORD || '',
          max: parseInt(process.env.PG_POOL_MAX || '20'),
          min: parseInt(process.env.PG_POOL_MIN || '5'),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        // Test connection
        try {
          const client = await pool.connect();
          console.log('✅ Connected to PostgreSQL');
          client.release();
        } catch (error) {
          console.error('❌ PostgreSQL connection failed:', error);
          throw error;
        }

        return pool;
      },
    },
  ],
  exports: ['DATABASE_POOL'],
})
export class AppModule {}
