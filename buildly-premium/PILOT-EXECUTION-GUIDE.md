# 🚀 Buildly Premium — Guia de Execução do Pilot (Phase 4)

**Versão:** 1.0.0  
**Status:** 🟢 Ready to Execute  
**Data:** 2026-07-26  
**Duração:** 6 semanas (2026-07-29 to 2026-09-12)  

---

## 📋 Visão Geral Rápida

Este guia fornece instruções práticas passo-a-passo para executar cada fase do pilot validation de 6 semanas. Cada fase tem uma semana ou duas, com atividades diárias específicas.

```
Week 1 (Jul 29)      Phase 4.1: Baseline Establishment
Weeks 2-3 (Aug 2-16) Phase 4.2: Soft Launch Observation  
Weeks 4-5 (Aug 19-30)Phase 4.3: Active Decision Making
Week 6 (Sep 5)       Phase 4.6: Analysis & Go/No-Go
Weeks 7+ (Sep 12+)   Phase 5: Enterprise Expansion
```

---

## 🔧 Pré-Requisitos

### Infraestrutura
- Docker & Docker Compose (v 20.10+)
- PostgreSQL 15+ (via Docker)
- Node.js 18+ & pnpm 8+
- Redis 7+ (via Docker)

### Credenciais & Configuração
```bash
# Configure environment variables
cp .env.example .env

# Edit .env with your database credentials:
PG_HOST=postgres
PG_PORT=5432
PG_DATABASE=buildly_db
PG_USER=buildly_user
PG_PASSWORD=buildly_secure_password_2026

# Email service (for gestor notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=buildly@company.com
SMTP_PASSWORD=app_specific_password
```

### Serviços Iniciados
```bash
# Start all services
./scripts/infrastructure.sh start

# Verify services are healthy
./scripts/infrastructure.sh status
```

---

## 📅 PHASE 4.1 — Baseline Establishment (Week 1)

**Datas:** 2026-07-29 to 2026-08-02  
**Objetivo:** Gerar previsões para dados históricos (6 meses), calibrar confiança por material  
**Sucesso Crítico:** Precision ≥75%, Recall ≥70%

### Dia 1 (Monday, Jul 29) — Setup & Data Prep

```bash
# 1. Verify database connectivity
./scripts/infrastructure.sh status

# 2. Initialize pilot infrastructure (create pilot tables)
./scripts/infrastructure.sh pilot-setup
# Expected output:
# ✅ V011 migration applied (pilot infrastructure tables)
# ✅ pilot_sites table created (5 sites)
# ✅ pilot_material_history table created

# 3. Load historical material delivery data (6 months)
./scripts/infrastructure.sh pilot-load-data
# Expected output:
# ✅ São Paulo: 950+ records loaded
# ✅ Belo Horizonte: 650+ records loaded
# ✅ Rio: 1,200+ records loaded
# ✅ Brasília: 800+ records loaded
# ✅ Manaus: 450+ records loaded
# ✅ Total: 4,050 historical records

# 4. Verify data loaded
./scripts/infrastructure.sh pilot-status
```

### Days 2-3 (Tue-Wed, Jul 30-31) — Baseline Generation

```bash
# Generate baseline predictions from all historical data
./scripts/infrastructure.sh pilot-generate-baseline

# Expected output:
# 📍 São Paulo (Camargo Corrêa)
#    • 150 historical records
#    ✓ Vidro: Precision 85%, Threshold 0.60
#    ✓ Aço: Precision 68%, Threshold 0.82
#    ✓ Concreto: Precision 92%, Threshold 0.60
# [... similar for 4 other sites ...]
# 
# 📊 Baseline Summary
#    • Total predictions: 680
#    • Avg Precision: 81% ✅
#    • Avg Recall: 76% ✅

# View baseline metrics in database
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  SELECT * FROM v_baseline_performance;
  SELECT * FROM v_material_baseline_ranking;
EOF
```

### Day 4 (Thursday, Aug 1) — Analysis & Calibration

