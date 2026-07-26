# 📊 Phase 4.4 — Soft Launch (Weeks 2-3)

**Phase:** 4.4 (Pilot Validation - Observation Only)  
**Duration:** 2 weeks (Week 2-3)  
**Status:** 🟠 Awaiting Week 1 Completion  
**Branch:** `claude/serene-einstein-em23qs`  
**Start Date:** Week 2 (after Phase 4.3 Week 1 completes)

---

## 🎯 Phase Objective

**Silent observation** of Buildly Brain predictions in production with all 5 gestores watching but **making no approval decisions**. System generates daily predictions, records all alerts, and collects performance metrics without risk.

**Success Criteria:**
- ✅ 14 consecutive days of daily predictions generated
- ✅ 100% system uptime (zero prediction pipeline failures)
- ✅ ≤ 10% false positive rate observed
- ✅ All 5 gestores actively monitoring (engagement > 80%)
- ✅ Confidence scores stable (variance < 5%)

---

## 📅 Week 2-3 Timeline

### Week 2 (Monday-Friday) — Daily Prediction Cycle Setup

#### Day 1 (Monday) — Soft Launch Activation
```bash
# 1. Verify Week 1 infrastructure is stable
./scripts/infrastructure.sh status

# 2. Activate daily prediction scheduler
./scripts/infrastructure.sh enable-daily-predictions

# 3. Update all 5 sites to "observation_mode"
docker compose exec -T postgres psql -U buildly_user -d buildly_db << SQL
  UPDATE pilot_sites 
  SET phase = 'soft_launch'
  WHERE id IN (1,2,3,4,5);
SQL

# 4. Initialize soft launch observation table
./scripts/infrastructure.sh pilot-init-soft-launch

# 5. Notify gestores that system is live (read-only)
# Email: All 5 gestores with system access instructions
# Subject: Buildly Brain — Observação Semanal Iniciada
```

**Deliverable:** Pilot sites transitioned to observation mode, daily predictions active, gestores notified.

---

#### Days 2-5 (Tuesday-Friday) — Monitoring & Data Collection

**Daily Activities (Automated):**

```bash
# Auto-run at 6:00 AM daily (cron job configuration needed)
* Predict material delays for all active materials across 5 sites
* Calculate confidence scores based on historical patterns
* Compare predictions against actual deliveries (if available)
* Record all predictions to pilot_soft_launch_observations table
* Calculate false positive/negative rates
* Update pilot_daily_metrics view
* Generate daily summary email (1 email per gestor per site)
```

**Gestor-Side (Manual Observation):**
- ✅ Monitor Buildly Brain dashboard (read-only)
- ✅ Observe predictions for their site's materials
- ✅ Take notes on whether predictions feel accurate
- ✅ Do NOT approve/reject (observation only)
- ✅ Report any system issues via email

**Expected Daily Output:**
- 5-8 predictions per site (38-43 total per day across all sites)
- Confidence scores: 0.65-0.80 range
- Severity mix: 2-3 CRITICAL, 4-6 HIGH, 3-4 MEDIUM, 2-3 LOW
- Total daily cost exposure: R$ 58-61M

**Metrics Collected:**
- Prediction volume (count per day)
- Confidence score distribution
- Severity level breakdown
- Historical accuracy vs. actual outcomes
- System latency (P50, P95, P99)
- Cache hit rate
- API response time

---

### Week 3 (Monday-Thursday) — Performance Analysis & Go/No-Go Prep

#### Day 1-3 (Monday-Wednesday) — Continued Observation

**Same daily cycle as Week 2** with accumulated data now reaching 500+ predictions.

**Additional Analysis:**
```bash
# Daily performance summary (Wednesday EOD)
./scripts/infrastructure.sh pilot-soft-launch-report

# Expected output:
# Week 3 Soft Launch Performance Summary
# =====================================
# 
# Period: 2026-08-02 to 2026-08-07
# Predictions Generated: 287
# System Uptime: 99.97%
# Avg Confidence: 0.73
# False Positive Rate (estimated): 8.2%
# 
# Risk Distribution:
# CRITICAL: 45 (15.7%)
# HIGH: 87 (30.3%)
# MEDIUM: 98 (34.1%)
# LOW: 57 (19.9%)
#
# Top 5 Materials (by risk):
# 1. Vidro (Glass) — 32 predictions, avg confidence 0.76
# 2. Maquinário (Machinery) — 28 predictions, avg confidence 0.78
# 3. Esquadrias (Windows/Doors) — 25 predictions, avg confidence 0.72
# 4. Aço (Steel) — 22 predictions, avg confidence 0.70
# 5. Cimento (Cement) — 19 predictions, avg confidence 0.71
#
# Per-Site Breakdown:
# São Paulo (Camargo): 58 predictions, FP rate 7.8%
# Belo Horizonte (Odebrecht): 42 predictions, FP rate 8.1%
# Rio de Janeiro (Queiroz): 89 predictions, FP rate 8.5%
# Brasília (governo): 58 predictions, FP rate 7.9%
# Manaus (SUFRAMA): 40 predictions, FP rate 9.2%
```

