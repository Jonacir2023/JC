# Week 4: Production Deployment & Monitoring Guide

**Phase 3.1: Recommendation Engine — Week 4**  
**Status:** Deployment & A/B Testing  
**Target Completion:** 19 agosto  
**Uptime Target:** 99.9%

---

## 🚀 Week 4 Priorities

### Priority 1: Production Deployment (Days 1-2)
- [ ] Build and push Docker images to registry
- [ ] Deploy to staging environment
- [ ] Execute pre-deployment smoke tests
- [ ] Verify all health checks passing
- [ ] Configure monitoring and alerting

### Priority 2: Load Testing (Days 2-3)
- [ ] Execute 1000-request load test (10 concurrent)
- [ ] Verify P50<100ms, P95<200ms, P99<300ms targets
- [ ] Measure cache hit ratio (target 30-50%)
- [ ] Document latency baseline for comparison

### Priority 3: A/B Testing Setup (Days 3-4)
- [ ] Configure model v1.0 (current) as baseline
- [ ] Deploy model v2.0 (retrained) to canary (10% traffic)
- [ ] Collect metrics for 24h canary period
- [ ] Run statistical significance testing
- [ ] Decide: promote, rollback, or continue

### Priority 4: Production Rollout (Day 4)
- [ ] Gradual traffic increase (10% → 25% → 50% → 100%)
- [ ] Monitor error rates and latency at each stage
- [ ] Setup on-call alerts and escalation
- [ ] Document runbooks for production support

### Priority 5: Documentation (Ongoing)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment runbooks
- [ ] Operational procedures
- [ ] Training materials

---

## 📋 Pre-Deployment Checklist

### Infrastructure
- [ ] Docker Registry credentials configured
- [ ] Kubernetes cluster access verified (if using K8s)
- [ ] PostgreSQL 15 instance available (staging + production)
- [ ] Neo4j 5.12 instance available (optional but recommended)
- [ ] Redis cache available (for future optimization)
- [ ] DNS records configured for API endpoint

### Application
- [ ] All tests passing (unit + integration)
- [ ] Code review completed
- [ ] Security scanning passed (no CVE)
- [ ] Dependencies up to date
- [ ] Build artifacts created and scanned

### Documentation
- [ ] Deployment guide reviewed
- [ ] Rollback procedures documented
- [ ] Alert rules configured
- [ ] Runbooks prepared
- [ ] Team trained on procedures

---

## 🐳 Docker Build and Push

### 1. Build Docker Image

```bash
cd buildly-premium

# Build the multi-stage image
docker build \
  -f docker/Dockerfile.intelligence-layer \
  -t intelligence-layer:latest \
  -t intelligence-layer:v1.0.0 \
  .

# Verify build
docker images | grep intelligence-layer
```

### 2. Test Image Locally

```bash
# Run container with docker-compose
docker-compose -f docker/docker-compose.yml up -d

# Wait for services to start (30-60 seconds)
sleep 60

# Test health endpoint
curl http://localhost:3001/recommendations/health

# Expected response:
# {"status":"ok","timestamp":"2026-07-20T...","model_loaded":true}

# Test inference endpoint
curl -X POST http://localhost:3001/recommendations/infer \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "evento_id": "test-001",
  "obra_id": "obra-001",
  "tipo_evento": "MATERIAL_DELAY",
  "opcoes": [
    {"id": "1", "descricao": "Esperar", "custo_estimado": 150000, "prazo_dias": 15, "risco_score": 80},
    {"id": "2", "descricao": "Importar", "custo_estimado": 225000, "prazo_dias": 3, "risco_score": 50}
  ],
  "contexto": {"fase_obra": "estrutura", "conclusao_pct": 45, "equipe_tamanho": 25, "fornecedor_confiabilidade": 75}
}
EOF

# Expected: 200 OK with recommendations array
```

### 3. Push to Registry

```bash
# Login to registry (Docker Hub, ECR, or private)
docker login [registry-url]

# Tag and push
docker tag intelligence-layer:v1.0.0 [registry]/intelligence-layer:v1.0.0
docker push [registry]/intelligence-layer:v1.0.0

# Verify push
docker pull [registry]/intelligence-layer:v1.0.0
```

---

## 🌱 Staging Deployment

### 1. Deploy to Staging

```bash
# Using docker-compose (for Docker-based staging)
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.staging.yml \
  up -d

# Or using Kubernetes (if applicable)
kubectl apply -f k8s/staging/deployment.yaml
kubectl apply -f k8s/staging/service.yaml

# Wait for deployment
kubectl rollout status deployment/intelligence-layer-staging
```

### 2. Verify Staging Deployment

```bash
# Check service is running
curl https://staging-api.buildly.com/recommendations/health

# Check PostgreSQL connection
PGPASSWORD=password psql -h staging-postgres -U postgres -d buildly -c "SELECT COUNT(*) FROM eventos;"

# Check model loading
curl https://staging-api.buildly.com/recommendations/health | jq '.model_loaded'
# Should return: true

# Check Prometheus is scraping metrics
curl https://staging-prometheus.buildly.com/api/v1/query?query=up | jq '.data.result'
```