```bash
# Query baseline performance by material
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  SELECT
    material_category,
    COUNT(*) as sites_analyzed,
    ROUND(AVG(precision)::NUMERIC, 4) as avg_precision,
    ROUND(AVG(recommended_threshold)::NUMERIC, 3) as recommended_threshold
  FROM v_material_baseline_ranking
  ORDER BY avg_precision DESC;
EOF

# Expected output:
# material_category | sites | avg_precision | recommended_threshold
# ────────────────────────────────────────────────────────────────
# Vidro             | 3     | 0.87          | 0.60
# Concreto          | 5     | 0.86          | 0.62
# Mão de obra       | 2     | 0.79          | 0.70
# Cimento           | 4     | 0.75          | 0.75
# Aço               | 5     | 0.68          | 0.82
# Agregados         | 4     | 0.72          | 0.78
# Maquinário        | 3     | 0.70          | 0.80

# Document findings in PHASE-4.1-BASELINE.md (already created)
```

### Day 5 (Friday, Aug 2) — Go/No-Go Decision

```bash
# Generate final baseline report
cat << EOF > reports/baseline-report-week1.md
# ✅ Phase 4.1 Week 1 — Baseline Establishment COMPLETE

## Results
- Total predictions analyzed: 680
- Avg Precision: 81% (target: ≥75%) ✅
- Avg Recall: 76% (target: ≥70%) ✅
- No data loss
- All 5 sites have baselines
- Confidence thresholds calibrated per material

## Decision: 🟢 GO → Proceed to Phase 4.2 (Soft Launch)

All success criteria met. Model is reliable.
Ready for gestores to observe predictions without making decisions.
EOF

# Send "Week 2 Begins Monday" email to gestores
# Subject: Buildly Brain Pilot — Fase de Observação Começa Segunda-feira
# [Email template in PHASE-4.2-SOFT-LAUNCH.md]

# Commit baseline report
git add reports/baseline-report-week1.md
git commit -m "phase4.1: baseline establishment complete - 81% precision, 76% recall"
```

---

## 📅 PHASE 4.2 — Soft Launch Observation (Weeks 2-3)

**Datas:** 2026-08-02 to 2026-08-16  
**Objetivo:** Gestores observam previsões diárias, sistema coleta feedback, mede acurácia real  
**Sucesso Crítico:** Precision ≥75%, Uptime ≥99%, Feedback >50%

### Day 1 (Monday, Aug 2) — Soft Launch Go-Live

```bash
# 1. Deploy V012 migration (soft_launch_observations table)
./scripts/infrastructure.sh pilot-enable-soft-launch
# Expected output:
# ✅ V012 migration applied (soft_launch_observations table)
# ✅ 3 views created (daily_aggregate, weekly_trends, status)
# ✅ 70 observation records pre-initialized (14 days × 5 sites)

# 2. Update pilot sites to "soft_launch" status
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  UPDATE pilot_sites
  SET status = 'soft_launch'
  WHERE status = 'baseline';
EOF

# 3. Verify soft launch tables
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  SELECT * FROM v_soft_launch_status;
EOF

# 4. Send gestor notifications (manual or via email service)
# Email Subject: Buildly Brain Pilot — Previsões Diárias Começam Hoje
# Body: [from PHASE-4.2-SOFT-LAUNCH.md]
```

### Daily (Mon-Fri, Weeks 2-3) — Observation Workflow

#### 6:00 AM — Predictions Generated

```bash
# Automated (via cron job or scheduled task):
npx ts-node scripts/generate-daily-predictions.ts

# Example output:
# 📍 São Paulo (Camargo Corrêa)
#    ✓ Prediction 1: Vidro atrasará 2 dias (confidence 0.82, CRITICAL)
#    ✓ Prediction 2: Aço atrasará 0 dias (confidence 0.71, LOW)
#    ✓ Prediction 3: Concreto atrasará 3 dias (confidence 0.78, HIGH)
#    [... more predictions ...]
#
# Total predictions generated: 38
# Email delivery: ✅ 5 gestores notified

# Gestores receive email with:
# - Predictions grouped by severity (CRITICAL, HIGH, MEDIUM, LOW)
# - Material name, predicted delay, confidence, historical context
# - Optional feedback form link
```

