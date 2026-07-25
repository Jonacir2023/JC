# 🏗️ Buildly Premium — Infrastructure Setup

**Phase:** 4.2 (Real Infrastructure)  
**Status:** Ready to Deploy  
**Date:** 2026-07-25

---

## 📍 Overview

Complete Docker Compose stack for Buildly Premium including:

- **PostgreSQL** — Event Store + Brain data persistence
- **Redis** — Caching layer (24h TTL)
- **Brain ML Engine** — Material delay predictions (:3002)
- **Core API** — Buildly Core (:3001)
- **PgAdmin** — Database management UI (:5050)
- **Redis Commander** — Cache management UI (:8081)

---

## 🚀 Quick Start

### Prerequisites

```bash
# Check Docker and Docker Compose
docker --version     # >= 20.10
docker-compose --version  # >= 2.0

# Clone repository
git clone https://github.com/jonacir2023/buildly-premium.git
cd buildly-premium
```

### Start Stack

```bash
# Build and start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f brain-ml
docker-compose logs -f core-api
```

### Expected Output

```
CONTAINER ID   IMAGE              STATUS             PORTS
xxxx           buildly-postgres   Up 2 min (healthy) 5432
xxxx           buildly-redis      Up 2 min (healthy) 6379
xxxx           buildly-brain-ml   Up 1 min (healthy) 3002
xxxx           buildly-core-api   Up 1 min (healthy) 3001
xxxx           pgadmin            Up 1 min           5050
xxxx           redis-commander    Up 1 min           8081
```

---

## 🔍 Verify Everything Works

### 1. Health Checks

```bash
# Brain ML Engine
curl http://localhost:3002/ml/health
# Expected: {"status":"healthy","models_active":3,"prediction_ready":true}

# Core API
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"2026-07-25T18:30:00Z"}

# Database
docker-compose exec postgres psql -U buildly_user -d buildly_db -c "SELECT version();"
# Expected: PostgreSQL 15.x on x86_64...

# Redis
docker-compose exec redis redis-cli ping
# Expected: PONG
```

### 2. Test Full Workflow

```bash
# Fetch predictions
curl -H "X-Tenant-ID: obra-test-001" \
  http://localhost:3002/ml/predict/delays?forecast_days=7

# Get alerts via Core API
curl http://localhost:3001/alerts/obras/obra-test-001/delay-alerts?forecast_days=7

# Approve alert
curl -X POST http://localhost:3001/alerts/alerts/pred-id/approve \
  -H "Content-Type: application/json" \
  -d '{"obra_id":"obra-test-001"}'
```

---

## 📊 Service Details

### PostgreSQL (Port 5432)

**Credentials:**
- User: `buildly_user`
- Password: `buildly_secure_password_2026`
- Database: `buildly_db`

**Access:**
```bash
# Command line
docker-compose exec postgres psql -U buildly_user -d buildly_db

# PgAdmin UI: http://localhost:5050
# Email: admin@buildly.local
# Password: admin
```

**Tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Redis (Port 6379)

**Credentials:**
- Password: `buildly_redis_2026`

**Access:**
```bash
# Command line
docker-compose exec redis redis-cli

# Redis Commander UI: http://localhost:8081
```

**Cache Keys:**
```
delays:obra-123:7    -- Predictions for obra-123 (7-day forecast)
feedback:pred-id-1   -- Feedback tracking
patterns:*           -- Model pattern weights
```

### Brain ML Engine (Port 3002)

**Environment:**
- `NODE_ENV`: development
- `LOG_LEVEL`: debug
- `REDIS_URL`: redis://:password@redis:6379/0

**Endpoints:**
- `GET /ml/health` — Health check
- `GET /ml/predict/delays` — Material predictions
- `POST /ml/predict/delays/feedback` — Feedback recording

**Logs:**
```bash
docker-compose logs -f brain-ml
```

### Core API (Port 3001)

**Environment:**
- `NODE_ENV`: development
- `BRAIN_ML_URL`: http://brain-ml:3002
- `REDIS_URL`: redis://:password@redis:6379/1

**Endpoints:**
- `GET /health` — Health check
- `GET /alerts/obras/:obra_id/delay-alerts` — Fetch alerts
- `POST /alerts/:id/approve` — Approve alert
- `POST /alerts/:id/reject` — Reject alert

**Logs:**
```bash
docker-compose logs -f core-api
```

---

## 📝 Environment Configuration

### Default .env

```bash
# Brain ML
BRAIN_ML_URL=http://brain-ml:3002
BRAIN_API_TOKEN=  # Leave empty for internal access

# Database
PG_HOST=postgres
PG_PORT=5432
PG_DATABASE=buildly_db
PG_USER=buildly_user
PG_PASSWORD=buildly_secure_password_2026

# Redis
REDIS_URL=redis://:buildly_redis_2026@redis:6379/0

# Node
NODE_ENV=development
LOG_LEVEL=debug
PORT=3001
```