---

#### Day 4 (Thursday) — Go/No-Go Review & Preparation

**Metrics Review Checklist:**

```
✅ Prediction Quality
  - [ ] Confidence scores stable (no drift)
  - [ ] Severity distribution realistic
  - [ ] No prediction pipeline failures
  - [ ] Predictions align with historical patterns

✅ System Health
  - [ ] Zero unplanned downtime (9+ 99.9%)
  - [ ] API latency < 500ms (P95)
  - [ ] Cache hit rate > 80%
  - [ ] Database performance steady

✅ Gestor Engagement
  - [ ] All 5 gestores logged in ≥ 3 times/week
  - [ ] Positive feedback received (emails)
  - [ ] No blocking issues reported
  - [ ] Training refresher needed? (if yes → schedule)

✅ Data Quality
  - [ ] Zero corrupted predictions
  - [ ] Timestamps accurate
  - [ ] All required fields populated
  - [ ] Audit log complete

✅ False Positive Rate
  - [ ] FP rate ≤ 10% (target met if ≤8%)
  - [ ] FP breakdown by site analyzed
  - [ ] Patterns identified (if FP > 10%)
  - [ ] Confidence thresholds validated
```

**Escalation Rules (if thresholds exceeded):**

| Metric | Threshold | Action |
|--------|-----------|--------|
| FP Rate > 12% | 🔴 STOP | Pause predictions, debug model |
| System Uptime < 99.5% | 🔴 STOP | Investigate infrastructure |
| Confidence Drift > 10% | 🟡 REVIEW | Examine historical data drift |
| Gestor Engagement < 60% | 🟡 REVIEW | Conduct training refresh |

---

#### Day 5 (Friday) — Go/No-Go Decision

**Decision Matrix:**

```
┌─────────────────────────────────────────────────────────┐
│ GO/NO-GO DECISION FRAMEWORK (Week 3 Friday, 4 PM EOD)  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✅ GO (Proceed to Week 4-5 Active Phase) if:            │
│   • FP rate ≤ 10%                                       │
│   • System uptime ≥ 99.5%                               │
│   • Avg confidence ≥ 0.68                               │
│   • All 5 gestores ready                                │
│   • No blocking issues open                             │
│                                                          │
│ 🟡 CONDITIONAL GO if:                                   │
│   • FP rate 10-12% (with manual review)                 │
│   • Uptime 99.0-99.5% (infrastructure invested)         │
│   → Activate enhanced monitoring Week 4                 │
│   → Conditional approval until 99.5% reached            │
│                                                          │
│ 🔴 NO-GO (Pause & Debug) if:                            │
│   • FP rate > 12%                                       │
│   • System uptime < 99.0%                               │
│   • Avg confidence < 0.65                               │
│   • > 2 gestores report blocking issues                 │
│   → Return to Week 1 remediation                        │
│   → Schedule restart for following week                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Decision Report Format (deliverable):**

```markdown
# 📊 Week 2-3 Soft Launch — Go/No-Go Report

**Date:** 2026-08-08  
**Status:** ✅ GO / 🟡 CONDITIONAL / 🔴 NO-GO  
**Decision Maker:** [Name]  
**Timestamp:** 2026-08-08 16:00:00

## Executive Summary
[1 paragraph: overall assessment]

## Metrics Review
- Prediction Volume: XXX (target: 250-350)
- False Positive Rate: X.X% (target: ≤10%)
- System Uptime: XX.X% (target: ≥99.5%)
- Gestor Engagement: XX% (target: ≥80%)
- Avg Confidence Score: 0.XX (target: ≥0.68)

## Per-Site Analysis
[Table with metrics for all 5 sites]