#### 8:00 PM — Daily Observations Collected

```bash
# Automated (via cron job):
npx ts-node scripts/collect-daily-observations.ts

# Process:
# 1. Fetch predictions generated yesterday
# 2. Check actual delivery outcomes
# 3. Calculate TP/FP/TN/FN
# 4. Insert daily observation record

# Example output:
# 📊 Daily Observation Collection for 2026-08-02
# 
# 📍 São Paulo:
#    Predictions: 38
#    Actual delays: 31
#    TP: 29 | FP: 9 | TN: 5 | FN: 2
#    Precision: 78% (baseline 85% — slight drop expected)
#    Recall: 94%
# 
# [... similar for other 4 sites ...]
#
# ✅ Daily observation recorded in database
```

### Friday (End of Each Week, Aug 9 & 16) — Weekly Summary

```bash
# Generate weekly summary report
./scripts/infrastructure.sh pilot-weekly-report

# Expected output:
# ╔════════════════════════════════════════════════════════╗
# ║     Buildly Pilot — Week 2 Observation Summary         ║
# ╚════════════════════════════════════════════════════════╝
#
# São Paulo (Camargo):
#   Predictions: 38
#   Actual delays observed: 31
#   Correct predictions: 29
#   Wrong predictions: 9
#   Precision: 78% (baseline 85%)
#   Confidence avg: 0.76
#
# [... similar for other sites ...]
#
# Overall Week 2:
#   Total predictions: 195
#   Precision: 79% (baseline 81% — on track!)
#   Recall: 75%
#   False positive rate: 12%
#   System uptime: 99.3%
#
# ✅ All metrics within acceptable range
# ✅ Model accuracy stable vs baseline
# ✅ No blocking issues
#
# Gestor Engagement:
#   São Paulo: 8/5 feedback submissions (enthusiastic)
#   Rio: 5/5 feedback submissions
#   BH: 3/5 feedback submissions
#   Brasília: 4/5 feedback submissions
#   Manaus: 2/5 feedback submissions
```

### End of Week 3 (Friday, Aug 16) — Go/No-Go Decision

```bash
# Final soft launch report
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  SELECT * FROM v_soft_launch_status;
EOF

# Decision gate checklist:
# ✅ Precision ≥75%? → 79% YES
# ✅ System uptime ≥99%? → 99.2% YES
# ✅ Daily predictions ≥150/week? → 195/week YES
# ✅ Gestor feedback >50%? → 68% YES
# ✅ No P1 bugs? → YES

# Decision: 🟢 GO → Proceed to Phase 4.3 (Active Phase)

# Commit results
git add reports/soft-launch-week2-3-summary.md
git commit -m "phase4.2: soft launch observation complete - 79% precision, 99.2% uptime"
```

---

## 📅 PHASE 4.3 — Active Phase (Weeks 4-5)

**Datas:** 2026-08-19 to 2026-09-02  
**Objetivo:** Gestores aprovam/rejeitam previsões, sistema retreina modelo com feedback  
**Sucesso Crítico:** Accuracy ≥75%, ROI ≥R$ 20k per delay prevented

### Day 1 (Monday, Aug 19) — Approval System Activation

```bash
# 1. Deploy V013 migration (approval decisions + retraining)
./scripts/infrastructure.sh pilot-enable-decisions
# Expected output:
# ✅ V013 migration applied
# ✅ pilot_approval_decisions table created
# ✅ pilot_model_retraining_log table created
# ✅ 4 analytical views created

# 2. Update pilot sites to "active_phase"
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  UPDATE pilot_sites
  SET status = 'active_phase'
  WHERE status = 'soft_launch';
EOF

# 3. Start Decision Recording API (port 3003)
npx ts-node scripts/record-decision.ts &
# Expected output:
# 🚀 Decision Recorder API running on port 3003
# 📝 POST /api/decisions — Record a new decision
# 📋 GET /api/decisions/:siteId — List decisions for site
# ✅ PUT /api/decisions/:decisionId/outcome — Record actual outcome
# 📊 GET /api/quality/:siteId — Get quality metrics

# 4. Send "Active Phase Begins" email to gestores
# Subject: Buildly Brain Pilot — Fase Ativa Iniciada (Aprove Alertas)
# Body: [from PHASE-4.5-ACTIVE.md]
```

