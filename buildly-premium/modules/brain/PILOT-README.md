# 🚀 Buildly Brain — Material Delay Alert Pilot

**Status:** ✅ MVP Complete (PRs #1-6)  
**Date:** 2026-07-25  
**Branch:** `claude/serene-einstein-em23qs`

---

## 📍 What is This?

A **pilot implementation** of Buildly Brain's predictive capabilities, focusing on detecting material delays **3+ days in advance**.

This pilot validates:
- ✅ Brain can predict events from historical data
- ✅ Core can call Brain APIs and display recommendations
- ✅ Humans can approve/reject predictions (feedback loop)
- ✅ Model improves with feedback (Adaptive EMA learning)

---

## 📊 Pilot Scope

| Component | Status | Lines |
|-----------|--------|-------|
| Prediction Endpoint (`GET /ml/predict/delays`) | ✅ | 140 |
| Unit Tests (10 scenarios) | ✅ | 250 |
| Module Integration | ✅ | 5 |
| DTOs + Swagger Docs | ✅ | 100 |
| Feedback Loop (`POST .../feedback`) | ✅ | 50 |
| Integration Guide | ✅ | 250 |
| Core Example (TypeScript) | ✅ | 80 |
| Demo Script | ✅ | 120 |
| **Total** | **✅** | **~995** |

---

## 🎯 Success Criteria

| Metric | Target | Validation |
|--------|--------|------------|
| **Precision** | >= 75% | Test with 5 works, calculate TP/(TP+FP) |
| **Recall** | >= 70% | Count actual delays vs predicted |
| **False Positives** | < 10% | Alert rejected rate by gestor |
| **Latency P95** | < 800ms | Monitor query_time_ms in response |
| **Approval Workflow** | 100% | Gestor can approve/reject alerts |
| **Cache Hit Rate** | > 80% | By day 2 of predictions |
| **Financial Impact** | >= R$ 20k | Per prevented delay |

---

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Buildly Brain ML Engine running
docker-compose up brain-ml

# PostgreSQL with historical data
psql -U postgres -d buildly -c \
  "SELECT COUNT(*) FROM material_pedidos_historico WHERE created_at >= NOW() - INTERVAL '12 months'"
# Should return: > 100 rows
```

### 2. Test Endpoint

```bash
# Get predictions for a construction site
curl -H "X-Tenant-ID: obra-123" \
  http://localhost:3002/ml/predict/delays?forecast_days=7

# Response: 200 OK with predictions array
```

### 3. Run Demo

```bash
cd modules/brain/apps/ml-engine

# Install dependencies
npm install

# Run demo (requires Brain running)
npm run dev  # Start server
npx ts-node demo-delay-pilot.ts
```

**Expected output:**
```
🏗️  Buildly Brain — Material Delay Prediction Pilot Demo

📍 Obra: obra-sao-paulo-loja-42
📅 Forecast: 7 days

📡 STEP 1: Calling Brain API...
✅ Retrieved 3 alerts

📊 STEP 2: Displaying alerts to gestor...
1. 🔴 [CRITICAL] Cimento CP II
   Confiança: 78%
   Atraso esperado: 8 dias
   Recomendação: Reordenar cronograma (risco crítico)
   Requer aprovação: Sim

✅ STEP 3: Gestor approves first alert...
   Feedback recorded: Feedback recorded. Model weights...

🧠 STEP 4: Model learning impact...
   ✅ Predictions retrieved (latency: < 800ms)
   ✅ Alerts displayed with confidence scores
   ✅ Approval workflow functional
   ✅ Feedback recorded for model improvement
```

---

## 📚 API Reference

### GET /ml/predict/delays

**Returns:** Material delay predictions for next N days

**Request:**
```bash
GET /ml/predict/delays?forecast_days=7
Headers:
  X-Tenant-ID: obra-123
  Authorization: Bearer <token>
```

**Response (200):**
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

### POST /ml/predict/delays/feedback

**Records:** Actual outcome of a prediction

**Request:**
```bash
POST /ml/predict/delays/feedback
Headers:
  X-Tenant-ID: obra-123
  Authorization: Bearer <token>

Body:
{
  "prediction_id": "pred-1",
  "actual_outcome": "occurred",
  "actual_date": "2026-08-01",
  "actual_impact_brl": 50000,
  "notes": "Cimento atrasou, economizamos reordenando"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Feedback recorded. Model weights will update on next training cycle.",
  "prediction_id": "pred-1"
}
```

---

## 🔗 Integration with Core

See: `docs/PILOT-DELAY-INTEGRATION.md`

**High-level flow:**

```
1. Core calls: GET /ml/predict/delays
2. Brain returns: Array of predictions with confidence
3. Core displays: Alerts to gestor (with ✅ Approve / ❌ Reject buttons)
4. Gestor approves: POST /ml/predict/delays/feedback
5. Brain updates: Pattern weights via Adaptive EMA
6. Next prediction: Better accuracy from feedback
```

---

## 🧪 Running Tests

```bash
cd modules/brain/apps/ml-engine

# Unit tests (ML Service)
npm test ml-delay.service.spec.ts

# Integration tests (coming in Phase 4.0)
npm run test:e2e
```

**Test coverage:**
- ✅ Empty predictions
- ✅ CRITICAL severity detection
- ✅ Confidence filtering
- ✅ Financial impact calculation
- ✅ Approval workflow
- ✅ Cache validation
- ✅ Error handling
- ✅ Feedback recording

---

## 📊 Metrics & Monitoring

### Key Metrics

```
# Latency (should be < 800ms)
brain_prediction_latency_ms

# Cache effectiveness (should be > 80% after day 1)
brain_prediction_cache_hit_rate

# Alert volume (track trend)
brain_prediction_total_alerts
brain_prediction_critical_severity
```

### How to Check

```bash
# If Prometheus is configured
curl http://localhost:9090/metrics | grep brain_prediction

# Or check response metadata
curl http://localhost:3002/ml/predict/delays \
  -H "X-Tenant-ID: obra-123" | \
  jq '.metadata'
```

---

## 🚨 Troubleshooting

### "No predictions returned"

**Causes:**
- Obra has < 5 historical events
- forecast_days > 30
- Database not populated

**Solution:**
```sql
-- Check historical data
SELECT COUNT(*), DATE(data_realizada) 
FROM material_pedidos_historico 
WHERE obra_id = 'obra-123'
GROUP BY DATE(data_realizada)
ORDER BY DATE DESC;
-- Should have at least 50 events across 12 months
```

### "Latency > 800ms"

**Causes:**
- Cache miss (first request)
- Database slow

**Solution:**
```bash
# Manually refresh cache
redis-cli FLUSHDB

# Or set longer TTL
# In ml-delay.service.ts, change: 24 * 60 * 60 * 1000 to needed value
```

### "Confidence very low (< 20%)"

**Causes:**
- Material has inconsistent history
- Few historical events (< 10)

**Solution:**
- Collect more data (12+ months)
- Or increase historical weight: `alpha = 0.1` (more historical data influence)

---

## 📈 Next Steps (Phase 4.0)

- [ ] Auto-execution of low-risk recommendations
- [ ] Multi-model predictions (Random Forest + EMA ensemble)
- [ ] Causal analysis (Neo4j integration)
- [ ] Real-time streaming predictions (Kafka)
- [ ] Explainability dashboard (SHAP values)
- [ ] Mobile app alerts

---

## 📞 Support

**Issues?** Open GitHub issue in `Jonacir2023/JC`:
- Tag: `piloto`, `phase-3.9`, `brain`
- Reference: Issue #15 (Pilot)

**Contacts:**
- Architecture: Claude
- Implementation: Codex
- Approval/Data: Humano

---

## 📋 Commits in This Pilot

```
87fd770 - feat: integrate material delay service into ML module (PR #3)
afddd3e - test: add comprehensive unit tests for material delay predictor (PR #2)
9bb57fc - feat: add material delay prediction endpoint for pilot (PR #1)
8abf8da - feat: add DTOs and feedback loop for material delay pilot (PR #4)
d96e54e - docs: add integration guide and Core API example (PR #5)
[PR #6] - demo: add end-to-end demo and final README (this file)
```

---

**🎉 Pilot Ready for Validation with Real Data! 🎉**

Next: Take this to 5 construction sites, measure precision/recall, validate ROI.
