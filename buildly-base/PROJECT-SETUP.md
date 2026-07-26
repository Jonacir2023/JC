# 🚀 Buildly Premium — Detailed Setup Guide

**Version:** 1.0.0  
**Duration:** 20-30 minutes (first time)

---

## Prerequisites

```bash
node --version          # ≥ 18.0.0
pnpm --version         # ≥ 8.0.0
docker --version       # ≥ 20.10
docker-compose --version  # ≥ 2.0
```

---

## Step 1: Clone and Install

```bash
git clone https://github.com/your-org/buildly-premium.git
cd buildly-premium

# Install dependencies (monorepo)
pnpm install:all

# Verify installation
pnpm build
```

---

## Step 2: Environment Configuration

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your settings
# Critical variables:
# - NODE_ENV=development
# - JWT_SECRET=your_secret_min_32_chars (generate: openssl rand -base64 32)

# IMPORTANT: Never commit .env to git
echo ".env" >> .gitignore
```

---

## Step 3: Docker Infrastructure

```bash
# Start all services (PostgreSQL, Neo4j, Redis, Qdrant, APIs)
pnpm start

# Wait for services to be healthy
sleep 30

# Verify all services are running
pnpm health
```

Expected health check output:
```
✅ PostgreSQL (postgres:5432)
✅ Neo4j (neo4j:7687)
✅ Redis (redis:6379)
✅ Qdrant (qdrant:6333)
✅ Core API (http://localhost:3001/health)
✅ Brain ML (http://localhost:3002/health)
✅ Decision API (http://localhost:3003/health)
✅ NATS (nats:4222)
```

---

## Step 4: Database Migrations

```bash
# Run migrations
pnpm db:migrate

# Verify schema
docker-compose exec postgres psql -U buildly_user -d buildly_db -c "\dt"
```

---

## Step 5: Test API Connectivity

```bash
# Core API
curl http://localhost:3001/health

# Brain ML Engine
curl http://localhost:3002/ml/health

# Decision API
curl http://localhost:3003/health
```

---

## Step 6: Run Tests

```bash
pnpm test              # Unit tests
pnpm test:coverage     # With coverage
pnpm test:e2e         # E2E tests (requires all services)
```

---

## Step 7: Start Development

```bash
# Terminal 1: Watch and rebuild on changes
pnpm dev
```

Access:
- API: http://localhost:3001
- GraphQL: http://localhost:3001/graphql
- Monitoring: http://localhost:3000 (Grafana)

---

## Troubleshooting

### Container won't start
```bash
docker-compose logs postgres
pnpm restart
```

### Database migration fails
```bash
pnpm db:reset
pnpm db:migrate
```

### Port already in use
```bash
lsof -i :3001
kill -9 <PID>
```

---

**Buildly Premium Setup — You're Ready! 🚀**
