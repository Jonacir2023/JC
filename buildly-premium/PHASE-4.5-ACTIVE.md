# 🎯 Phase 4.5 — Active Phase (Weeks 4-5)

**Phase:** 4.5 (Pilot Validation - Live Decision Making)  
**Duration:** 2 weeks (Week 4-5)  
**Status:** 🟢 Ready to Execute After Phase 4.4 Go/No-Go  
**Branch:** `claude/serene-einstein-em23qs`  
**Previous Phase:** Phase 4.4 (Soft Launch) must reach Go/No-Go approval

---

## 🎯 Phase Objective

**Gestores take control** — shift from observation to live approval decisions. System records all feedback, learns from outcomes, calculates ROI per prevented delay. Real value generation begins.

**Key Transition:**
- Week 2-3: Gestores **observe** (no decisions)
- Week 4-5: Gestores **decide** (approve/reject alerts) ← **You are here**
- Week 6: Analyze results & Go/No-Go enterprise rollout

---

## 📅 Week 4-5 Timeline

### Week 4 (Monday-Friday) — Approval Workflow Activation

#### Day 1 (Monday) — Approval System Go-Live

```bash
# 1. Verify Phase 4.4 passed Go/No-Go
./scripts/infrastructure.sh pilot-soft-launch-report

# 2. Activate approval decision workflow
./scripts/infrastructure.sh enable-approval-workflow

# 3. Update pilot sites to "active_phase"
docker compose exec -T postgres psql -U buildly_user -d buildly_db << SQL
  UPDATE pilot_sites 
  SET phase = 'active_phase',
      approval_workflow_enabled = true
  WHERE id IN (1,2,3,4,5);
SQL

# 4. Initialize approval tracking table
./scripts/infrastructure.sh pilot-init-decisions

# 5. Notify gestores: System is ready for decisions
# Email: All 5 gestores
# Subject: Buildly Brain — Fase Ativa Iniciada (Aprove Alertas)
```

**Deliverable:** Approval workflow live, gestores can accept/reject predictions, all decisions logged to pilot_active_feedback table.

---

#### Days 2-5 (Tuesday-Friday) — Active Decision-Making

**Gestors Daily Activities:**

1. **Review Daily Predictions** (6:00 AM delivery)
   - 5-8 predictions per site in inbox
   - Severity flags (CRITICAL/HIGH/MEDIUM/LOW)
   - Historical accuracy context

2. **Make Approval Decisions**
   - ✅ Approve: "This delay is likely, act on it"
   - ❌ Reject: "This prediction is wrong for my site"
   - 💬 Comment: Add context (external factors, reasons)

3. **Track Actual Outcomes**
   - Did predicted delay actually occur?
   - How many days late did material arrive?
   - What was actual cost impact?
   - System records everything

**Expected Decision Volume:**
- Total predictions/week: ~250-350 across 5 sites
- Approval rate target: 60-80% (rest are rejected as false positives)
- Decision time: ~2 minutes per prediction

**System Recording:**

```sql
-- pilot_active_feedback table captures every decision
INSERT INTO pilot_active_feedback (
  prediction_id,
  site_id,
  gestor_decision,        -- 'approved'|'rejected'
  gestor_confidence,      -- 0-1 (how sure are they?)
  gestor_comment,         -- free-form reasoning
  external_factors,       -- "rain", "strike", "customs", etc
  actual_delay_occurred,  -- true|false (after outcome known)
  actual_delay_days,      -- numeric (when outcome is known)
  prevented_cost_brl,     -- if approved & prevented delay
  decision_timestamp,
  feedback_timestamp      -- when actual outcome confirmed
)
```

---

### Week 5 (Monday-Thursday) — Outcome Tracking & Model Learning

#### Days 1-3 (Monday-Wednesday) — Continued Active Phase

**Same decision workflow as Week 4** with accumulated feedback now reaching 500+ decisions.

**Parallel Activity: Model Retraining**

Every evening, system analyzes decisions:
- Which predictions were right/wrong?
- Gestor confidence vs actual accuracy
- Patterns in external factors
- Recalibrate model weights

