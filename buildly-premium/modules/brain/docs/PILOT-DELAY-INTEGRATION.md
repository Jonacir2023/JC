# 🔗 Material Delay Prediction — Integration Guide

**Status:** PR #5 (Integration)  
**Date:** 2026-07-25  
**Scope:** Buildly Core ↔ Buildly Brain communication

---

## 📍 Overview

This guide explains how **Buildly Core** calls **Buildly Brain's** material delay prediction API and processes the results.

### Architecture

```
┌─────────────────────────────────────────┐
│      BUILDLY CORE (apps/core-api)       │
│  - Orquestra operações                  │
│  - Aprova alertas                       │
│  - Executa ações                        │
└────────────────────┬────────────────────┘
                     │
                 [HTTP REST]
                 X-Tenant-ID
                     │
                     ↓
┌─────────────────────────────────────────┐
│    BUILDLY BRAIN (modules/brain)        │
│    GET /ml/predict/delays               │
│    - Analisa histórico                  │
│    - Calcula confiança                  │
│    - Retorna alertas                    │
└─────────────────────────────────────────┘
```

---

## 🚀 Integration Steps

### Step 1: Call Brain Prediction API

**Endpoint:** `GET /ml/predict/delays`

**Request:**
```bash
curl -H "X-Tenant-ID: obra-123" \
  -H "Authorization: Bearer <token>" \
  "http://brain-ml:3002/ml/predict/delays?forecast_days=7"
```

**Response (Success):**
```json
{
  "status": "success",
  "data": {
    "obra_id": "obra-123",
    "predictions": [
      {
        "id": "pred-1",
        "material_id": "mat-cimento",
        "material_name": "Cimento CP II",
        "predicted_delay_days": 8,
        "confidence": 0.78,
        "severity": "CRITICAL",
        "predicted_date": "2026-08-02",
        "recommended_action": "Reordenar cronograma (risco crítico)",
        "requires_approval": true
      }
    ],
    "summary": {
      "total_alerts": 3,
      "critical_alerts": 1,
      "high_alerts": 1,
      "estimated_impact_brl": 85000
    }
  },
  "metadata": {
    "query_time_ms": 340,
    "cache_hit": false,
    "forecast_days": 7
  }
}
```

---

