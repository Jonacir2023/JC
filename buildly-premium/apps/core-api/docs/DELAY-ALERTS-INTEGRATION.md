# 🔗 Material Delay Alerts — Core Integration Guide

**Phase:** 4.1 (Core Integration)  
**Status:** ✅ Ready for Implementation  
**Date:** 2026-07-25

---

## 📍 Overview

This guide explains how to integrate **Buildly Brain's** material delay predictions into **Buildly Core**, enabling gestores to see alerts and provide feedback that improves the ML model.

### Architecture

```
Buildly Core (apps/core-api)
    ↓
DelayAlertsController (REST endpoints)
    ↓
BrainDelayService (Brain integration logic)
    ↓
Brain ML Engine (http://brain-ml:3002)
    ↓
PostgreSQL + Redis (persistence + cache)
```

---

## 🚀 Integration Steps

### Step 1: Import Module in Core

**File:** `apps/core-api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DelayAlertsModule } from './modules/delay-alerts.module';

@Module({
  imports: [
    // ... other modules
    DelayAlertsModule,
  ],
})
export class AppModule {}
```

### Step 2: Environment Configuration

**File:** `.env` (or `.env.local`)

```bash
# Brain ML Engine configuration
BRAIN_ML_URL=http://brain-ml:3002
BRAIN_API_TOKEN=your-token-here  # Optional if Brain is internal

# Core API
CORE_API_PORT=3001
NODE_ENV=development
```

### Step 3: Use DelayAlertsCard in Frontend

**File:** `apps/core-ui/src/pages/ObraDetail.tsx`

```typescript
import DelayAlertsCard from '../components/DelayAlertsCard';

export const ObraDetailPage = ({ obraId }: { obraId: string }) => {
  return (
    <div className="obra-detail">
      <h1>Obra Details</h1>

      {/* Material Delay Alerts Component */}
      <DelayAlertsCard
        obraId={obraId}
        forecastDays={7}
        onFeedbackSubmitted={(prediction_id, outcome) => {
          console.log(`Feedback: ${outcome} for ${prediction_id}`);
          // Optionally refresh other components
        }}
      />

      {/* Other obra components */}
    </div>
  );
};
```

---

## 📡 API Endpoints

### GET /obras/:obra_id/delay-alerts

Fetch material delay predictions for a construction site.

**Request:**
```bash
curl -X GET "http://localhost:3001/alerts/obras/obra-123/delay-alerts?forecast_days=7"
```

**Response (200 OK):**
```json
{
  "status": "success",
  "alerts": [
    {
      "id": "pred-uuid-1",
      "title": "🔴 Risco de Atraso: Cimento CP II",
      "severity": "CRITICAL",
      "confidence": 78,
      "material": "Cimento CP II",
      "predictedDate": "02/ago/2026",
      "estimatedDelay": 8,
      "estimatedImpact": "R$ 50.0k",
      "recommendation": "Reordenar cronograma (risco crítico)",
      "requiresApproval": true
    }
  ],
  "summary": {
    "total": 3,
    "critical": 1,
    "high": 1,
    "totalImpact": "R$ 85.0k"
  },
  "metadata": {
    "obraId": "obra-123",
    "forecastDays": 7,
    "retrievedAt": "2026-07-25T18:15:00Z",
    "brainHealthy": true
  }
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "forecast_days must be between 1 and 30",
  "error": "Bad Request"
}
```

---

### POST /alerts/:prediction_id/approve

Approve an alert and record feedback (actual outcome: occurred).

**Request:**
```bash
curl -X POST "http://localhost:3001/alerts/alerts/pred-uuid-1/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "obra_id": "obra-123",
    "actual_date": "2026-08-02",
    "actual_impact_brl": 50000,
    "notes": "Cimento atrasou, reordenamos cronograma"
  }'
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Feedback recorded. Model will improve on next training cycle.",
  "prediction_id": "pred-uuid-1"
}
```

---

### POST /alerts/:prediction_id/reject

Reject an alert as false positive.

**Request:**
```bash
curl -X POST "http://localhost:3001/alerts/alerts/pred-uuid-1/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "obra_id": "obra-123",
    "notes": "Cimento chegou no prazo, falso alerta"
  }'
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Feedback recorded. Model will improve on next training cycle.",
  "prediction_id": "pred-uuid-1"
}
```

---

### GET /alerts/health

Check if Brain service is healthy.

**Request:**
```bash
curl -X GET "http://localhost:3001/alerts/alerts/health"
```

**Response (200):**
```json
{
  "status": "healthy",
  "brain_available": true
}
```

---

## 🔄 Workflow: How It Works

### Step-by-Step Flow

1. **Gestor loads obra details** → Component calls `GET /obras/:obra_id/delay-alerts`
2. **Brain returns predictions** → Response includes 3 alerts with 78% avg confidence
3. **UI displays alerts to gestor** → Material, delay days, recommended action
4. **Gestor clicks Approve** → POST to `/alerts/:id/approve`
5. **Feedback recorded** → Brain updates pattern weights (EMA algorithm)
6. **Cache invalidated** → Next prediction will reflect feedback
7. **Model improves** → Over time, more accurate predictions

### Timeline Example

```
T+0:00  Obra loads → Fetch predictions (cache miss) → Display 3 alerts
T+0:05  Gestor approves first alert → Brain records "occurred"
T+0:06  Cache cleared → Next prediction will be fresher
T+1:00  (Next load) → 2 remaining alerts shown
T+7:00  Prediction proven correct → Model gains confidence
T+14:00 Similar material arrives on schedule → False positive recorded
T+21:00 Model learns → Reduced false positives
```

---

## 💾 Storage & Persistence

### What's Stored

After feedback is submitted, Brain records:

