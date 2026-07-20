# ✅ Week 4 Execution Checklist — Production Deployment

**Status:** Infrastructure Ready ✅  
**Next Actions:** Execute staging deployment and load tests  
**Estimated Duration:** 2-3 days (load test + canary)  
**Target Completion:** 19 agosto 2026

---

## 🎯 Quick Start — For Execution Team

### Prerequisites (Verify First)
```bash
# Check environment
docker --version          # Need Docker 20.10+
docker-compose --version  # Need 2.0+
python --version          # Need Python 3.9+
npm --version             # Need npm 8+

# Check PostgreSQL connectivity (if using external DB)
psql -h ${PG_HOST} -U ${PG_USER} -d buildly -c "SELECT version();"

# Check .env is configured
test -f buildly-premium/apps/intelligence-layer/.env && echo "✓ .env exists" || echo "✗ Missing .env"
```

---

## 📋 Phase 1: Staging Deployment (2-3 hours)

### Step 1: Build Docker Image
```bash
cd buildly-premium

# Build image
docker build -f docker/Dockerfile.intelligence-layer \
  -t intelligence-layer:v1.0.0 \
  -t intelligence-layer:latest .

# Verify build
docker images | grep intelligence-layer
# Expected: 180MB image size
```

### Step 2: Deploy Stack
```bash
# Start all services (PostgreSQL, Neo4j, API, Prometheus, Grafana)
docker-compose -f docker/docker-compose.yml up -d

# Wait for services (30-60 seconds)
sleep 60

# Verify all services running
docker-compose -f docker/docker-compose.yml ps
# All should show: Up
```

### Step 3: Verify Health
```bash
# Health check endpoint
curl http://localhost:3001/recommendations/health
# Expected: {"status":"ok","timestamp":"...","model_loaded":true}

# Verify Prometheus is scraping
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'
# Expected: 4+ targets (prometheus, intelligence-layer, postgres, neo4j)

# Verify Grafana dashboard
open http://localhost:3000
# Login: admin / admin
# Find: "Buildly Intelligence Layer" dashboard
```

### Step 4: Run Smoke Tests
```bash
# Simple inference test
curl -X POST http://localhost:3001/recommendations/infer \
  -H "Content-Type: application/json" \
  -d '{
    "evento_id": "test-001",
    "obra_id": "obra-001",
    "tipo_evento": "MATERIAL_DELAY",
    "opcoes": [
      {"id": "1", "descricao": "Esperar", "custo_estimado": 150000, "prazo_dias": 15, "risco_score": 80},
      {"id": "2", "descricao": "Importar", "custo_estimado": 225000, "prazo_dias": 3, "risco_score": 50}
    ],
    "contexto": {"fase_obra": "estrutura", "conclusao_pct": 45, "equipe_tamanho": 25, "fornecedor_confiabilidade": 75}
  }'

# Expected: 200 OK with recommendations array
# Check latency < 200ms
```

**✅ Checkpoint 1 Complete:** Staging environment healthy with all services running

---

## 🔥 Phase 2: Load Testing Baseline (1-2 hours)

### Step 1: Run Load Test
```bash
cd buildly-premium

# Execute 1000 requests with 10 concurrent workers
python scripts/load_test.py \
  --url http://localhost:3001 \
  --requests 1000 \
  --workers 10

# This will take ~20 seconds for 1000 requests
```

### Step 2: Verify Results
```bash
# Check output file
cat load_test_results.json | jq '.targets'

# Expected output:
# {
#   "p50_target_ms": 100,
#   "p95_target_ms": 200,
#   "p99_target_ms": 300,
#   "p50_met": true,
#   "p95_met": true,
#   "p99_met": true
# }
```

