import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Core API',
      version: '1.0.0',
    };
  }
}