### 3. Smoke Tests (5-10 min)

```bash
# Run health checks
./scripts/smoke_tests.sh

# Test basic endpoints
python scripts/integration_tests.py --url https://staging-api.buildly.com

# Expected: All tests pass with <200ms latency
```

---

## 📊 Load Testing (Day 2-3)

### 1. Generate Load Test Baseline

```bash
# Run 1000 requests with 10 concurrent workers
python scripts/load_test.py \
  --url http://localhost:3001 \
  --requests 1000 \
  --workers 10

# Expected output:
# P50 latency: ~87ms
# P95 latency: ~150ms (< 200ms target)
# P99 latency: ~250ms (< 300ms target)
# Throughput: ~100 req/s
# Error rate: <0.1%

# Results saved to load_test_results.json
```

### 2. Cache Hit Ratio Analysis

```bash
# Run load test with cache validation
python scripts/load_test.py \
  --url http://localhost:3001 \
  --requests 500 \
  --workers 5

# Monitor cache metrics
curl http://localhost:3001/metrics | grep recommendation_cache

# Expected:
# recommendation_cache_hits_total: ~150 (30% of 500)
# recommendation_cache_misses_total: ~350 (70%)
# cache_hit_ratio: ~30%
```

### 3. Comparison Against Targets

```bash
# Extract key metrics from load_test_results.json
jq '.targets' load_test_results.json

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

---

## 🧪 A/B Testing Setup (Day 3-4)

### 1. Create A/B Test Configuration

```bash
# Generate canary test config (90% v1.0, 10% v2.0)
python scripts/ab_testing_framework.py create-canary

# Output:
# Test ID: a1b2c3d4
# Model A: v1.0 (90% traffic)
# Model B: v2.0 (10% traffic)
# Duration: 24 hours
# Minimum sample size: 1000
```

### 2. Deploy v2.0 to Canary

```bash
# Update Intelligence Layer to support traffic splitting
# Edit: apps/intelligence-layer/src/app.module.ts
# Add ABTestingModule with v2.0 canary config

# Redeploy API
docker-compose up -d intelligence-layer

# Verify traffic distribution
# Monitor for 5 minutes to ensure 10% traffic to v2.0
```

### 3. Collect Canary Metrics (24 hours)

```bash
# Monitor real-time metrics
watch -n 10 'curl http://localhost:9090/api/v1/query?query=recommendation_requests_total | jq .'

# Grafana dashboard: http://localhost:3000
# Look for: Buildly Intelligence Layer dashboard
# Monitor: latency, error rate, cache hit ratio

# Save metrics to JSON after 24h
curl http://localhost:9090/api/v1/query_range \
  --data-urlencode 'query=rate(recommendation_requests_total[1h])' \
  --data-urlencode 'start=2026-07-20T13:00:00Z' \
  --data-urlencode 'end=2026-07-21T13:00:00Z' \
  --data-urlencode 'step=60s' | jq . > canary_metrics.json
```

### 4. Run Statistical Significance Test

```bash
# Analyze canary results
python scripts/ab_testing_framework.py analyze \
  --test-id a1b2c3d4 \
  --metrics-file canary_metrics.json

# Output:
# A/B TEST RESULTS: v1.0 vs v2.0
# ═════════════════════════════════
# v1.0: 900 requests, P95=150ms, error_rate=0.05%
# v2.0: 100 requests, P95=145ms, error_rate=0.03%
# 
# STATISTICAL SIGNIFICANCE: ✓ SIGNIFICANT (p=0.032)
# RECOMMENDATION: ✓ DEPLOY v2.0 — Significant improvement
```

### 5. Decision Tree

```
Is p-value < 0.05?
├─ YES: Is latency or error rate improved?
│  ├─ YES: PROMOTE v2.0 to 50% → 100% (next phase)
│  └─ NO: KEEP v1.0 as baseline, iterate on v2.0
├─ NO: Is confidence score significantly better?
│  ├─ YES: CONTINUE v2.0 for another 24h with 25% traffic
│  └─ NO: ROLLBACK v2.0, investigate failure
```

---

## 🚀 Production Rollout (Day 4+)

### Phase 1: Canary (10% traffic) — 6-12 hours
- Collect baseline metrics
- Watch error rates and latency
- Alert threshold: error_rate > 0.5%, P95 > 250ms

### Phase 2: Early Adopters (25% traffic) — 12-24 hours
- Expanded user base testing
- Monitor for degradation
- Alert threshold: error_rate > 0.3%, P95 > 225ms

### Phase 3: Majority (50% traffic) — 24-48 hours
- Half of production traffic
- Verify cache hit ratio
- Alert threshold: error_rate > 0.2%, P95 > 210ms

### Phase 4: General Availability (100% traffic)
- Full rollout
- Monitor for 24h before marking complete
- Final alert threshold: error_rate > 0.1%, P95 > 205ms

### Rollback Procedure

```bash
# If error rate > 1% or P95 > 300ms, immediately rollback

