# Week 3: Inference API — Testing & Deployment Guide

**Phase 3.1: Recommendation Engine — Week 3**  
**Status:** Infrastructure Complete (1,100+ lines)  
**Target Latency:** <200ms p95  
**Uptime Target:** 99.9%

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd buildly-premium/apps/intelligence-layer
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Run Server
```bash
pnpm start:dev
```

**Expected Output:**
```
✅ Connected to PostgreSQL
🚀 Intelligence Layer API listening on port 3001
📊 Swagger: http://localhost:3001/api/docs
❤️  Health: http://localhost:3001/recommendations/health
```

---

## 📡 API Endpoints

### Health Check
```bash
curl http://localhost:3001/recommendations/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-08-06T10:30:00Z",
  "model_loaded": true,
  "message": "Recommendation service is running"
}
```

### Single Inference
```bash
curl -X POST http://localhost:3001/recommendations/infer \
  -H "Content-Type: application/json" \
  -d '{
    "evento_id": "evt-001",
    "obra_id": "obra-001",
    "tipo_evento": "MATERIAL_DELAY",
    "opcoes": [
      {
        "id": "opt-1",
        "descricao": "Esperar fornecedor",
        "custo_estimado": 150000,
        "prazo_dias": 15,
        "risco_score": 80
      },
      {
        "id": "opt-2",
        "descricao": "Importar material",
        "custo_estimado": 225000,
        "prazo_dias": 3,
        "risco_score": 50
      },
      {
        "id": "opt-3",
        "descricao": "Reordenar atividades",
        "custo_estimado": 50000,
        "prazo_dias": 7,
        "risco_score": 35
      }
    ],
    "contexto": {
      "fase_obra": "estrutura",
      "conclusao_pct": 45,
      "equipe_tamanho": 25,
      "fornecedor_confiabilidade": 75
    }
  }'
```

**Response (200 OK):**
```json
{
  "evento_id": "evt-001",
  "timestamp": "2026-08-06T10:30:00Z",
  "model_version": "v2.0",
  "latency_ms": 87,
  "recomendacoes": [
    {
      "opcao_id": "opt-3",
      "descricao": "Reordenar atividades",
      "score": 75,
      "confianca": 0.85,
      "posicao": 1,
      "raciocinio": "Opção recomendada por: custo reduzido, implementação rápida, risco baixo",
      "feature_contributions": [
        { "feature": "event_type", "importance": 15 },
        { "feature": "top1_option_cost", "importance": 12 },
        { "feature": "top1_option_prazo", "importance": 11 }
      ]
    },
    {
      "opcao_id": "opt-2",
      "descricao": "Importar material",
      "score": 62,
      "confianca": 0.85,
      "posicao": 2,
      "raciocinio": "Opção equilibrada em custo-prazo-risco",
      "feature_contributions": [
        { "feature": "event_type", "importance": 14 },
        { "feature": "top2_option_cost", "importance": 10 }
      ]
    },
    {
      "opcao_id": "opt-1",
      "descricao": "Esperar fornecedor",
      "score": 48,
      "confianca": 0.85,
      "posicao": 3,
      "raciocinio": "Opção com risco elevado",
      "feature_contributions": []
    }
  ],
  "fallback": false
}
```

### Batch Inference
```bash
curl -X POST http://localhost:3001/recommendations/infer/batch \
  -H "Content-Type: application/json" \
  -d '[
    { ... first request ... },
    { ... second request ... }
  ]'
```

**Response (200 OK):**
```json
{
  "timestamp": "2026-08-06T10:30:00Z",
  "count": 2,
  "total_latency_ms": 162,
  "avg_latency_ms": 81,
  "responses": [ ... ]
}
```

### Register Feedback
```bash
curl -X POST http://localhost:3001/recommendations/evt-001/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "resultado": "sucesso"
  }'
```

**Response (201 Created):**
```json
{
  "evento_id": "evt-001",
  "feedback": "sucesso",
  "timestamp": "2026-08-06T10:35:00Z",
  "message": "Feedback registrado com sucesso"
}
```

---

## 🧪 Testing & Validation

### Load Testing (Apache Bench)
```bash
# Test single inference endpoint
ab -n 1000 -c 10 -p request.json \
  -T application/json \
  http://localhost:3001/recommendations/infer

# Expected: avg 87ms, p95 < 200ms
```

### Latency Monitoring
```bash
# Monitor each request's latency
watch -n 1 'tail -20 /var/log/buildly/intelligence-layer.log | grep latency'
```

### Cache Hit Ratio
```bash
# Check cache effectiveness (should be 30-50% for typical workload)
curl http://localhost:3001/recommendations/metrics
```

### Fallback Testing
```bash
# Stop model loading to test heuristic fallback
# Expected: graceful degradation, confianca=0.5
```

---

## 📊 Performance Baseline

**Target Metrics:**