```bash
# Automated nightly (8 PM)
./scripts/infrastructure.sh pilot-retrain-model

# Output:
# Model Retraining Summary (Week 4-5)
# ===================================
# Predictions evaluated: 287
# Approved: 195 (68%)
# Rejected: 92 (32%)
# 
# Accuracy (Approved vs Actual):
#   True Positive (predicted + occurred): 165 (85%)
#   False Positive (predicted + didn't occur): 30 (15%)
#   Precision: 85%
#   Recall: 92%
#
# Model Performance:
#   Baseline (Week 1): Confidence 0.72
#   After Week 4: Confidence 0.76 (+4%)
#   After Week 5: Confidence 0.79 (+7% total)
#
# Top Learning Signals:
#   - External factor "strikes" reduced model confidence by 20%
#   - Rio site delays avg 2 days longer (location-specific pattern detected)
#   - Maquinário (machinery) predictions improved 12%
#
# Model Updated: Ready for Week 6 validation
```

---

#### Day 4 (Thursday) — ROI Calculation & Impact Review

**Calculate ROI for each prevented delay:**

```bash
# Generate ROI report
./scripts/infrastructure.sh pilot-roi-report

# Expected output:
# Week 4-5 ROI Analysis
# ====================
# Total Cost Exposure (all predictions): R$ 58-61M
# Prevented Cost (approved + actual delay): R$ 8.2-9.5M
# False Cost (approved but no delay occurred): R$ 1.2-1.8M
# Net Savings: R$ 6.4-7.7M
# 
# Per-Site Breakdown:
# São Paulo (Camargo): R$ 1.4M prevented / R$ 0.3M false = R$ 1.1M net
# Belo Horizonte (Odebrecht): R$ 0.8M prevented / R$ 0.2M false = R$ 0.6M net
# Rio (Queiroz): R$ 2.1M prevented / R$ 0.5M false = R$ 1.6M net
# Brasília (governo): R$ 1.9M prevented / R$ 0.4M false = R$ 1.5M net
# Manaus (SUFRAMA): R$ 1.0M prevented / R$ 0.3M false = R$ 0.7M net
# 
# ROI per Prevented Delay:
# Average: R$ 42,700 per delayed material prevented
# Target was: R$ 20,000
# RESULT: ✅ EXCEEDED BY 114%
#
# Gestor Engagement:
# São Paulo: 85% approval rate (consistent with pattern)
# Belo Horizonte: 72% approval rate
# Rio: 78% approval rate
# Brasília: 81% approval rate
# Manaus: 64% approval rate (due to sparse data, as expected)
```

**Gestor Feedback Summary:**

| Site | Approval Rate | Key Feedback | Issue Resolution |
|---|---|---|---|
| São Paulo | 85% | Predictions very accurate for Vidro | None - excellent |
| Belo Horizonte | 72% | Some false positives on Aço | Adjust confidence threshold |
| Rio | 78% | External factors (port delays) not captured | Add port status API |
| Brasília | 81% | Government bureaucratic delays hard to predict | Create separate model |
| Manaus | 64% | Limited data, but accurate on high-cost items | Accept limitations |

---

### Week 5 (Friday) — Final Validation Checkpoint

**Interim Decision Checklist:**

```
✅ Decision Workflow
  - [ ] All 5 gestores actively approving/rejecting
  - [ ] Feedback logged 100% of decisions
  - [ ] Comment rate > 50% (showing engagement)
  - [ ] No blocking issues

✅ Model Performance
  - [ ] Precision ≥ 75% (target: ≥ 75%)
  - [ ] Recall ≥ 70% (target: ≥ 70%)
  - [ ] Model confidence improved vs baseline
  - [ ] External factors identified

✅ Business Value
  - [ ] ROI ≥ R$ 20k per prevented delay
  - [ ] No major false positives causing problems
  - [ ] Gestores trust the system
  - [ ] Cost savings documented

✅ System Health
  - [ ] 99.5% uptime maintained
  - [ ] Approval latency < 100ms (P95)
  - [ ] Feedback ingestion lag < 30 minutes
  - [ ] No data corruption

→ All checks passing? Proceed to Phase 4.6 (Week 6 Analysis & Go/No-Go)
```

---

## 🔧 Technical Implementation

### 1. Approval Workflow System

**File:** `supabase/migrations/V013__init_approval_workflow.sql`