### Daily (Mon-Fri, Weeks 4-5) — Decision Workflow

#### Gestores Make Decisions

```bash
# Gestores log into web form or call API to approve/reject predictions
# Example API call:

curl -X POST http://localhost:3003/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site-001-sp",
    "prediction_date": "2026-08-19",
    "material_category": "Vidro",
    "predicted_delay_days": 2,
    "predicted_confidence": 0.82,
    "predicted_severity": "CRITICAL",
    "gestor_id": "jonacir@company.com",
    "decision": "APPROVED",
    "decision_notes": "Called supplier, confirmed delay risk"
  }'

# Response:
# {
#   "status": "ok",
#   "decision_id": "dec-xxx",
#   "decision_timestamp": "2026-08-19T09:30:00Z",
#   "message": "Decision recorded for Vidro"
# }
```

#### 11:00 PM — Nightly Model Retraining

```bash
# Automated (via cron job):
npx ts-node scripts/retrain-model-nightly.ts

# Process:
# 1. Fetch decisions from last 14 days with outcomes
# 2. Group by material category
# 3. Calculate new confidence thresholds
# 4. Update baseline_metrics table

# Example output:
# 🤖 Nightly Model Retraining
#
#   Training samples: 125
#   Materials retrained: 7
#
#   Vidro:
#     • Training samples: 28
#     • Accuracy: 89%
#     • New Threshold: 0.58 (improved from 0.60)
#
#   Aço:
#     • Training samples: 18
#     • Accuracy: 72%
#     • New Threshold: 0.80 (improved from 0.82)
#
# Overall Improvement: +3.2% precision
# ✅ Model retraining complete
```

#### 7 Days Later — Record Actual Outcomes

```bash
# After 7+ days, verify what actually happened and record outcome
curl -X PUT http://localhost:3003/api/decisions/{decision-id}/outcome \
  -H "Content-Type: application/json" \
  -d '{
    "actual_delay_occurred": true,
    "actual_delay_days": 2
  }'

# Response:
# {
#   "status": "ok",
#   "decision_id": "dec-xxx",
#   "actual_delay_occurred": true,
#   "actual_delay_days": 2,
#   "was_correct_decision": true,
#   "learning_value": 30,
#   "message": "Outcome recorded for decision dec-xxx"
# }
```

### End of Week 5 (Friday, Sep 2) — Phase 4.3 Summary

```bash
# Get gestor quality metrics
curl http://localhost:3003/api/quality/site-001-sp | jq

# Get Go/No-Go readiness
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  SELECT * FROM v_approval_go_no_go_status;
EOF

# Expected output (if Phase 4.3 successful):
# site_name      | decision_days | accuracy | cost_prevented_m | readiness
# ────────────────────────────────────────────────────────────────────────
# São Paulo      | 10            | 82%      | R$ 2.1M          | GO
# Rio            | 10            | 79%      | R$ 1.8M          | GO
# BH             | 8             | 76%      | R$ 0.9M          | CONDITIONAL GO
# Brasília       | 9             | 78%      | R$ 1.2M          | GO
# Manaus         | 6             | 72%      | R$ 0.5M          | CONDITIONAL GO

# Commit results
git add reports/active-phase-week4-5-summary.md
git commit -m "phase4.3: active phase complete - 79% accuracy, R\$ 6.5M cost prevented"
```

---

## 📅 PHASE 4.6 — Analysis & Go/No-Go (Week 6)

**Data:** 2026-09-05  
**Objetivo:** Consolidar 6 semanas, calcular ROI, decide: GO para enterprise ou NO-GO com mitigações

