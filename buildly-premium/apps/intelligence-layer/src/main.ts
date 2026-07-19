/**
 * Intelligence Layer Bootstrap
 *
 * Phase 3: IA & Automation
 * Starts NestJS server for Recommendation API
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Port
  const port = parseInt(process.env.API_PORT || '3001');
  await app.listen(port);

  console.log(`🚀 Intelligence Layer API listening on port ${port}`);
  console.log(`📊 Swagger: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health: http://localhost:${port}/recommendations/health`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