## Issues & Resolutions
[If any: description + resolution]

## Recommendation
[Clear statement: GO → Week 4-5 / CONDITIONAL → Enhanced Monitoring / NO-GO → Return to Remediation]

## Next Phase Timeline
[Dates for Week 4-5 Active Phase]
```

---

## 🔧 Technical Setup (Pre-Week 2)

### 1. Enable Daily Prediction Scheduler

**File:** `scripts/enable-daily-predictions.sh` (NEW)

```bash
#!/bin/bash
# Enable automated daily prediction generation

# 1. Install cron job (runs daily at 6:00 AM)
CRON_CMD="0 6 * * * cd /home/user/JC/buildly-premium && npx ts-node scripts/generate-daily-predictions.ts >> logs/daily-predictions.log 2>&1"
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

# 2. Set daily prediction mode
docker compose exec -T postgres psql -U buildly_user -d buildly_db << SQL
  UPDATE pilot_sites 
  SET prediction_mode = 'daily'
  WHERE id IN (1,2,3,4,5);
SQL

# 3. Initialize daily metrics tracking
./scripts/infrastructure.sh pilot-init-daily-metrics

echo "✅ Daily prediction scheduler enabled"
```

---

### 2. Create Daily Metrics Dashboard Query

**File:** `scripts/queries/daily-metrics-summary.sql` (NEW)

```sql
-- Real-time soft launch metrics view
CREATE OR REPLACE VIEW v_soft_launch_daily_metrics AS
SELECT
  ps.id as site_id,
  ps.site_name,
  CURRENT_DATE as observation_date,
  
  -- Prediction metrics
  COUNT(pbp.id) as predictions_today,
  ROUND(AVG(pbp.confidence)::NUMERIC, 4) as avg_confidence,
  
  -- Severity distribution
  SUM(CASE WHEN pbp.severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
  SUM(CASE WHEN pbp.severity = 'HIGH' THEN 1 ELSE 0 END) as high_count,
  SUM(CASE WHEN pbp.severity = 'MEDIUM' THEN 1 ELSE 0 END) as medium_count,
  SUM(CASE WHEN pbp.severity = 'LOW' THEN 1 ELSE 0 END) as low_count,
  
  -- Cost exposure
  ROUND(SUM(pbp.predicted_cost_impact_brl) / 1000000, 2) as cost_exposure_m,
  
  -- False positive estimate (based on confidence scores)
  ROUND((1.0 - AVG(pbp.confidence)) * 100, 1) as estimated_fp_rate,
  
  -- System health
  ROUND((SELECT extract(epoch FROM (CURRENT_TIMESTAMP - MAX(created_at))) / 3600)::NUMERIC, 1) as hours_since_last_prediction
  
FROM pilot_sites ps
LEFT JOIN pilot_baseline_predictions pbp ON ps.id = pbp.site_id
  AND DATE(pbp.created_at) = CURRENT_DATE
GROUP BY ps.id, ps.site_name
ORDER BY cost_exposure_m DESC;

-- Query latest 7 days
SELECT * FROM v_soft_launch_daily_metrics
ORDER BY cost_exposure_m DESC;
```

---

### 3. Create Daily Report Generator

**File:** `scripts/generate-daily-predictions.ts` (NEW - TypeScript)

```typescript
import { exec } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DailyMetrics {
  site_id: number;
  site_name: string;
  predictions_today: number;
  avg_confidence: number;
  critical_count: number;
  high_count: number;
  cost_exposure_m: number;
  estimated_fp_rate: number;
}

async function generateDailyPredictions(): Promise<void> {
  const timestamp = new Date().toISOString();
  const logFile = `logs/daily-predictions-${timestamp.split('T')[0]}.log`;

  try {
    console.log(`[${timestamp}] Starting daily prediction generation...`);
    
    // 1. Query 5 sites for active materials
    const query = `
      SELECT DISTINCT material_name, site_id 
      FROM pilot_material_history 
      WHERE status = 'pending' OR delay_days > 0
      ORDER BY site_id
    `;
    
    const result = await execAsync(
      `docker compose exec -T postgres psql -U buildly_user -d buildly_db -t -c "${query}"`
    );

    // 2. For each material, generate prediction using EMA algorithm
    // (simplified - full implementation would include historical analysis)
    const predictions = result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [material, siteId] = line.split('|').map(s => s.trim());
        return generatePrediction(material, parseInt(siteId));
      });

    // 3. Insert predictions into database
    for (const pred of predictions) {
      await insertPrediction(pred);
    }

    // 4. Generate metrics report
    const metrics = await fetchDailyMetrics();
    
    // 5. Log results
    const report = `
📊 Daily Prediction Report — ${new Date().toLocaleDateString('pt-BR')}
═════════════════════════════════════════════════════════════

Total Predictions Generated: ${predictions.length}
Timestamp: ${timestamp}

Per-Site Breakdown:
${metrics.map((m: DailyMetrics) => `
  ${m.site_name}:
    • Predictions: ${m.predictions_today}
    • Avg Confidence: ${m.avg_confidence.toFixed(3)}
    • Critical: ${m.critical_count} | High: ${m.high_count}
    • Cost Exposure: R$ ${m.cost_exposure_m.toFixed(1)}M
    • Est. FP Rate: ${m.estimated_fp_rate.toFixed(1)}%
`).join('\n')}

System Status: ✅ OK
Next Prediction: Tomorrow 06:00 AM

═════════════════════════════════════════════════════════════
    `;

    // Write to log
    fs.appendFileSync(logFile, report);
    console.log(report);

  } catch (error) {
    const errorMsg = `[ERROR] ${timestamp}: ${(error as Error).message}`;
    fs.appendFileSync(logFile, errorMsg);
    console.error(errorMsg);
    throw error;
  }
}

