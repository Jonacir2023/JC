# 🔌 Buildly Brain — Integration Guide

**Integração entre Buildly Core e Buildly Brain Module**

---

## 📍 Overview

O **Buildly Core** orquestra processos operacionais, enquanto o **Buildly Brain** oferece recomendações de IA/ML através de REST APIs.

```
┌─────────────────────────────────────────┐
│      BUILDLY CORE (apps/core-api)       │
│  - Orquestra eventos e fluxos           │
│  - Gerencia operações                   │
│  - Toma decisões                        │
└─────────────────────────────────────────┘
              ↓        ↑
         (REST APIs)
              │        │
┌─────────────────────────────────────────┐
│     BUILDLY BRAIN (modules/brain)       │
│  - Analytics Layer (observa, agrega)    │
│  - ML Engine (prevê, otimiza, aprende)  │
└─────────────────────────────────────────┘
```

---

## 🚀 Setup

### 1. Adicionar Brain como Dependency

**buildly-premium/package.json:**

```json
{
  "workspaces": [
    "apps/*",
    "libs/*",
    "modules/brain/apps/*"
  ],
  "dependencies": {
    "@buildly/brain-api": "workspace:*"
  }
}
```

### 2. Configurar Docker Compose

**docker-compose.yml:**

```yaml
version: '3.8'
services:
  # Buildly Core
  core-api:
    build: ./apps/core-api
    ports:
      - "3000:3000"
    environment:
      BRAIN_ANALYTICS_URL: http://brain-analytics:3001
      BRAIN_ML_URL: http://brain-ml:3002

  # Buildly Brain
  brain-analytics:
    build: ./modules/brain/apps/intelligence-layer
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  brain-ml:
    build: ./modules/brain/apps/ml-engine
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: buildly

  redis:
    image: redis:7
```

### 3. Executar Localmente

```bash
# Terminal 1: Buildly Core
cd apps/core-api
npm install
npm run dev  # Listens on :3000

# Terminal 2: Brain Analytics
cd modules/brain/apps/intelligence-layer
npm install
npm run dev  # Listens on :3001

# Terminal 3: Brain ML
cd modules/brain/apps/ml-engine
npm install
npm run dev  # Listens on :3002
```

---

## 📡 API Integration

### Criar BrainService no Core

**apps/core-api/src/services/brain.service.ts:**

```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

interface AlertPrediction {
  pattern_type: string;
  predicted_date: string;
  probability: number;
  severity: string;
  recommended_action: string;
}

interface CostAttribution {
  category: string;
  cost_savings: number;
  cost_prevention: number;
  cost_optimization: number;
  total_impact: number;
  roi_multiplier: number;
}

@Injectable()
export class BrainService {
  private analyticsClient: AxiosInstance;
  private mlClient: AxiosInstance;

  constructor() {
    this.analyticsClient = axios.create({
      baseURL: process.env.BRAIN_ANALYTICS_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.mlClient = axios.create({
      baseURL: process.env.BRAIN_ML_URL || 'http://localhost:3002',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Analytics Endpoints
  async getEventsAggregated(
    obra_id: string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'
  ) {
    try {
      const response = await this.analyticsClient.get(
        '/analytics/events/aggregated',
        {
          params: { period },
          headers: { 'X-Tenant-ID': obra_id }
        }
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch analytics',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getPatternsEffectiveness(obra_id: string) {
    try {
      const response = await this.analyticsClient.get(
        '/analytics/patterns/effectiveness',
        {
          headers: { 'X-Tenant-ID': obra_id }
        }
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch pattern effectiveness',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getAlertsTimeline(obra_id: string, severity?: string) {
    try {
      const response = await this.analyticsClient.get(
        '/analytics/alerts/timeline',
        {
          params: severity ? { severity } : {},
          headers: { 'X-Tenant-ID': obra_id }
        }
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch alerts timeline',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getObrasSummary() {
    try {
      const response = await this.analyticsClient.get(
        '/analytics/obras/summary'
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch obras summary',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  // ML Endpoints
  async predictAlerts(
    obra_id: string,
    forecastDays: number = 7
  ): Promise<AlertPrediction[]> {
    try {
      const response = await this.mlClient.get('/ml/predict/alerts', {
        params: { forecast_days: forecastDays },
        headers: { 'X-Tenant-ID': obra_id }
      });
      return response.data.data.predictions || [];
    } catch (error) {
      console.error('Error predicting alerts:', error);
      return [];
    }
  }

  async getCostAttribution(
    obra_id: string,
    attributionBy: 'pattern' | 'team' | 'activity' = 'pattern'
  ): Promise<CostAttribution[]> {
    try {
      const response = await this.mlClient.get('/ml/cost/attribution', {
        params: { attribution_by: attributionBy },
        headers: { 'X-Tenant-ID': obra_id }
      });
      return response.data.data.attributions || [];
    } catch (error) {
      console.error('Error fetching cost attribution:', error);
      return [];
    }
  }

  async getModelPerformance(patternType?: string) {
    try {
      const response = await this.mlClient.get('/ml/models/performance', {
        params: patternType ? { pattern_type: patternType } : {}
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch model performance',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async trainPatterns(feedback: any[]) {
    try {
      const response = await this.mlClient.post('/ml/train/patterns', {
        feedback
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to train patterns',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkHealth() {
    try {
      const [analyticsHealth, mlHealth] = await Promise.all([
        this.analyticsClient.get('/analytics/health'),
        this.mlClient.get('/ml/health')
      ]);
      return {
        analytics: analyticsHealth.data,
        ml: mlHealth.data
      };
    } catch (error) {
      throw new HttpException(
        'Brain module health check failed',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
```