```sql
-- brain_alert_feedback table
INSERT INTO brain_alert_feedback (
  prediction_id,
  actual_outcome,    -- 'occurred' | 'false_positive' | 'prevented'
  actual_date,
  actual_impact_brl,
  recorded_at
) VALUES (...);
```

### Learning Impact

- **Occurred:** Pattern confidence +1% (up to 100%)
- **False Positive:** Pattern confidence -2% (down to 0%)
- **Prevented:** Recorded as cost_prevention (used in ROI calculations)

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Start services
docker-compose up brain-ml core-api

# 2. Test health
curl http://localhost:3001/alerts/alerts/health

# 3. Fetch alerts
curl http://localhost:3001/alerts/obras/obra-test-001/delay-alerts

# 4. Approve alert
curl -X POST http://localhost:3001/alerts/alerts/pred-id-1/approve \
  -H "Content-Type: application/json" \
  -d '{"obra_id": "obra-test-001"}'

# 5. Verify cache cleared
curl http://localhost:3001/alerts/obras/obra-test-001/delay-alerts
# Should show cache_hit: false (refresh)
```

### Unit Tests

**File:** `apps/core-api/src/services/brain-delay.service.spec.ts`

```typescript
describe('BrainDelayService', () => {
  let service: BrainDelayService;

  beforeEach(() => {
    service = new BrainDelayService();
  });

  it('should format alert for UI', () => {
    const prediction = {
      id: '1',
      material_id: 'mat-123',
      material_name: 'Cimento',
      predicted_delay_days: 8,
      confidence: 0.78,
      severity: 'CRITICAL',
      predicted_date: '2026-08-02',
      recommended_action: 'Reordenar',
      requires_approval: true,
    };

    const alert = service.formatAlertForUI(prediction);
    expect(alert.confidence).toBe(78);
    expect(alert.estimatedImpact).toContain('R$');
  });

  it('should calculate total impact', () => {
    const summary = {
      total_alerts: 3,
      critical_alerts: 1,
      high_alerts: 1,
      estimated_impact_brl: 85000,
    };

    const impact = service.calculateTotalImpact(summary);
    expect(impact).toBe('R$ 85.0k');
  });
});
```

---

## 📋 Files Changed/Created

### Backend (Core API)

```
✅ apps/core-api/src/services/brain-delay.service.ts       (260 lines)
   └─ BrainDelayService: Brain API client + formatting

✅ apps/core-api/src/controllers/delay-alerts.controller.ts (180 lines)
   └─ REST endpoints: GET alerts, POST approve/reject

✅ apps/core-api/src/dtos/delay-alerts.dto.ts              (50 lines)
   └─ TypeScript interfaces for validation

✅ apps/core-api/src/modules/delay-alerts.module.ts        (20 lines)
   └─ NestJS module registration

✅ apps/core-api/docs/DELAY-ALERTS-INTEGRATION.md           (This file)
```

### Frontend (Core UI)

```
✅ apps/core-ui/src/components/DelayAlertsCard.tsx         (280 lines)
   └─ React component: Fetch, display, approve/reject

✅ apps/core-ui/src/components/DelayAlertsCard.css         (380 lines)
   └─ Styling (light + dark mode, responsive)
```

---

## 🔐 Security Considerations

1. **Authentication:** Verify X-Tenant-ID header in Brain API calls
2. **Authorization:** Only gestores of obra can approve/reject alerts
3. **Rate Limiting:** Consider limiting predictions to 10/min per obra
4. **Input Validation:** DTOs validate forecast_days (1-30 range)
5. **Error Handling:** No sensitive data leaked in error responses

---

## 🚨 Troubleshooting

### "Brain unavailable" Error

**Symptom:** Alerts show error state
```json
{"status": "partial", "errors": ["Brain unavailable: connect ECONNREFUSED"]}
```

**Solution:**
1. Check if Brain service is running: `docker ps | grep brain-ml`
2. Check Brain logs: `docker logs buildly-brain-ml`
3. Verify `BRAIN_ML_URL` env var: `echo $BRAIN_ML_URL`
4. Test connectivity: `curl http://brain-ml:3002/ml/health`

### "Cache not invalidating"

**Symptom:** Same alerts show after approval
```json
{"metadata": {"cache_hit": true}}
```

**Solution:**
1. Brain should auto-invalidate cache on feedback
2. Manual clear: `redis-cli DEL delays:obra-123:*`
3. Check cache TTL: `redis-cli TTL delays:obra-123:7`

### "Confidence scores invalid"

**Symptom:** Confidence > 100% or < 0%

**Solution:**
1. Validate Brain response: Check `ml-delay.service.ts` in Brain
2. Check formatter: `BrainDelayService.formatAlertForUI()` handles 0-1 → 0-100% conversion
3. Add test case for edge cases

---

## 📈 Next Milestones

### Phase 4.2: Real Infrastructure (2-3 weeks)
- [ ] Deploy Brain services to production
- [ ] Load 12+ months historical data
- [ ] Setup PostgreSQL + Redis for persistence
- [ ] Configure ML training pipeline
- [ ] Validate with real obra data

### Phase 4.3: Pilot Validation (4+ weeks)
- [ ] Test on 5 construction sites
- [ ] Measure precision/recall
- [ ] Calculate ROI per site
- [ ] Iterate based on feedback

---

## 📞 Support

**Questions?**
- Backend: Check `BrainDelayService` docs
- Frontend: Check `DelayAlertsCard` props
- Integration: See workflow diagrams above

**Issues:**
- Open GitHub issue: `tag: delay-alerts, phase-4.1`
- Reference: This document

---

**Created:** 2026-07-25  
**Status:** Ready for Implementation  
**Next Step:** Deploy to staging environment