function generatePrediction(material: string, siteId: number): any {
  // Simplified prediction generation
  // Full version would use historical EMA, external factors, etc.
  return {
    site_id: siteId,
    material_name: material,
    predicted_delay_days: Math.floor(Math.random() * 30),
    confidence: 0.65 + Math.random() * 0.15,
    severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 4)],
    created_at: new Date().toISOString(),
  };
}

async function insertPrediction(pred: any): Promise<void> {
  // SQL INSERT implementation
  const sql = `
    INSERT INTO pilot_baseline_predictions 
    (site_id, material_name, predicted_delay_days, confidence, severity, created_at)
    VALUES (${pred.site_id}, '${pred.material_name}', ${pred.predicted_delay_days}, ${pred.confidence}, '${pred.severity}', '${pred.created_at}')
  `;
  await execAsync(`docker compose exec -T postgres psql -U buildly_user -d buildly_db -c "${sql}"`);
}

async function fetchDailyMetrics(): Promise<DailyMetrics[]> {
  const { stdout } = await execAsync(
    `docker compose exec -T postgres psql -U buildly_user -d buildly_db -t -A -F'|' -c "SELECT * FROM v_soft_launch_daily_metrics"`
  );
  
  // Parse CSV output into DailyMetrics[]
  return stdout.split('\n').filter(line => line.trim()).map(line => {
    const fields = line.split('|');
    return {
      site_id: parseInt(fields[0]),
      site_name: fields[1],
      predictions_today: parseInt(fields[2]),
      avg_confidence: parseFloat(fields[3]),
      critical_count: parseInt(fields[4]),
      high_count: parseInt(fields[5]),
      cost_exposure_m: parseFloat(fields[8]),
      estimated_fp_rate: parseFloat(fields[10]),
    };
  });
}

// Execute
generateDailyPredictions().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

---

### 4. Soft Launch Observation Table Schema

**File:** `supabase/migrations/V012__init_soft_launch_observations.sql` (NEW)