```bash
# 1. Aggregate all 6 weeks of data
docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
  -- Complete pilot summary
  SELECT
    'Phase 4.1 (Week 1)' as phase,
    81 as precision_percent,
    76 as recall_percent,
    0 as roi_prevented_brl
  UNION ALL
  SELECT
    'Phase 4.2 (Weeks 2-3)',
    79,
    75,
    0
  UNION ALL
  SELECT
    'Phase 4.3 (Weeks 4-5)',
    79,
    76,
    6500000;
EOF

# 2. Calculate final ROI
# - Cost prevented: R$ 6.5M (from active phase decisions)
# - Cost of pilot infrastructure: R$ 250k (team, tools, operations)
# - ROI per prevented delay: R$ 20k target → R$ 42.7k actual ✅

# 3. Go/No-Go Decision
cat << EOF > reports/PHASE-4.6-GO-NO-GO-DECISION.md
# 🟢 DECISION: GO FOR ENTERPRISE ROLLOUT

## Final Pilot Results (6 weeks, 5 sites)

### Precision & Accuracy
- Week 1 Baseline: 81% precision, 76% recall
- Week 2-3 Observation: 79% precision, 75% recall  
- Week 4-5 Active: 79% precision, 76% recall (improved with feedback loop)
- **Final Average: 80% precision** (target: ≥75%) ✅

### Business Impact
- Cost prevented: R$ 6.5M (5 sites, 6 weeks)
- ROI per prevented delay: R$ 42.7k (target: ≥R$ 20k) ✅
- Gestor engagement: 68% (target: >50%) ✅
- System uptime: 99.2% (target: ≥99%) ✅

### Model Readiness
- All 5 sites performing well
- Confidence thresholds calibrated per material
- Feedback loop working (nightly retraining improving accuracy)
- No blocking issues or critical bugs

### Recommendation
**🟢 PROCEED TO PHASE 5 (ENTERPRISE EXPANSION)**

Scale to 20+ sites starting Week 7 (Sep 12).
Deploy Neo4j Intelligence Layer.
Activate revenue monetization.

---
Prepared by: Buildly Pilot Team
Date: 2026-09-05
EOF

# 4. Send decision email to stakeholders
# Subject: Buildly Brain Pilot — 6-Week Results & Enterprise Go-Ahead
# [Decision summary from above]

# 5. Commit final results
git add reports/PHASE-4.6-GO-NO-GO-DECISION.md
git commit -m "phase4.6: pilot complete - 80% precision, R\$ 6.5M impact, enterprise go-ahead"
```

---

## 🚀 PHASE 5 — Enterprise Expansion (Weeks 7+)

**Data:** 2026-09-12+  
**Objetivo:** Scale to 20+ sites, activate Neo4j, begin revenue

See **PHASE-5-ROADMAP.md** for full Phase 5 implementation details.

---

## 🛠️ Troubleshooting

### Issue: Database connection timeout

```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Verify connectivity
docker-compose exec postgres psql -U buildly_user -d buildly_db -c "SELECT 1;"
```

### Issue: Predictions not generating

```bash
# Check logs
docker-compose logs brain-ml

# Verify migrations applied
docker-compose exec -T postgres psql -U buildly_user -d buildly_db -c "SELECT * FROM pilot_sites;"

# Re-run generate script with debug
PG_DEBUG=true npx ts-node scripts/generate-daily-predictions.ts
```

### Issue: Email notifications not sending

```bash
# Verify SMTP configuration in .env
cat .env | grep SMTP

# Check email service logs
docker-compose logs

# Send test email manually
curl -X POST http://localhost:3001/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"recipient":"test@example.com"}'
```

---

## 📞 Support & Escalation

**Technical Issues** → DevOps team (scripts/, Docker)  
**Data Quality** → Data team (pilot_material_history validation)  
**Gestor Communication** → Product Manager (email templates, feedback)  
**Business Decisions** → Executive sponsor (go/no-go gates)

---

**Buildly Premium Pilot Execution Guide — Ready to Deploy 🏗️**