# 1. Scale down v2.0 deployment
kubectl set image deployment/intelligence-layer \
  intelligence-layer=[registry]/intelligence-layer:v1.0.0

# 2. Verify traffic routed to v1.0
curl http://localhost:3001/health | jq '.model_version'

# 3. Monitor for 5 minutes
sleep 300

# 4. Confirm metrics normalized
curl http://localhost:9090/api/v1/query?query=rate(recommendation_errors_total[5m])
```

---

## 📈 Production Monitoring

### Key Metrics to Monitor

1. **Inference Latency**
   - Target: P95 < 200ms
   - Alert: > 250ms for 2 minutes
   - Escalation: Page on-call if > 300ms

2. **Error Rate**
   - Target: < 0.1%
   - Alert: > 0.5% for 2 minutes
   - Escalation: Critical if > 1%

3. **Cache Hit Ratio**
   - Target: 30-50%
   - Alert: < 20% (possible issue)
   - Recommendation: > 50% (exceeding expectations)

4. **Model Confidence**
   - Track: average confidence per request
   - Trend: should remain > 0.75 for v1.0
   - Alert: drops below 0.60

5. **Database Performance**
   - Connection pool usage
   - Slow query count
   - Backup completion

6. **Fallback Rate**
   - Target: < 2% of requests
   - Indicates: model loading issues
   - Alert: > 5% triggers investigation

### Grafana Dashboards

1. **Intelligence Layer Overview**
   - Latency percentiles (P50/P95/P99)
   - Request throughput (RPS)
   - Error rate trends
   - Cache hit ratio

2. **Database Health**
   - Connection pool usage
   - Query latency distribution
   - Slow query log
   - Table bloat analysis

3. **Business Metrics**
   - Recommendations per day
   - Average score distribution
   - Feedback sentiment (pos/neg ratio)
   - Model version traffic split

---

## ⏰ Alert Rules

### Critical (Page on-call immediately)
```
- Model not loaded for > 1 minute
- Error rate > 1% for > 2 minutes
- P95 latency > 300ms for > 5 minutes
- PostgreSQL connection pool exhausted
- Service down (up == 0)
```

### Warning (Create incident)
```
- P95 latency > 200ms for > 5 minutes
- Error rate > 0.1% for > 5 minutes
- Cache hit ratio < 20% for > 10 minutes
- PostgreSQL slow queries > 5/min
- Memory usage > 80% for > 5 minutes
```

### Info (Monitor and trend)
```
- Cache hit ratio > 50%
- Model confidence trending up
- Fallback rate < 1%
- 99th percentile latency < 250ms
```

---

## 📝 Runbooks

### Runbook 1: High Latency Investigation

1. Check if latency spike is uniform or spiky
2. Query slow query log: `SELECT * FROM v_query_performance WHERE mean_time_ms > 50`
3. Check cache hit ratio — if low, cache may be invalid
4. Check database connection pool usage
5. If > 90% connections: scale PostgreSQL pool or add read replica
6. If model issue: check `recommendation_model_loaded` metric

### Runbook 2: High Error Rate

1. Check error type distribution: `curl /metrics | grep recommendation_errors`
2. Sample error logs from the last 5 minutes
3. If validation errors: client payload format issue
4. If database errors: check PostgreSQL status and connection pool
5. If model errors: check model file exists and permissions correct

### Runbook 3: Model Deployment Rollback

1. Identify current deployed version: `curl /health | jq '.model_version'`
2. Check previous version in registry: `cat data/models/registry.json | jq '.versions | .[-2]'`
3. Update `.env` MODEL_PATH to previous version
4. Restart API: `docker-compose restart intelligence-layer`
5. Verify: `curl /health | jq '.model_version'`
6. Monitor error rate for 5 minutes

---

## 🎓 Team Training

### Topics to Cover

1. **Architecture Overview**
   - Event sourcing and CQRS patterns
   - Recommendation inference pipeline
   - Model versioning and deployment strategy

2. **Monitoring & Alerting**
   - How to interpret Grafana dashboards
   - Alert escalation procedures
   - Metric meaning and thresholds

3. **On-Call Procedures**
   - Incident response workflow
   - Runbook execution
   - Communication protocols
   - Escalation matrix

4. **Troubleshooting**
   - Common failure modes
   - Debug procedures
   - Log analysis
   - Performance profiling

---

## ✅ Deployment Sign-Off Checklist

- [ ] Pre-deployment checklist completed
- [ ] Docker image built and tested locally
- [ ] Staging deployment successful
- [ ] Smoke tests all passing
- [ ] Load test baseline established (P95 < 200ms)
- [ ] A/B test configured and canary deployed
- [ ] Monitoring and alerting configured
- [ ] Runbooks documented and tested
- [ ] Team trained on procedures
- [ ] Rollback procedure tested
- [ ] Business stakeholders notified
- [ ] On-call rotation scheduled

---

**Next:** Week 4 Completion → Recommendation Engine v1.0 in Production ✅