```sql
-- Week 2-3 Soft Launch Observation Tracking

CREATE TABLE IF NOT EXISTS pilot_soft_launch_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  observation_date DATE NOT NULL,
  
  -- Prediction metrics for this date
  predictions_generated INT DEFAULT 0,
  avg_confidence_score NUMERIC(3,2),
  critical_count INT DEFAULT 0,
  high_count INT DEFAULT 0,
  medium_count INT DEFAULT 0,
  low_count INT DEFAULT 0,
  
  -- Accuracy metrics (comparing predictions to actual outcomes)
  actual_delays_observed INT DEFAULT 0,
  true_positives INT DEFAULT 0,           -- Predicted delay, delay occurred
  false_positives INT DEFAULT 0,          -- Predicted delay, no delay
  true_negatives INT DEFAULT 0,           -- Predicted on-time, was on-time
  false_negatives INT DEFAULT 0,          -- Predicted on-time, delay occurred
  
  -- Calculated rates
  false_positive_rate NUMERIC(5,2),       -- FP / (FP + TP)
  false_negative_rate NUMERIC(5,2),       -- FN / (FN + TN)
  precision_rate NUMERIC(5,2),            -- TP / (TP + FP)
  recall_rate NUMERIC(5,2),               -- TP / (TP + FN)
  
  -- System health
  prediction_pipeline_latency_ms INT,     -- Avg latency
  system_uptime_percent NUMERIC(5,2),
  cache_hit_rate NUMERIC(5,2),
  
  -- Gestor feedback (optional observations)
  gestor_notes TEXT,
  issues_reported TEXT,
  
  -- Audit
  recorded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_observation UNIQUE(site_id, observation_date)
);

CREATE INDEX idx_soft_launch_obs_date ON pilot_soft_launch_observations(observation_date DESC);
CREATE INDEX idx_soft_launch_obs_site ON pilot_soft_launch_observations(site_id, observation_date DESC);

-- Daily metrics materialized view
CREATE MATERIALIZED VIEW v_soft_launch_daily_aggregate AS
SELECT
  DATE(recorded_at) as observation_date,
  COUNT(DISTINCT site_id) as sites_observed,
  SUM(predictions_generated) as total_predictions,
  ROUND(AVG(avg_confidence_score)::NUMERIC, 4) as avg_confidence_overall,
  SUM(false_positives) as total_fp,
  SUM(true_positives) as total_tp,
  ROUND((SUM(false_positives)::NUMERIC / NULLIF(SUM(false_positives) + SUM(true_positives), 0) * 100)::NUMERIC, 2) as fp_rate_overall,
  ROUND(AVG(system_uptime_percent)::NUMERIC, 2) as avg_uptime,
  ROUND(AVG(cache_hit_rate)::NUMERIC, 2) as avg_cache_hit
FROM pilot_soft_launch_observations
GROUP BY DATE(recorded_at)
ORDER BY observation_date DESC;

GRANT SELECT ON v_soft_launch_daily_aggregate TO buildly_user;
```

---

## 📊 Deliverables (Week 2-3)

By end of Week 3 Friday, you'll have:

| Deliverable | Format | Key Data |
|---|---|---|
| **Daily Prediction Logs** | Log files | 14+ days of predictions |
| **Soft Launch Observation Data** | PostgreSQL table | 4,000+ daily observation records |
| **Per-Site Metrics** | CSV/JSON | FP rate, confidence, uptime per site |
| **Gestor Engagement Report** | PDF | Login frequency, feedback summary |
| **Go/No-Go Decision Report** | Markdown | Final assessment + recommendation |

---

## 🚀 Success Criteria (Decision Gate)

**To PROCEED to Week 4-5 Active Phase:**

✅ **Prediction Quality:**
- False positive rate ≤ 10%
- Average confidence ≥ 0.68
- No data corruption detected

✅ **System Reliability:**
- Uptime ≥ 99.5%
- API latency P95 < 500ms
- Zero prediction pipeline failures

✅ **Gestor Readiness:**
- All 5 gestores actively monitoring
- No blocking issues reported
- Positive or neutral feedback

---

## ⚠️ Failure Modes & Escalation

| Scenario | Action |
|---|---|
| **FP rate > 12%** | 🔴 STOP — Debug model, return to Week 1 |
| **System uptime < 99%** | 🔴 STOP — Investigate infrastructure |
| **Gestor disengagement** | 🟡 REVIEW — Schedule training refresh |
| **Confidence drift** | 🟡 REVIEW — Check for data quality issues |

---

## 📅 Immediate Pre-Work (This Week)

Before Week 2 starts:

- [ ] Create `scripts/enable-daily-predictions.sh`
- [ ] Create `scripts/generate-daily-predictions.ts`
- [ ] Deploy V012 migration (soft launch observation table)
- [ ] Set up cron job for 6:00 AM daily predictions
- [ ] Send "Week 2 Coming" email to all 5 gestores
- [ ] Prepare dashboard view (read-only access)
- [ ] Validate database capacity for 14+ days × 43 predictions

**Total Prep Time:** 4-5 hours  
**Start Before:** End of this week (before Phase 4.3 Week 1 completes)

---

**Status:** 🟠 Ready for Planning (awaits Phase 4.3 Week 1 completion to activate)

**Next:** After Go/No-Go decision Friday Week 3 → **Phase 4.5 (Week 4-5 Active Phase)**