### Step 2: Display Alerts to Gestor (Human Approval)

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ ⚠️  ALERTA: Risco de Atraso de Material    │
├─────────────────────────────────────────────┤
│ Material: Cimento CP II                     │
│ Confiança: 78%                              │
│ Atraso Esperado: 8 dias                     │
│ Data Prevista: 02/ago/2026                  │
│ Impacto Estimado: R$ 50.000                 │
│                                              │
│ Ação Recomendada:                           │
│ "Reordenar cronograma para atividades 5,6,7"│
│                                              │
│ ┌──────────────┐  ┌──────────────────┐    │
│ │  ✅ Aprovar  │  │  ❌ Rejeitar      │    │
│ └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────┘
```

---

### Step 3: Record Approval Decision

**When gestor clicks ✅ Approve:**

```bash
curl -X POST http://brain-ml:3002/ml/predict/delays/feedback \
  -H "X-Tenant-ID: obra-123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prediction_id": "pred-1",
    "actual_outcome": "occurred",
    "actual_date": "2026-08-01",
    "actual_impact_brl": 50000,
    "notes": "Cimento atrasou, reordenamos cronograma"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Feedback recorded. Model weights will update on next training cycle.",
  "prediction_id": "pred-1"
}
```

---

### Step 4: Execute Action (Optional)

If `requires_approval: true`, **Core should NOT execute action automatically**.

Instead:
1. **Display alert to gestor** with recommended action
2. **Wait for approval** (✅ or ❌ buttons)
3. **Execute only after approval** (not implemented in MVP)

**Future (Phase 4.0):**
```typescript
// Example: Auto-execute low-risk actions
if (prediction.confidence < 0.5 && prediction.severity === 'LOW') {
  coreService.executeAction(prediction.recommended_action);
}
```

---

## 🔄 Feedback Loop (Learning)

### What Happens After Feedback?

1. **Brain records:** `actual_outcome` in `brain_alert_feedback` table
2. **Cache invalidates:** All delay predictions cleared
3. **Next training run:** Adaptive EMA updates pattern weights
   - If `occurred`: confidence increases for this pattern
   - If `false_positive`: confidence decreases
   - If `prevented`: gains recorded as "cost_prevention"

### Example: Pattern Weight Update

**Before feedback:**
```
Pattern: "delay_cimento_fornecedor_CIMESA"
Weight: 0.65
Confidence: 0.78
```

**After feedback (occurred):**
```
Alpha = 0.4 (recent data)
New Weight = 0.4 * 1.0 + 0.6 * 0.65 = 0.79
New Confidence = MIN(1.0, 0.78 + 0.01) = 0.79
```

---

## 📊 Error Handling

### Scenario 1: Brain is Down

**Response:** 504 Service Unavailable

**Core should:**
```typescript
try {
  const predictions = await brainService.predictDelays(obra_id);
  displayAlerts(predictions);
} catch (error) {
  if (error.status === 504) {
    logger.warn(`Brain unavailable, skipping predictions for ${obra_id}`);
    // Continue without recommendations
  }
}
```

### Scenario 2: Insufficient Historical Data

**Response:** 404 Not Found

**Brain should return:**
```json
{
  "status": "error",
  "data": {
    "obra_id": "obra-123",
    "predictions": [],
    "summary": {
      "total_alerts": 0,
      "critical_alerts": 0,
      "high_alerts": 0,
      "estimated_impact_brl": 0
    }
  },
  "metadata": {
    "query_time_ms": 50,
    "cache_hit": false,
    "forecast_days": 7
  }
}
```

**Core should:**
```typescript
if (response.data.predictions.length === 0) {
  logger.info(`No delay predictions for ${obra_id} (insufficient history)`);
}
```

---

## 🧪 Test Cases (Core Integration)

### Test 1: Happy Path (Approval → Recorded)

```typescript
describe('Material Delay Integration', () => {
  it('should call Brain, display alert, record feedback', async () => {
    // 1. Call Brain
    const predictions = await brain.predictDelays('obra-123', 7);
    expect(predictions.data.predictions).toHaveLength(1);
    expect(predictions.data.predictions[0].severity).toBe('CRITICAL');

    // 2. Display to UI (mock)
    const alert = predictions.data.predictions[0];
    expect(alert.requires_approval).toBe(true);

    // 3. Record approval
    const feedback = await brain.recordFeedback({
      prediction_id: alert.id,
      actual_outcome: 'occurred',
      actual_impact_brl: 50000,
    });
    expect(feedback.status).toBe('success');
  });
});
```

### Test 2: Graceful Degradation (Brain Down)

```typescript
it('should continue if Brain is unavailable', async () => {
  // Mock Brain returning 504
  mockBrain.predictDelays.mockRejectedValue(new Error('503 Service Unavailable'));

  // Core should not crash
  const result = await core.checkObraAlerts('obra-123');
  expect(result.status).toBe('partial'); // Alerts unavailable but Core works
});
```

---

## 📋 Deployment Checklist

- [ ] Brain ML Engine deployed to `brain-ml:3002`
- [ ] Database tables created (`brain_patterns`, `brain_alerts`, `brain_alert_feedback`)
- [ ] Redis cache configured (24h TTL)
- [ ] Core API has `BrainService` injected
- [ ] X-Tenant-ID header is validated
- [ ] Authorization token is validated
- [ ] Error logging configured (Brain failures → logs, not crashes)
- [ ] UI shows alert approval buttons
- [ ] Feedback endpoint is callable from Core
- [ ] Test data loaded (12+ months historical data)

---

## 🔍 Monitoring

### Key Metrics

```
brain_prediction_latency_ms          (target: < 800ms)
brain_prediction_cache_hit_rate      (target: > 80%)
brain_prediction_total_alerts        (track trend)
brain_prediction_critical_severity   (track severity distribution)
brain_feedback_recorded              (track learning)
```

### Alerting Rules

```
IF brain_prediction_latency_ms > 1000 FOR 5min
  THEN alert "Brain predictions slow"

IF brain_prediction_cache_hit_rate < 50% FOR 1h
  THEN alert "Cache ineffective"

IF brain_feedback_recorded == 0 FOR 7 days
  THEN alert "Learning loop stalled"
```

---

## 🚀 Next Steps (Phase 4.0)

- [ ] Auto-execution of low-risk recommendations
- [ ] Multi-model predictions (ensemble)
- [ ] Causal analysis (Neo4j integration)
- [ ] Real-time streaming (Kafka)
- [ ] Explainability dashboard (SHAP values)

---

**Buildly Brain × Core = Proactive Infrastructure Management 🏗️🧠**