### Usar BrainService em Controllers

**apps/core-api/src/controllers/obras.controller.ts:**

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { BrainService } from '../services/brain.service';

@Controller('obras')
export class ObraController {
  constructor(private readonly brainService: BrainService) {}

  @Get(':id/insights')
  async getObraInsights(@Param('id') obraId: string) {
    // Fetch real-time insights from Brain
    const [
      alerts,
      costs,
      analytics,
      effectiveness
    ] = await Promise.all([
      this.brainService.predictAlerts(obraId),
      this.brainService.getCostAttribution(obraId),
      this.brainService.getEventsAggregated(obraId),
      this.brainService.getPatternsEffectiveness(obraId)
    ]);

    return {
      obra_id: obraId,
      predictedAlerts: alerts,
      costOptimization: costs,
      eventAnalytics: analytics,
      patternEffectiveness: effectiveness,
      timestamp: new Date().toISOString()
    };
  }

  @Get('summary')
  async getAllObrasSummary() {
    // Consolidated view of all obras
    return this.brainService.getObrasSummary();
  }
}
```

---

## 🔄 Common Integration Patterns

### Pattern 1: Real-Time Recommendations

```typescript
// Show alerts predicted by Brain in Obra Dashboard
async showObraAlerts(obraId: string) {
  const predictions = await brainService.predictAlerts(obraId);
  
  // Display top 3 alerts
  return predictions.slice(0, 3).map(alert => ({
    type: alert.pattern_type,
    date: alert.predicted_date,
    confidence: `${Math.round(alert.probability * 100)}%`,
    action: alert.recommended_action,
    severity: alert.severity
  }));
}
```

### Pattern 2: Cost Optimization Widget

```typescript
// Show cost savings breakdown on obra page
async showCostOptimization(obraId: string) {
  const costs = await brainService.getCostAttribution(obraId);
  
  const totalSavings = costs.reduce((sum, c) => sum + c.total_impact, 0);
  const roiMultiplier = costs[0]?.roi_multiplier || 0;

  return {
    totalImpact: `R$ ${totalSavings.toLocaleString('pt-BR')}`,
    roiMultiplier: `${roiMultiplier.toFixed(1)}x`,
    breakdown: costs.map(c => ({
      category: c.category,
      impact: c.total_impact,
      components: {
        savings: c.cost_savings,
        prevention: c.cost_prevention,
        optimization: c.cost_optimization
      }
    }))
  };
}
```

### Pattern 3: Feedback Loop

```typescript
// When user confirms/denies a Brain prediction
async recordPredictionFeedback(
  predictionId: string,
  occurred: boolean,
  actualDate?: Date,
  actualImpact?: number
) {
  // Send feedback back to Brain for retraining
  await brainService.trainPatterns([
    {
      prediction_id: predictionId,
      actual_outcome: occurred ? 'occurred' : 'false_positive',
      actual_date: actualDate,
      actual_impact: actualImpact,
      feedback_quality: 0.9
    }
  ]);
}
```

---

## 🐛 Error Handling

### Graceful Degradation

Se Brain falhar, Buildly Core continua funcionando:

```typescript
async getObraData(obraId: string) {
  const obra = await this.obras.findById(obraId);

  // Brain is optional—if it fails, continue without it
  try {
    obra.brainInsights = await this.brainService.predictAlerts(obraId);
  } catch (error) {
    console.warn('Brain unavailable, returning obra without AI insights');
    obra.brainInsights = [];
  }

  return obra;
}
```

### Retry Logic

```typescript
async getAlertsWithRetry(
  obraId: string,
  maxRetries: number = 3
): Promise<AlertPrediction[]> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.brainService.predictAlerts(obraId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 🧪 Testing Integration

### Unit Test

```typescript
import { Test } from '@nestjs/testing';
import { BrainService } from './brain.service';

describe('BrainService', () => {
  let service: BrainService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BrainService]
    }).compile();

    service = module.get<BrainService>(BrainService);
  });

  it('should predict alerts for obra', async () => {
    const alerts = await service.predictAlerts('obra-123');
    expect(alerts).toBeInstanceOf(Array);
    expect(alerts[0]).toHaveProperty('pattern_type');
    expect(alerts[0]).toHaveProperty('probability');
  });

  it('should calculate cost attribution', async () => {
    const costs = await service.getCostAttribution('obra-123');
    expect(costs).toBeInstanceOf(Array);
    expect(costs[0]).toHaveProperty('total_impact');
    expect(costs[0]).toHaveProperty('roi_multiplier');
  });
});
```

### E2E Test

```bash
# Test full integration flow
curl -X GET http://localhost:3000/obras/123/insights \
  -H "Authorization: Bearer $TOKEN"

# Should return:
# {
#   "obra_id": "123",
#   "predictedAlerts": [...],
#   "costOptimization": [...],
#   "eventAnalytics": {...},
#   "timestamp": "2026-07-24T13:00:00Z"
# }
```

---

## 📊 Monitoring

### Health Check Endpoint

```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly brainService: BrainService) {}

  @Get('brain')
  async checkBrainHealth() {
    return this.brainService.checkHealth();
  }
}
```

### Metrics

Brain exposes Prometheus metrics on `:9090/metrics`:

```
# Analytics Layer
analytics_query_duration_ms
analytics_cache_hit_rate
analytics_materialized_view_age_seconds

# ML Engine
ml_prediction_latency_ms
ml_model_accuracy
ml_cost_attribution_total_impact
ml_pattern_weight_updates_total
```

---

## 🚀 Deployment

### Docker

```yaml
# docker-compose.prod.yml
services:
  core-api:
    image: buildly/core-api:1.0.0
    environment:
      BRAIN_ANALYTICS_URL: http://brain-analytics:3001
      BRAIN_ML_URL: http://brain-ml:3002

  brain-analytics:
    image: buildly/brain-analytics:1.0.0

  brain-ml:
    image: buildly/brain-ml:1.0.0
```

### Kubernetes

```yaml
# k8s/core-api-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: brain-analytics
spec:
  selector:
    app: brain-analytics
  ports:
    - port: 3001

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brain-analytics
spec:
  template:
    spec:
      containers:
        - name: brain-analytics
          image: buildly/brain-analytics:1.0.0
          ports:
            - containerPort: 3001
```

---

## 🔗 Next Steps

1. **Implement BrainService** in Core API
2. **Create dashboard** showing Brain insights
3. **Setup feedback loop** for continuous learning
4. **Monitor performance** with Prometheus
5. **Document API contracts** for team alignment

---

**Buildly Integration Complete! 🚀**