### Step 3: Document Baseline
```bash
# Save baseline for comparison
cp load_test_results.json load_test_baseline_v1.0.json

# Expected baseline (from Week 3):
# P50: ~87ms ✓ (< 100ms target)
# P95: ~150ms ✓ (< 200ms target)
# P99: ~250ms ✓ (< 300ms target)
# Error rate: <0.1% ✓
# Throughput: ~100 req/s
```

### Step 4: Cache Hit Ratio Check
```bash
# Run another load test with cache monitoring
python scripts/load_test.py \
  --url http://localhost:3001 \
  --requests 500 \
  --workers 5

# Monitor cache hits
curl http://localhost:9090/api/v1/query?query=rate\(recommendation_cache_hits_total\[5m\]\) | jq .

# Expected: 30-50% cache hit ratio (first 500 requests may be lower)
```

**✅ Checkpoint 2 Complete:** Load test baseline established and targets verified

---

## 🧪 Phase 3: A/B Testing Canary (24-48 hours)

### Step 1: Deploy Model v2.0 to Canary
```bash
# This requires model v2.0 to be available
# For now, v1.0 is deployed to 100% traffic

# When v2.0 is ready:
# 1. Update docker-compose.yml or environment config
# 2. Restart Intelligence Layer
# 3. Configure traffic split: 90% v1.0, 10% v2.0

# Simulated test (using v1.0 as both A and B for now):
python scripts/ab_testing_framework.py
```

### Step 2: Collect Metrics (24 hours)
```bash
# Let the service run for 24 hours
# Prometheus will automatically collect metrics

# After 24 hours, query Prometheus
curl -G "http://localhost:9090/api/v1/query_range" \
  --data-urlencode 'query=rate(recommendation_requests_total[1h])' \
  --data-urlencode 'start=2026-08-13T13:00:00Z' \
  --data-urlencode 'end=2026-08-14T13:00:00Z' \
  --data-urlencode 'step=60s' > canary_metrics.json
```

### Step 3: Analyze Results
```bash
# Run statistical significance test
python scripts/ab_testing_framework.py analyze \
  --test-id a1b2c3d4 \
  --metrics-file canary_metrics.json

# Check output for:
# - P95 latency comparison
# - Error rate comparison  
# - Statistical significance (p-value)
# - Recommendation (DEPLOY / KEEP / CONTINUE)
```

**✅ Checkpoint 3 Complete:** A/B test results analyzed and decision made

---

## 🚀 Phase 4: Production Rollout (Next 24-48 hours)

### Phase 4.1: Canary (10% traffic) — 6-12 hours
```bash
# If A/B test shows improvement:
# Gradually increase v2.0 traffic to 10%

# Monitor for:
# - Error rate (should stay < 0.1%)
# - P95 latency (should stay < 210ms)
# - Cache hit ratio (should stay 30-50%)

# If issues detected: ROLLBACK immediately
kubectl set image deployment/intelligence-layer \
  intelligence-layer=[registry]/intelligence-layer:v1.0.0
```

### Phase 4.2: Early Adopters (25% traffic) — 12-24 hours
```bash
# Increase v2.0 to 25% traffic
# Continue monitoring

# Alert thresholds (stricter):
# - Error rate > 0.3% → ROLLBACK
# - P95 latency > 225ms → ROLLBACK
```

### Phase 4.3: Majority (50% traffic) — 24-48 hours
```bash
# Increase v2.0 to 50% traffic
# Full production testing with half the users

# Alert thresholds:
# - Error rate > 0.2% → ROLLBACK
# - P95 latency > 210ms → ROLLBACK
```

### Phase 4.4: General Availability (100% traffic)
```bash
# Complete rollout to all users
# Monitor for 7 days before marking complete

# Alert thresholds (production):
# - Error rate > 0.1% → Page on-call
# - P95 latency > 205ms → Page on-call
# - Model not loaded > 1 min → Critical alert
```

---

## 📊 Monitoring Dashboards

