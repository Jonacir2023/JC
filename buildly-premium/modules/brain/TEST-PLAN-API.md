# 🧪 API Test Plan — Material Delay Prediction Pilot

**Status:** Ready to Execute  
**Date:** 2026-07-25  
**Duration:** 2-3 hours  
**Prerequisites:** Brain ML Engine running on :3002

---

## 🚀 Quick Start

### Prerequisites Check

```bash
# 1. Brain is running
curl http://localhost:3002/ml/health
# Expected: 200 OK + health status

# 2. Database is populated
psql -U postgres -d buildly -c \
  "SELECT COUNT(*) as event_count FROM material_pedidos_historico WHERE created_at >= NOW() - INTERVAL '12 months';"
# Expected: >= 100 rows

# 3. Redis is running
redis-cli ping
# Expected: PONG
```

---

## 📋 Test Suite

### **TEST 1: Health Check**

**Purpose:** Verify Brain API is responsive

```bash
curl -X GET http://localhost:3002/ml/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "models_active": 3,
  "last_training": "2026-07-25T10:00:00Z",
  "prediction_ready": true
}
```

**Validation:**
- ✅ Status code: 200
- ✅ status field: "healthy"
- ✅ prediction_ready: true

---

### **TEST 2: Get Predictions (No Cache)**

**Purpose:** Test prediction endpoint with fresh query (cache miss)

```bash
OBRA_ID="obra-test-001"
FORECAST_DAYS="7"

curl -X GET \
  "http://localhost:3002/ml/predict/delays?forecast_days=${FORECAST_DAYS}" \
  -H "X-Tenant-ID: ${OBRA_ID}" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json"
```

**Expected Response (Success):**
```json
{
  "status": "success",
  "data": {
    "obra_id": "obra-test-001",
    "predictions": [
      {
        "id": "pred-uuid",
        "material_id": "mat-123",
        "material_name": "Cimento CP II",
        "predicted_delay_days": 8,
        "confidence": 0.78,
        "severity": "CRITICAL",
        "predicted_date": "2026-08-01",
        "recommended_action": "Reordenar cronograma",
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

**Validation:**
- ✅ Status code: 200
- ✅ status: "success"
- ✅ predictions array: > 0 items
- ✅ query_time_ms: < 800
- ✅ cache_hit: false
- ✅ Each prediction has required fields

---

### **TEST 3: Get Predictions (Cache Hit)**

**Purpose:** Verify caching works (same call within 24h)

```bash
# Run immediately after TEST 2
sleep 2

curl -X GET \
  "http://localhost:3002/ml/predict/delays?forecast_days=7" \
  -H "X-Tenant-ID: obra-test-001" \
  -H "Authorization: Bearer test-token"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": { /* same as TEST 2 */ },
  "metadata": {
    "query_time_ms": 5,        // Much faster!
    "cache_hit": true,         // ← KEY DIFFERENCE
    "forecast_days": 7
  }
}
```

**Validation:**
- ✅ cache_hit: true
- ✅ query_time_ms: < 50 (cached response)
- ✅ Same data as TEST 2

---

### **TEST 4: Confidence Filtering**

**Purpose:** Verify low-confidence predictions are handled

```bash
curl -X GET \
  "http://localhost:3002/ml/predict/delays?forecast_days=30" \
  -H "X-Tenant-ID: obra-test-001"
```

**Expected Behavior:**
- ✅ Returns predictions even with low confidence (< 0.5)
- ✅ Confidence scores are between 0 and 1
- ✅ No predictions with confidence > 1.0

---

### **TEST 5: Severity Classification**

**Purpose:** Verify severity levels are correctly assigned

```bash
curl -X GET \
  "http://localhost:3002/ml/predict/delays?forecast_days=7" \
  -H "X-Tenant-ID: obra-test-001" | jq '.data.predictions[] | {material_name, confidence, severity}'
```

**Expected Output:**
```json
{
  "material_name": "Cimento CP II",
  "confidence": 0.78,
  "severity": "CRITICAL"
}
{
  "material_name": "Aço CA-50",
  "confidence": 0.55,
  "severity": "HIGH"
}
```

**Validation:**
- ✅ CRITICAL severity: high confidence + critical activities
- ✅ HIGH severity: medium confidence + important activities
- ✅ MEDIUM severity: lower confidence
- ✅ LOW severity: very low confidence

---

### **TEST 6: Financial Impact Calculation**

**Purpose:** Verify cost estimation is reasonable

```bash
curl -X GET \
  "http://localhost:3002/ml/predict/delays?forecast_days=7" \
  -H "X-Tenant-ID: obra-test-001" | \
  jq '.data.summary.estimated_impact_brl'