```sql
-- Decision approval workflow
CREATE TABLE pilot_active_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES pilot_baseline_predictions(id),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  
  -- Gestor Decision
  gestor_decision VARCHAR(20) NOT NULL,  -- 'approved'|'rejected'
  gestor_confidence NUMERIC(3,2),         -- 0.0-1.0 (how sure is gestor?)
  gestor_comment TEXT,                    -- reasoning
  external_factors TEXT,                  -- "strikes", "weather", "customs", etc
  
  -- Actual Outcome (filled after delay window closes)
  actual_delay_occurred BOOLEAN,
  actual_delay_days INTEGER,
  prevented_cost_brl NUMERIC(15,2),      -- R$ saved if predicted & acted on
  
  -- ROI Calculation
  decision_value NUMERIC(15,2),          -- cost if wrong vs right
  roi_factor NUMERIC(3,2),               -- multiplier for ROI calc
  
  -- Audit
  decision_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  feedback_timestamp TIMESTAMP,           -- when outcome confirmed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_active_feedback_site ON pilot_active_feedback(site_id);
CREATE INDEX idx_active_feedback_decision ON pilot_active_feedback(gestor_decision);

-- View: ROI summary
CREATE OR REPLACE VIEW v_active_roi_summary AS
SELECT
  ps.site_name,
  COUNT(paf.id) as decisions_made,
  SUM(CASE WHEN paf.gestor_decision = 'approved' THEN 1 ELSE 0 END) as approved_count,
  ROUND(AVG(CASE WHEN paf.gestor_decision = 'approved' THEN paf.gestor_confidence ELSE NULL END)::NUMERIC, 3) as avg_gestor_confidence,
  SUM(paf.prevented_cost_brl) as total_prevented_cost,
  ROUND(SUM(paf.prevented_cost_brl) / NULLIF(COUNT(paf.id), 0), 0) as avg_roi_per_decision,
  ROUND((SUM(CASE WHEN paf.actual_delay_occurred THEN 1 ELSE 0 END)::NUMERIC / 
          NULLIF(COUNT(paf.id), 0) * 100)::NUMERIC, 1) as accuracy_rate
FROM pilot_sites ps
LEFT JOIN pilot_active_feedback paf ON ps.id = paf.site_id
  AND DATE(paf.decision_timestamp) >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY ps.id, ps.site_name
ORDER BY total_prevented_cost DESC;
```

---

### 2. Decision Recording Script

**File:** `scripts/record-decision.ts`

```typescript
/**
 * API endpoint for gestores to submit approval decisions
 * POST /api/decisions/submit
 * 
 * Request body:
 * {
 *   prediction_id: UUID,
 *   site_id: UUID,
 *   decision: 'approved'|'rejected',
 *   confidence: 0.0-1.0,
 *   comment: string,
 *   external_factors: string[]
 * }
 * 
 * Response:
 * {
 *   decision_id: UUID,
 *   recorded_at: ISO 8601,
 *   status: 'recorded'
 * }
 */

import { Router } from 'express';
import { db } from '../infrastructure/database';

const router = Router();

router.post('/api/decisions/submit', async (req, res) => {
  const { prediction_id, site_id, decision, confidence, comment, external_factors } = req.body;

  try {
    // Validate inputs
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    if (confidence < 0 || confidence > 1) {
      return res.status(400).json({ error: 'Confidence must be 0-1' });
    }

    // Record decision
    const result = await db.query(
      `INSERT INTO pilot_active_feedback 
       (prediction_id, site_id, gestor_decision, gestor_confidence, gestor_comment, external_factors, decision_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, decision_timestamp`,
      [prediction_id, site_id, decision, confidence, comment, JSON.stringify(external_factors)]
    );

    // Emit event for model training
    await emitEvent('DECISION_RECORDED', {
      decision_id: result.rows[0].id,
      prediction_id,
      site_id,
      decision,
      confidence,
    });

    res.status(201).json({
      decision_id: result.rows[0].id,
      recorded_at: result.rows[0].decision_timestamp,
      status: 'recorded'
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
```

---

### 3. Model Retraining Pipeline

**File:** `scripts/retrain-model-nightly.ts`

```typescript
/**
 * Nightly model retraining based on gestors' decisions
 * Runs every day at 8 PM via cron
 * 
 * Process:
 * 1. Fetch all decisions from last 24 hours
 * 2. Calculate accuracy (approved predictions vs actual outcomes)
 * 3. Retrain EMA model with new decision weights
 * 4. Update confidence scores for next day's predictions
 * 5. Log improvements/regressions
 */

async function retrainModel(): Promise<void> {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Starting nightly model retraining...`);

  try {
    // 1. Fetch yesterday's decisions
    const decisions = await db.query(`
      SELECT 
        paf.id,
        paf.prediction_id,
        paf.site_id,
        paf.gestor_decision,
        paf.gestor_confidence,
        pbp.confidence as model_confidence,
        pbp.predicted_delay_days,
        paf.actual_delay_occurred,
        paf.actual_delay_days
      FROM pilot_active_feedback paf
      JOIN pilot_baseline_predictions pbp ON paf.prediction_id = pbp.id
      WHERE DATE(paf.decision_timestamp) = CURRENT_DATE - INTERVAL '1 day'
    `);

    // 2. Calculate model accuracy
    const approved = decisions.rows.filter((d: any) => d.gestor_decision === 'approved');
    const truePositives = approved.filter((d: any) => d.actual_delay_occurred).length;
    const falsePositives = approved.filter((d: any) => !d.actual_delay_occurred).length;
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / decisions.rows.length || 0;

    console.log(`Accuracy - Precision: ${(precision * 100).toFixed(1)}% | Recall: ${(recall * 100).toFixed(1)}%`);

    // 3. Adjust model weights
    const adjustmentFactor = (precision + recall) / 2; // Average accuracy
    const newConfidenceAdjustment = 1 + (adjustmentFactor - 0.75) * 0.1; // ±10% based on accuracy

    // 4. Update predictions for tomorrow
    await db.query(`
      UPDATE pilot_baseline_predictions
      SET confidence = confidence * $1
      WHERE created_at > NOW() - INTERVAL '1 day'
        AND created_at < NOW()
    `, [newConfidenceAdjustment]);

    console.log(`Model retraining complete. Confidence adjustment: ${(newConfidenceAdjustment * 100).toFixed(1)}%`);

  } catch (error) {
    console.error(`Model retraining failed: ${(error as Error).message}`);
  }
}

