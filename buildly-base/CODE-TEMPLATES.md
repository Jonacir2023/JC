# 📝 Buildly Premium — Code Templates & Scaffolding

**Purpose:** Quick-start templates for common patterns and structures.

---

## TypeScript Interfaces & Types

### Domain Interface
```typescript
export interface IMaterial {
  id: string;
  name: string;
  categoria: 'vidro' | 'aco' | 'concreto' | 'outros';
  confiabilidade_media: number; // 0-1
  tempo_entrega_dias_medio: number;
  taxa_atraso_historica: number; // 0-1
  created_at: Date;
  updated_at: Date;
}
```

### DTO (Data Transfer Object)
```typescript
import { IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateMaterialDTO {
  @IsString()
  name: string;

  @IsString()
  categoria: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confiabilidade_media: number;
}
```

---

## Event Sourcing Pattern

### Event Definition
```typescript
export enum EventType {
  MATERIAL_DELAY_DETECTED = 'MATERIAL_DELAY_DETECTED',
  PREDICTION_GENERATED = 'PREDICTION_GENERATED',
  DECISION_RECORDED = 'DECISION_RECORDED',
}

export interface IEvent {
  id: string;
  aggregateId: string;
  aggregateType: 'Material' | 'Site' | 'Prediction';
  eventType: EventType;
  eventData: Record<string, any>;
  metadata: {
    timestamp: Date;
    version: number;
    userId: string;
  };
}
```

### Event Builder
```typescript
export class EventBuilder {
  private event: IEvent;

  constructor(aggregateId: string, aggregateType: string, eventType: EventType) {
    this.event = {
      id: uuid(),
      aggregateId,
      aggregateType,
      eventType,
      eventData: {},
      metadata: {
        timestamp: new Date(),
        version: 1,
        userId: '',
      },
    };
  }

  withData(data: Record<string, any>): EventBuilder {
    this.event.eventData = data;
    return this;
  }

  withUserId(userId: string): EventBuilder {
    this.event.metadata.userId = userId;
    return this;
  }

  build(): IEvent {
    if (!this.event.eventData) throw new Error('Event data required');
    if (!this.event.metadata.userId) throw new Error('User ID required');
    return this.event;
  }
}

// Usage:
const event = new EventBuilder('material-123', 'Material', EventType.MATERIAL_DELAY_DETECTED)
  .withData({ atraso_dias: 5, confianca: 0.87 })
  .withUserId('user-456')
  .build();
```

---

## Service Classes

### Domain Service
```typescript
import { Injectable } from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { IMaterialDelay } from '@buildly/common-types';

@Injectable()
export class MaterialDelayService {
  constructor(private eventRepository: EventRepository) {}

  async detectDelay(
    materialId: string,
    expectedDeliveryDate: Date,
    lastSupplierUpdate: Date,
  ): Promise<IMaterialDelay | null> {
    const events = await this.eventRepository.getByAggregateId(materialId);
    const delayProbability = this.calculateDelayProbability(events);
    const daysUntilDue = this.daysUntil(expectedDeliveryDate);

    if (delayProbability > 0.7 && daysUntilDue < 14) {
      return {
        material_id: materialId,
        atraso_dias_previstos: this.estimateDelayDays(events),
        confianca_score: delayProbability,
        impacto_custo_brl: this.estimateCostImpact(materialId, delayProbability),
        motivo_provavel: this.determineReason(events),
        recomendacoes: this.generateRecommendations(materialId),
      };
    }

    return null;
  }

  private calculateDelayProbability(events: IEvent[]): number {
    // Logic to calculate from historical events
    return 0.87;
  }

  private estimateDelayDays(events: IEvent[]): number {
    return 7;
  }

  private estimateCostImpact(materialId: string, probability: number): number {
    return probability * 15000;
  }

  private determineReason(events: IEvent[]): string {
    return 'Supplier reliability issues';
  }

  private generateRecommendations(materialId: string): string[] {
    return [
      'Contact supplier for expedite',
      'Identify alternative supplier',
      'Adjust project schedule',
    ];
  }

  private daysUntil(date: Date): number {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
```

---

## NestJS Controllers

### Alert Controller
```typescript
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AlertService } from '../services/alert.service';

@Controller('/api/v1/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alertService: AlertService) {}

  @Get('/obras/:obraId')
  async listAlerts(
    @Param('obraId') obraId: string,
    @Query('status') status: 'open' | 'closed' | 'all' = 'open',
    @Query('limit') limit: number = 20,
  ) {
    return this.alertService.findByObra(obraId, {
      status,
      limit: Math.min(limit, 100),
    });
  }

  @Get('/:alertId')
  async getAlert(@Param('alertId') alertId: string) {
    return this.alertService.findById(alertId);
  }

  @Post('/:alertId/approve')
  async approveAlert(
    @Param('alertId') alertId: string,
    @Body() body: { notes: string; approved_by: string },
  ) {
    return this.alertService.approveAlert(alertId, body);
  }
}
```

---

## Unit Tests

### Service Test
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AlertService } from '../../src/services/alert.service';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertService],
    }).compile();

    service = module.get<AlertService>(AlertService);
  });

  it('should calculate precision correctly', () => {
    const precision = service.calculatePrecision(10, 2);
    expect(precision).toBeCloseTo(0.833, 2);
  });

  it('should throw on invalid material', () => {
    expect(() => service.validateMaterial(null)).toThrow('Material required');
  });
});
```

---

## Neo4j Cypher Patterns

### Find Supplier Correlations
```cypher
MATCH (m:Material {nome: 'Vidro temperado'})-[:SUPPLIED_BY]->(s:Supplier)
       -[:HAS_RELIABILITY]->(r:ReliabilityMetric)
WHERE m.delay_probability > 0.75 AND s.ontime_rate < 0.80
RETURN s.nome, s.ontime_rate, r.recent_delays, m.nome
ORDER BY s.ontime_rate ASC
LIMIT 10;
```

### Track Decision Patterns
```cypher
MATCH (d:Decision)-[:DECIDED_BY]->(g:Gestor),
      (d:Decision)-[:FOR_MATERIAL]->(m:Material)
WHERE d.created_at > datetime.now() - duration({days: 30})
RETURN g.nome, m.nome, 
       COUNT(d) as decisions_made,
       AVG(d.correctness_score) as avg_correctness
GROUP BY g.nome, m.nome
ORDER BY avg_correctness DESC;
```

---

## PostgreSQL Query Service

### Queries
```typescript
async findMaterialMetrics(materialId: string): Promise<any> {
  const query = `
    SELECT
      m.id,
      m.nome,
      COUNT(p.id) as total_predictions,
      AVG(p.confianca)::NUMERIC(3,2) as avg_confidence,
      ROUND(
        100.0 * SUM(CASE WHEN p.atraso_ocorreu THEN 1 ELSE 0 END) / 
        NULLIF(COUNT(p.id), 0)
      )::INTEGER as delay_rate_percent
    FROM materials m
    LEFT JOIN pilot_baseline_metrics p ON m.id = p.material_id
    WHERE m.id = $1
    GROUP BY m.id, m.nome
  `;

  const result = await this.pool.query(query, [materialId]);
  return result.rows[0] || null;
}
```

---

**Buildly Premium Code Templates — Build with Confidence 🚀**
