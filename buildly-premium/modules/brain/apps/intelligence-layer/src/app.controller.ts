/**
 * AppController
 * Endpoints gerais da Intelligence Layer
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar status da aplicação' })
  @ApiResponse({ status: 200, description: 'Aplicação está funcionando' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiOperation({ summary: 'Status detalhado da aplicação' })
  @ApiResponse({
    status: 200,
    description: 'Status da aplicação',
    schema: {
      properties: {
        status: { type: 'string' },
        version: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  getStatus() {
    return this.appService.getStatus();
  }
}