```

**Expected Behavior:**
- ✅ estimated_impact_brl > 0 (if predictions exist)
- ✅ Correlates with severity (CRITICAL > HIGH > MEDIUM > LOW)
- ✅ Per-alert impact = baseImpact × confidence

**Calculation:**
```
CRITICAL: R$ 50.000 × confidence
HIGH:     R$ 25.000 × confidence
MEDIUM:   R$ 10.000 × confidence
LOW:      R$ 5.000 × confidence
```

---

### **TEST 7: Submit Feedback — Occurred**

**Purpose:** Record that predicted delay actually happened

```bash
PRED_ID=$(curl -s http://localhost:3002/ml/predict/delays \
  -H "X-Tenant-ID: obra-test-001" | \
  jq -r '.data.predictions[0].id')

curl -X POST \
  "http://localhost:3002/ml/predict/delays/feedback" \
  -H "X-Tenant-ID: obra-test-001" \
  -H "Content-Type: application/json" \
  -d "{
    \"prediction_id\": \"${PRED_ID}\",
    \"actual_outcome\": \"occurred\",
    \"actual_date\": \"2026-08-01\",
    \"actual_impact_brl\": 50000,
    \"notes\": \"Cimento atrasou, reordenamos cronograma e economizamos\"
  }"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Feedback recorded. Model weights will update on next training cycle.",
  "prediction_id": "pred-uuid"
}
```

**Validation:**
- ✅ Status code: 200
- ✅ status: "success"
- ✅ message contains "recorded"

---

### **TEST 8: Submit Feedback — False Positive**

**Purpose:** Record that prediction did NOT happen

```bash
curl -X POST \
  "http://localhost:3002/ml/predict/delays/feedback" \
  -H "X-Tenant-ID: obra-test-002" \
  -H "Content-Type: application/json" \
  -d "{
    \"prediction_id\": \"pred-uuid-2\",
    \"actual_outcome\": \"false_positive\",
    \"notes\": \"Cimento chegou no prazo, alerta foi errado\"
  }"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Feedback recorded...",
  "prediction_id": "pred-uuid-2"
}
```

**Validation:**
- ✅ Accepts false_positive outcome
- ✅ Cache is invalidated (next call will recalculate)

---

### **TEST 9: Cache Invalidation After Feedback**

**Purpose:** Verify cache is cleared after feedback

```bash
# 1. Get predictions (cached)
curl -s http://localhost:3002/ml/predict/delays \
  -H "X-Tenant-ID: obra-test-001" | jq '.metadata.cache_hit'
# Expected: true

# 2. Submit feedback
curl -X POST http://localhost:3002/ml/predict/delays/feedback \
  -H "X-Tenant-ID: obra-test-001" \
  -H "Content-Type: application/json" \
  -d "{ \"prediction_id\": \"...\", \"actual_outcome\": \"occurred\" }"

# 3. Get predictions again (should be cache miss)
curl -s http://localhost:3002/ml/predict/delays \
  -H "X-Tenant-ID: obra-test-001" | jq '.metadata.cache_hit'
# Expected: false
```

**Validation:**
- ✅ First call: cache_hit = true
- ✅ After feedback: cache_hit = false (cache cleared)

---

### **TEST 10: Latency SLA (< 800ms)**

**Purpose:** Verify API meets performance target

```bash
time curl -s http://localhost:3002/ml/predict/delays \
  -H "X-Tenant-ID: obra-test-001" > /dev/null
```

**Expected:**
- ✅ Total time < 1000ms
- ✅ query_time_ms in response: < 800ms
- ✅ Consistent across multiple calls

---

### **TEST 11: Error Handling — Invalid Forecast Days**

**Purpose:** Verify validation

```bash
# forecast_days > 30
curl -X GET \
  "http://localhost:3002/ml/predict/delays?forecast_days=60" \
  -H "X-Tenant-ID: obra-test-001"
```

**Expected Response:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "forecast_days must be between 1 and 30",
  "error": "Bad Request"
}
```

---