### Grafana Dashboard
```
http://localhost:3000

Dashboard: "Buildly Intelligence Layer — Recommendation API Monitoring"

Panels:
1. Inference Latency Percentiles (P50/P95/P99)
2. Cache Hit Ratio %
3. Request Throughput & Error Rate
4. PostgreSQL Active Connections
5. Error Rate % Trend
```

### Prometheus Queries
```
# P95 latency
histogram_quantile(0.95, rate(recommendation_latency_ms_bucket[5m]))

# Error rate %
(rate(recommendation_errors_total[5m]) / rate(recommendation_requests_total[5m])) * 100

# Cache hit ratio
(rate(recommendation_cache_hits_total[5m]) / 
  (rate(recommendation_cache_hits_total[5m]) + rate(recommendation_cache_misses_total[5m]))) * 100

# Request throughput
rate(recommendation_requests_total[1m])
```

---

## 🆘 Troubleshooting

### Problem: Load test shows P95 > 200ms
1. Check if services are healthy: `docker-compose ps`
2. Check PostgreSQL connection: `curl http://localhost:9090/api/v1/query?query=pg_stat_activity_count`
3. Check cache hit ratio: if < 20%, cache may be misconfigured
4. Investigate slow queries: `curl http://localhost:3001/metrics | grep recommendation_database`

### Problem: Model not loading at startup
1. Check if registry.json exists: `ls -la buildly-premium/data/models/registry.json`
2. Check file permissions: `chmod 644 buildly-premium/data/models/registry.json`
3. Check container logs: `docker-compose logs intelligence-layer`
4. Expected in logs: "Model loaded from registry.json"

### Problem: High error rate in production
1. Check error types: `curl http://localhost:9090/api/v1/query?query=recommendation_errors_total`
2. Check API logs: `docker-compose logs intelligence-layer | grep -i error`
3. Check database connection pool: `curl http://localhost:9090/api/v1/query?query=pg_stat_activity_count`
4. If pool exhausted: increase PG_POOL_MAX in .env and restart

### Problem: Need to rollback to v1.0
```bash
# Immediately redirect all traffic to v1.0
docker-compose up -d intelligence-layer

# Monitor error rate for 5 minutes
# If errors drop: rollback successful
# If errors persist: investigate root cause
```

---

## ✅ Sign-Off Checklist

Before declaring Phase 3.1 complete:

- [ ] Staging deployment successful
- [ ] All health checks passing
- [ ] Load test P95 < 200ms verified
- [ ] Smoke tests all green
- [ ] Prometheus metrics collecting
- [ ] Grafana dashboard showing live data
- [ ] A/B test canary deployed
- [ ] Statistical significance tested
- [ ] Production rollout plan approved
- [ ] Runbooks reviewed by team
- [ ] On-call procedures tested
- [ ] Rollback procedure tested
- [ ] All commits pushed to remote
- [ ] STATUS.md updated

---

## 📞 Escalation Path

| Issue | Owner | Action |
|-------|-------|--------|
| P95 latency > 250ms | On-call Engineer | Check query performance, increase pool size |
| Error rate > 1% | On-call Engineer | Investigate logs, consider rollback |
| Model not loaded | Platform Engineer | Restart API, check registry.json |
| Critical security issue | Security Lead | Immediate hotfix + emergency rollout |
| Database performance degradation | DBA | Query optimization, index analysis |

---

## 🎓 Team Resources

- **WEEK4-DEPLOYMENT-GUIDE.md** — Detailed deployment procedures
- **Grafana Dashboard** — Real-time monitoring and alerting
- **load_test.py** — Load testing execution (1000 requests, latency validation)
- **ab_testing_framework.py** — A/B test statistical analysis
- **Runbooks** — On-call troubleshooting procedures (in deployment guide)

---

**Status:** Ready for execution ✅  
**Target Start Date:** 2026-08-13  
**Target Completion Date:** 2026-08-19  
**Estimated Team Hours:** 20-30 hours (execution + monitoring)

Good luck with the deployment! 🚀

