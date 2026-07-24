/**
 * AppService
 * Serviços gerais da Intelligence Layer
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Intelligence Layer - Buildly Premium v0.1.0';
  }

  getStatus() {
    return {
      status: 'operational',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      components: {
        brain: 'available',
        cache: 'available',
        database: 'available',
      },
    };
  }
}
