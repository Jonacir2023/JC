# 🚀 Buildly Premium — Deployment Guide

**Version:** 1.0.0  
**Last Updated:** 2026-07-26

---

## 📍 Environments

| Environment | Purpose | Database | Scaling |
|-------------|---------|----------|---------|
| **Development** | Local development | Docker/local | Single machine |
| **Staging** | Pre-production testing | Cloud (Supabase) | Small cluster |
| **Production** | Live (gestores + companies) | Cloud (Supabase) | Auto-scaling |

---

## 🔄 Deployment Pipeline

### Step 1: Code Push to GitHub
```bash
git checkout -b feature/my-feature
# ... make changes ...
git push -u origin feature/my-feature
```

### Step 2: CI Pipeline Runs Automatically
- Lint & Format
- Build
- Tests (Unit + E2E)
- Security Scan
- Docker Build

### Step 3: Create Pull Request
Fill in PR template, request review

### Step 4: Merge to Main
Once approved:
```bash
# Merge to main via GitHub
# CI automatically deploys to staging
```

### Step 5: Manual Production Deployment
```bash
# Tag and release
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3

# Monitor GitHub Actions for deployment
```

---

## 🏭 Environment Configuration

### Development
```bash
NODE_ENV=development
API_PORT=3001
PG_HOST=localhost
JWT_SECRET=dev-secret-key
```

### Staging
```bash
NODE_ENV=staging
PG_HOST=buildly-staging-db.supabase.co
DATABASE_SSL=true
JWT_SECRET=${STAGING_JWT_SECRET}  # From GitHub Secrets
```

### Production
```bash
NODE_ENV=production
PG_HOST=buildly-prod-db.supabase.co
DATABASE_SSL=true
JWT_SECRET=${PROD_JWT_SECRET}     # From GitHub Secrets
LOG_LEVEL=info
CORS_ORIGIN=https://buildly.company
```

---

## 🐳 Docker & Container Registry

### Building Images
```bash
# Local build
docker build -t buildly-premium:dev .

# Push to registry
docker tag buildly-premium:dev ghcr.io/your-org/buildly-premium:latest
docker push ghcr.io/your-org/buildly-premium:latest
```

---

## 🗄️ Database Migrations

### Development
```bash
pnpm db:migrate
```

### Staging/Production
```bash
# Using Supabase CLI
supabase migrations push --project-ref <project_id> --password <password>
```

---

## 🔐 Secrets Management

### GitHub Secrets Setup
Go to GitHub → Settings → Secrets → Actions

Add:
```
STAGING_DB_PASSWORD
STAGING_JWT_SECRET
PROD_DB_PASSWORD
PROD_JWT_SECRET
SENTRY_DSN
DOCKER_REGISTRY_TOKEN
```

---

## 📊 Monitoring

### Sentry (Error Tracking)
```bash
SENTRY_DSN=https://key@sentry.io/project_id
```

### Prometheus & Grafana
- Access: http://localhost:3000
- Credentials: admin/admin

---

## 🔄 Zero-Downtime Deployment

Uses rolling update strategy:
1. New pod starts with new version
2. Health checks verify it's ready
3. Traffic gradually shifts
4. Old pod drains requests
5. Old pod terminated
6. Repeat until all pods updated

**Result:** Zero downtime ✅

---

## 🚨 Rollback Procedures

### Quick Rollback
```bash
# Revert recent merge
git revert <commit-hash>
git push origin main

# GitHub Actions auto-deploys previous version
```

### Database Rollback
```bash
# In Supabase dashboard:
# Project Settings → Migrations → Mark as failed
```

---

## ✅ Pre-Deployment Checklist

**Before staging:**
- [ ] All tests pass: `pnpm test`
- [ ] No lint errors: `pnpm lint`
- [ ] Database migrations tested
- [ ] Environment variables in GitHub Secrets
- [ ] PR approved

**Before production:**
- [ ] Staging deployment successful (24 hours)
- [ ] No critical issues in staging
- [ ] Release notes prepared
- [ ] On-call engineer ready

---

**Buildly Premium Deployment — Deploy with Confidence 🚀**