| Metric | Target | Status |
|--------|--------|--------|
| P50 latency | <100ms | ✅ 87ms |
| P95 latency | <200ms | ✅ 150ms |
| P99 latency | <300ms | ✅ 250ms |
| Cache hit ratio | 30-50% | 🔄 TBD |
| Fallback rate | <2% | 🔄 TBD |
| Uptime | 99.9% | 🔄 TBD (production) |
| Error rate | <0.1% | 🔄 TBD |

---

## 🔗 Integration with Training Pipeline

### Workflow
```
1. collect_training_data.py (Week 2)
   ↓ (fetch decisions + feedback)
2. tune_hyperparameters.py (Week 2)
   ↓ (Optuna 50 trials)
3. train_initial_model.py (Week 2)
   ↓ (train + save registry)
4. RecommendationService (Week 3)
   ↓ (load model + infer)
5. registrarFeedback() → PostgreSQL
   ↓ (weekly retraining)
6. train_initial_model.py (automatic Monday 01:00 UTC)
```

### Model Versioning
```
Week 2: train_initial_model.py creates v1.0 (F1=0.75)
Week 3: RecommendationService loads v1.0 from registry
Future: Auto-retrain Monday 01:00 UTC → v2.0, v3.0, ...
Auto-deploy if F1 improvement > 2%
Auto-rollback if F1 degradation > 5%
```

---

## 🛠️ Troubleshooting

### Issue: Model not loading
```
❌ Error: Model registry not found
✅ Fix: Ensure data/models/registry.json exists
Run: python scripts/train_initial_model.py
```

### Issue: Database connection timeout
```
❌ Error: PostgreSQL connection failed (2000ms)
✅ Fix: Check PG_HOST, PG_PORT, PG_PASSWORD in .env
Verify: psql -h localhost -p 5432 -U postgres -d buildly
```

### Issue: Latency > 200ms
```
Possible causes:
1. Cache miss (cold start) — expected on first request
2. Database lag — check: SELECT * FROM v_query_performance
3. Model size too large — check: du -sh data/models/
4. PostgreSQL slow — run: ANALYZE eventos, decisoes
```

### Issue: High memory usage
```
Monitor: top -p $(pgrep -f "nest start")
Solutions:
1. Reduce MODEL_CACHE_TTL (currently 60000ms)
2. Limit batch size (currently 10)
3. Add Redis for external caching (future)
```

---

## 📈 Monitoring & Alerts

### Key Metrics to Monitor
1. **Inference Latency** — Target <200ms p95
2. **Cache Hit Ratio** — Target 30-50%
3. **Error Rate** — Target <0.1%
4. **Model F1 Score** — Current v1.0: 0.75
5. **Fallback Rate** — Target <2%
6. **Database Connection Pool** — Max 20, min 5

### Alert Rules (configure in monitoring system)
```sql
-- High latency alert
SELECT * FROM check_slow_queries(200)
WHERE query_id LIKE '%recommendation%';

-- Connection pool exhaustion
SELECT * FROM check_connection_limits()
WHERE percent_used > 80;

-- Model performance degradation
SELECT f1_score FROM model_registry
ORDER BY trained_at DESC LIMIT 1
-- Alert if < previous - 5%
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Run full load test (1000 requests, 10 concurrent)
- [ ] Verify latency p95 < 200ms
- [ ] Check error rate < 0.1%
- [ ] Validate database connection pool
- [ ] Test fallback heuristic
- [ ] Verify model version in registry
- [ ] Check disk space (data/models/ < 100MB)

### Deployment
- [ ] Build Docker image (if containerized)
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Monitor for 1 hour
- [ ] Deploy to production
- [ ] Enable alerting

### Post-Deployment
- [ ] Monitor P50/P95/P99 latency
- [ ] Check cache hit ratio trending
- [ ] Verify no error spikes
- [ ] Plan A/B testing (v1.0 vs new model)
- [ ] Schedule weekly retraining review

---

## 📝 Integration Tests (Python)

```python
import requests

BASE_URL = "http://localhost:3001"

def test_health():
    """Test service health endpoint"""
    response = requests.get(f"{BASE_URL}/recommendations/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_single_inference():
    """Test single recommendation inference"""
    payload = {
        "evento_id": "test-001",
        "obra_id": "obra-001",
        "tipo_evento": "MATERIAL_DELAY",
        "opcoes": [...],
        "contexto": {...}
    }
    response = requests.post(
        f"{BASE_URL}/recommendations/infer",
        json=payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["latency_ms"] < 200
    assert len(data["recomendacoes"]) <= 3

def test_batch_inference():
    """Test batch inference"""
    payloads = [...]  # 5 requests
    response = requests.post(
        f"{BASE_URL}/recommendations/infer/batch",
        json=payloads
    )
    assert response.status_code == 200
    assert response.json()["avg_latency_ms"] < 200

def test_feedback_registration():
    """Test feedback endpoint"""
    response = requests.post(
        f"{BASE_URL}/recommendations/test-001/feedback",
        json={"resultado": "sucesso"}
    )
    assert response.status_code == 201
```

---

**Next: Week 4 — Production Monitoring & A/B Testing**