### Production Override (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=info
PG_PASSWORD=<secure-password-from-vault>
REDIS_URL=redis://:...@redis-cluster:6379
BRAIN_API_TOKEN=<jwt-token>
```

---

## 🧪 Test Data Population

### Load Historical Data

```bash
# Connect to database
docker-compose exec postgres psql -U buildly_user -d buildly_db

# Run migration
\i /docker-entrypoint-initdb.d/V011__load_test_data.sql

# Verify
SELECT COUNT(*) FROM material_pedidos_historico;
# Expected: >= 1000 rows
```

### Create Test Obra

```bash
INSERT INTO obras (id, nome, cliente, localizacao, status) 
VALUES ('obra-test-001', 'Teste SP', 'Cliente A', 'São Paulo', 'ativa');

INSERT INTO material_pedidos_historico (obra_id, material_id, material_nome, data_pedido, data_realizada)
VALUES 
  ('obra-test-001', 'mat-cimento', 'Cimento CP II', '2026-06-01', '2026-06-09'),
  ('obra-test-001', 'mat-aco', 'Aço CA-50', '2026-06-05', '2026-06-08'),
  ('obra-test-001', 'mat-areia', 'Areia média', '2026-06-10', '2026-06-15');
```

---

## 🛠️ Common Operations

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f brain-ml
docker-compose logs -f core-api

# Last 100 lines
docker-compose logs --tail=100 brain-ml
```

### Restart Services

```bash
# Single service
docker-compose restart brain-ml

# All services
docker-compose restart

# Force rebuild
docker-compose up --build -d
```

### Clear Cache

```bash
# Redis flush
docker-compose exec redis redis-cli FLUSHDB

# Or specific keys
docker-compose exec redis redis-cli DEL "delays:*"
```

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U buildly_user buildly_db > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U buildly_user buildly_db
```

---

## 🚨 Troubleshooting

### Brain ML Won't Start

**Error:** `connection refused` to PostgreSQL

**Solution:**
```bash
# Check database is healthy
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Rebuild Brain
docker-compose up --build brain-ml
```

### High Memory Usage

**Symptom:** Docker consuming 2GB+ RAM

**Solution:**
```bash
# Reduce Redis memory
docker-compose exec redis redis-cli CONFIG SET maxmemory 256mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Clear old cache
docker-compose exec redis redis-cli FLUSHDB
```

### Database Migration Errors

**Error:** `duplicate key value violates unique constraint`

**Solution:**
```bash
# Reset database
docker-compose down -v postgres
docker-compose up postgres

# Re-run migrations
docker-compose logs postgres
```

### Port Already in Use

**Error:** `port 5432 already allocated`

**Solution:**
```bash
# Find process using port
lsof -i :5432

# Or use different port in docker-compose.yml
# Change: ports: ["5432:5432"] to ["5433:5432"]
```

---

## 📊 Monitoring

### Docker Stats

```bash
docker stats buildly-postgres buildly-redis buildly-brain-ml buildly-core-api
```

### Application Metrics

```bash
# Brain predictions per hour
curl http://localhost:3002/ml/metrics | grep predictions_total

# Core API requests per hour
curl http://localhost:3001/metrics | grep http_requests_total
```

---

## 🔐 Security Checklist

### Development → Production

- [ ] Change PostgreSQL password in `.env.production`
- [ ] Change Redis password
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS for Core API
- [ ] Setup RLS (Row Level Security) in PostgreSQL
- [ ] Configure firewall rules (only expose :3001)
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Enable audit logging
- [ ] Configure backups

---

## 📈 Performance Tuning

### PostgreSQL

```sql
-- Increase shared buffers
ALTER SYSTEM SET shared_buffers = '256MB';

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;

-- Effective cache size
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Apply changes
SELECT pg_reload_conf();
```

### Redis

```bash
docker-compose exec redis redis-cli CONFIG SET timeout 300
docker-compose exec redis redis-cli CONFIG SET tcp-backlog 511
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
```

---

## 🚀 Next Steps

1. **Deploy to Staging** (AWS/Azure/GCP)
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Setup CI/CD** (GitHub Actions)
   - Build on push to main
   - Deploy to staging on PR
   - Deploy to production on merge

3. **Configure Monitoring** (Prometheus + Grafana)
   - Track latency, errors, throughput
   - Alert on anomalies

4. **Load Test** (k6/JMeter)
   - 1000 concurrent users
   - 100 predictions/sec target
   - <500ms P95 latency

---

**Status:** Ready for Deployment  
**Next Milestone:** Pilot Validation (Phase 4.3)

