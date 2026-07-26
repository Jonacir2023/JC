# 🔧 Buildly Premium — Troubleshooting Guide

**Last Updated:** 2026-07-26

---

## Container & Infrastructure

### Problem: Containers won't start

**Symptoms:** "Connection refused", "Exited with code 1"

**Solution:**
```bash
# Stop everything
pnpm stop
docker-compose down

# Remove stale volumes
docker volume prune -f

# Start fresh
pnpm start
sleep 30
pnpm health
```

### Problem: PostgreSQL health check fails

**Solution:**
```bash
# Check PostgreSQL logs
docker-compose logs postgres | head -50

# Force reset (⚠️ deletes data):
docker volume rm buildly-premium_postgres_data
pnpm restart
pnpm db:migrate
```

### Problem: Neo4j won't start / port 7687 in use

**Solution:**
```bash
lsof -i :7687
kill -9 <PID>

pnpm restart
```

---

## Database & Migrations

### Problem: Migrations fail / "Relation does not exist"

**Solution:**
```bash
# Check migration status
docker-compose exec postgres psql -U buildly_user -d buildly_db \
  -c "SELECT * FROM flyway_schema_history;"

# If no migrations applied:
pnpm db:migrate

# Reset if needed:
docker volume rm buildly-premium_postgres_data
pnpm restart
pnpm db:migrate
```

### Problem: Database query errors / connection pool exhausted

**Solution:**
```bash
# Increase connection pool in .env:
PG_POOL_SIZE=40

# Restart Core API:
docker-compose restart core-api

# Check active connections:
docker-compose exec postgres psql -U buildly_user -d buildly_db \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## API Issues

### Problem: 401 Unauthorized / Invalid token

**Solution:**
```bash
# Get fresh token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@company.com", "password": "password"}'

# Use new token in requests:
curl -H "Authorization: Bearer <NEW_TOKEN>" \
  http://localhost:3001/api/v1/alerts/obras/123

# Regenerate JWT_SECRET if needed:
# 1. Stop API: docker-compose stop core-api
# 2. Generate: openssl rand -base64 32
# 3. Update .env: JWT_SECRET=<new>
# 4. Restart: docker-compose start core-api
```

### Problem: 404 Not Found on valid endpoint

**Solution:**
```bash
# Verify Core API is running:
docker-compose ps core-api

# Test health:
curl http://localhost:3001/health

# View API logs:
docker-compose logs core-api | tail -50

# Verify data exists:
docker-compose exec postgres psql -U buildly_user -d buildly_db \
  -c "SELECT COUNT(*) FROM pilot_sites WHERE id = 'site-sp-01';"
```

### Problem: 429 Too Many Requests

**Solution:**
```bash
# Wait for rate limit window to reset (see Retry-After header)
sleep 60

# Or increase rate limit in .env:
RATE_LIMIT_MAX_REQUESTS=200

# Restart Core API:
docker-compose restart core-api
```

---

## Model & ML Engine

### Problem: Brain ML won't start / port 3002 error

**Solution:**
```bash
# Check Python environment:
docker-compose logs brain-ml | head -20

# Rebuild ML image:
docker-compose down brain-ml
docker-compose build --no-cache brain-ml
docker-compose up -d brain-ml

# Verify health:
curl http://localhost:3002/ml/health
```

### Problem: Predictions not generating / "Model not found"

**Solution:**
```bash
# Check if baseline was generated:
docker-compose exec postgres psql -U buildly_user -d buildly_db \
  -c "SELECT COUNT(*) FROM pilot_baseline_metrics;"

# If 0, generate baseline:
pnpm pilot:generate-baseline

# Check model status:
curl http://localhost:3002/ml/health

# Test prediction:
curl http://localhost:3002/ml/predict/alerts?site_id=site-sp-01
```

---

## Testing Issues

### Problem: Tests fail with "Cannot connect to database"

**Solution:**
```bash
# Ensure services running:
pnpm health

# Run tests with explicit database:
DATABASE_URL=postgres://buildly_user:password@localhost:5432/buildly_db pnpm test

# Clear test database:
pnpm db:reset
pnpm test
```

---

## Performance Issues

### Problem: Slow API responses / "Queries taking 10+ seconds"

**Solution:**
```bash
# Check database query performance:
docker-compose exec postgres psql -U buildly_user -d buildly_db \
  -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Clear Redis cache if stale:
docker-compose exec redis redis-cli FLUSHALL

# Increase connection pool:
PG_POOL_SIZE=30  # in .env
docker-compose restart core-api
```

---

## Debugging Tips

### Enable Debug Logging
```bash
# Set in .env:
LOG_LEVEL=debug
DEBUG=buildly:*

# Restart services:
pnpm restart

# View detailed logs:
docker-compose logs core-api | grep -i debug
```

### Database Inspection
```bash
# Connect to PostgreSQL:
docker-compose exec postgres psql -U buildly_user -d buildly_db

# Common queries:
\dt                    # List tables
SELECT * FROM users;   # Query data
SELECT version();      # PostgreSQL version
```

### Logs by Service
```bash
docker-compose logs postgres
docker-compose logs redis
docker-compose logs neo4j
docker-compose logs core-api
docker-compose logs brain-ml
```

---

**Buildly Premium Troubleshooting — You Got This! 💪**