### **TEST 12: Error Handling — Missing Tenant ID**

**Purpose:** Verify authentication

```bash
curl -X GET \
  "http://localhost:3002/ml/predict/delays?forecast_days=7"
  # NO X-Tenant-ID header
```

**Expected Response:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "X-Tenant-ID or obra_id query parameter required",
  "error": "Bad Request"
}
```

---

## 📊 Test Results Template

```
╔═══════════════════════════════════════════════════════════════╗
║       BUILDLY BRAIN — API TEST RESULTS                        ║
║       Date: 2026-07-25                                        ║
║       Tester: [Your Name]                                     ║
╚═══════════════════════════════════════════════════════════════╝

TEST 1:  Health Check                          [✅ PASS / ❌ FAIL]
TEST 2:  Predictions (Cache Miss)              [✅ PASS / ❌ FAIL]
TEST 3:  Predictions (Cache Hit)               [✅ PASS / ❌ FAIL]
TEST 4:  Confidence Filtering                  [✅ PASS / ❌ FAIL]
TEST 5:  Severity Classification               [✅ PASS / ❌ FAIL]
TEST 6:  Financial Impact                      [✅ PASS / ❌ FAIL]
TEST 7:  Feedback — Occurred                   [✅ PASS / ❌ FAIL]
TEST 8:  Feedback — False Positive             [✅ PASS / ❌ FAIL]
TEST 9:  Cache Invalidation                    [✅ PASS / ❌ FAIL]
TEST 10: Latency SLA (< 800ms)                 [✅ PASS / ❌ FAIL]
TEST 11: Error — Invalid forecast_days         [✅ PASS / ❌ FAIL]
TEST 12: Error — Missing X-Tenant-ID           [✅ PASS / ❌ FAIL]

SCORE: 12/12 = 100% ✅
       11/12 = 92%  🟡
       < 11/12 = NEEDS FIXES 🔴

NOTES:
[Add any observations, failures, or issues]

NEXT STEPS:
[ ] Fix failures
[ ] Document issues
[ ] Move to E2E tests
```

---

## 🔧 Automated Test Script

### Using curl + jq

Save as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3002"
OBRA_ID="obra-test-001"
PASS=0
FAIL=0

echo "🧪 Starting API Tests..."
echo ""

# TEST 1: Health
echo "TEST 1: Health Check"
if curl -s $BASE_URL/ml/health | jq -e '.status == "healthy"' > /dev/null; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# TEST 2: Predictions
echo "TEST 2: Get Predictions"
RESPONSE=$(curl -s $BASE_URL/ml/predict/delays -H "X-Tenant-ID: $OBRA_ID")
if echo $RESPONSE | jq -e '.status == "success"' > /dev/null; then
  LATENCY=$(echo $RESPONSE | jq '.metadata.query_time_ms')
  if [ $LATENCY -lt 800 ]; then
    echo "✅ PASS (latency: ${LATENCY}ms)"
    ((PASS++))
  else
    echo "❌ FAIL (latency: ${LATENCY}ms > 800ms)"
    ((FAIL++))
  fi
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# TEST 3: Cache Hit
echo "TEST 3: Cache Hit"
if curl -s $BASE_URL/ml/predict/delays -H "X-Tenant-ID: $OBRA_ID" | jq -e '.metadata.cache_hit == true' > /dev/null; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

echo ""
echo "📊 Results: $PASS PASS, $FAIL FAIL"
echo "Score: $(( PASS * 100 / (PASS + FAIL) ))%"
```

### Run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## ⏱️ Execution Timeline

| Time | Activity | Duration |
|------|----------|----------|
| 0:00 | Prerequisites check | 10 min |
| 0:10 | TEST 1-6 (Predictions) | 30 min |
| 0:40 | TEST 7-9 (Feedback + Cache) | 20 min |
| 1:00 | TEST 10-12 (Latency + Errors) | 30 min |
| 1:30 | Document results | 30 min |
| **2:00** | **TOTAL** | **2 hours** |

---

## 🎯 Success Criteria

**PASS if:**
- ✅ 11/12 tests pass
- ✅ Latency < 800ms
- ✅ Cache hit rate > 80%
- ✅ Feedback recorded successfully

**FAIL if:**
- ❌ < 10/12 tests pass
- ❌ Latency > 1000ms consistently
- ❌ Cache not working

---

**Ready? Let's test! 🚀**