// Schedule: 8 PM daily via cron
// 0 20 * * * cd /path/to/buildly && npx ts-node scripts/retrain-model-nightly.ts
```

---

## 📊 Deliverables (Week 4-5)

By end of Week 5 Friday, you'll have:

| Deliverable | Format | Data Points |
|---|---|---|
| **Decision Logs** | Database table | 500+ decisions |
| **Approval History** | CSV/JSON export | Decision rate, confidence, outcomes |
| **Model Improvements** | Performance report | Baseline vs Week 5 confidence |
| **ROI Analysis** | Dashboard + report | Cost prevented, per-site breakdown |
| **Feedback Summary** | Markdown document | Gestor comments, external factors |
| **Interim Validation** | Go/No-Go checkpoint | Ready for Phase 4.6? |

---

## 🚀 Success Criteria (Decision Gate)

**To PROCEED to Phase 4.6 (Analysis & Enterprise Go/No-Go):**

✅ **Decision Quality:**
- Precision ≥ 75%
- Recall ≥ 70%
- False positives acceptable

✅ **ROI Achievement:**
- ≥ R$ 20k per prevented delay
- Total cost savings quantifiable
- Gestores see business value

✅ **Model Learning:**
- Confidence improved 5-10% vs baseline
- External factors identified
- Gestors trust the predictions

✅ **System & Engagement:**
- Uptime ≥ 99.5%
- All 5 gestores actively deciding (>60% approval rate each)
- Minimal issues/complaints

---

## ⚠️ Failure Modes & Escalation

| Scenario | Action |
|---|---|
| **ROI < R$ 15k** | 🟡 CONDITIONAL GO — Need external factor analysis |
| **Precision < 70%** | 🔴 NO-GO — Model needs retraining, pause active phase |
| **Gestor disengagement** | 🟡 REVIEW — Conduct feedback session, adjust workflow |
| **System availability < 99%** | 🔴 NO-GO — Fix infrastructure before continuing |

---

## 📅 Immediate Pre-Work (Before Week 4 Starts)

- [ ] Deploy V013 migration (approval workflow table)
- [ ] Implement `/api/decisions/submit` endpoint
- [ ] Schedule nightly model retraining cron job
- [ ] Create ROI dashboard view
- [ ] Send "Active Phase Begins" email to all gestores
- [ ] Verify database capacity for 500+ feedback records

**Total Prep Time:** 6-8 hours  
**Start Before:** End of Phase 4.4 Week 3 (Friday)

---

**Status:** 🟡 Awaiting Phase 4.4 Go/No-Go Decision to Activate

**Next Phase:** Phase 4.6 (Week 6 — Analysis & Enterprise Rollout)
