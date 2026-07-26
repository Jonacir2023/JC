-- V013: Initialize Approval Workflow Infrastructure
-- Phase 4.3 (Weeks 4-5): Gestores make binding decisions on predictions
-- Created: 2026-07-26

BEGIN;

-- ============================================
-- Prediction Approval Decision Table
-- ============================================
-- Records when gestores approve or reject predictions
-- This is the input data for model retraining

CREATE TABLE IF NOT EXISTS pilot_approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id) ON DELETE CASCADE,
  prediction_id UUID,                                  -- Reference to original prediction
  prediction_date DATE NOT NULL,
  material_category VARCHAR(100) NOT NULL,
  predicted_delay_days INT NOT NULL,
  predicted_confidence NUMERIC(3,2) NOT NULL,         -- 0.00-1.00
  predicted_severity VARCHAR(50) NOT NULL,            -- CRITICAL|HIGH|MEDIUM|LOW

  -- Gestor Decision
  gestor_id VARCHAR(255) NOT NULL,                    -- Email or name of gestor
  decision VARCHAR(20) NOT NULL,                      -- APPROVED|REJECTED|DEFERRED
  decision_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  decision_notes TEXT,                                -- Why they approved/rejected

  -- Actual Outcome (filled 7+ days later)
  actual_delay_occurred BOOLEAN,                      -- Did delay actually happen?
  actual_delay_days INT,                              -- How many days late (0 if on-time)
  outcome_recorded_at TIMESTAMP,                      -- When we verified the outcome

  -- Decision Impact Analysis (computed after outcome known)
  was_correct_decision BOOLEAN,                       -- Did approval prevent delay or reject false alarm?
  cost_impact_prevented_brl NUMERIC(15,2),            -- R$ saved by this decision
  cost_impact_if_wrong_brl NUMERIC(15,2),             -- R$ cost if decision was wrong
  learning_value NUMERIC(5,2),                        -- Score 0-100 for model training (1=no value, 100=critical learning)

  -- Audit Trail
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_decision CHECK (decision IN ('APPROVED', 'REJECTED', 'DEFERRED')),
  CONSTRAINT valid_severity CHECK (predicted_severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  CONSTRAINT valid_confidence CHECK (predicted_confidence >= 0 AND predicted_confidence <= 1)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_approval_site
  ON pilot_approval_decisions(site_id, decision_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_approval_decision
  ON pilot_approval_decisions(decision, decision_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_approval_outcome
  ON pilot_approval_decisions(actual_delay_occurred, outcome_recorded_at DESC)
  WHERE outcome_recorded_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_approval_learning
  ON pilot_approval_decisions(learning_value DESC)
  WHERE actual_delay_occurred IS NOT NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON pilot_approval_decisions TO buildly_user;

-- ============================================
-- Model Retraining Log Table
-- ============================================
-- Tracks when models are retrained and with which decision samples

CREATE TABLE IF NOT EXISTS pilot_model_retraining_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retraining_date DATE NOT NULL,
  retraining_time TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Training Data
  training_samples_count INT NOT NULL,               -- Number of decisions used
  approved_decisions_count INT NOT NULL,             -- Count of APPROVED decisions
  rejected_decisions_count INT NOT NULL,             -- Count of REJECTED decisions

  -- Model Performance After Retrain
  precision_before NUMERIC(5,4),                     -- Precision before retraining
  precision_after NUMERIC(5,4),                      -- Precision after retraining
  recall_before NUMERIC(5,4),                        -- Recall before retraining
  recall_after NUMERIC(5,4),                         -- Recall after retraining
  f1_before NUMERIC(5,4),                            -- F1 before retraining
  f1_after NUMERIC(5,4),                             -- F1 after retraining

  -- Decision Gate
  retraining_status VARCHAR(50) NOT NULL,            -- COMPLETED|FAILED|PARTIAL
  improvement_percentage NUMERIC(5,2),               -- Percentage improvement in F1 score

  -- Metadata
  retraining_notes TEXT,                             -- Notes about retraining (issues, insights)
  next_scheduled_retraining DATE,                    -- When to retrain again

  CONSTRAINT valid_status CHECK (retraining_status IN ('COMPLETED', 'FAILED', 'PARTIAL'))
);

CREATE INDEX IF NOT EXISTS idx_retraining_date
  ON pilot_model_retraining_log(retraining_date DESC);

GRANT SELECT, INSERT, UPDATE ON pilot_model_retraining_log TO buildly_user;

-- ============================================
-- Per-Material Decision Performance View
-- ============================================
-- Track accuracy improvement by material category

CREATE OR REPLACE VIEW v_approval_material_performance AS
SELECT
  pad.material_category,
  COUNT(*) as total_decisions,
  SUM(CASE WHEN pad.decision = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN pad.decision = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
  SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END) as correct_decisions,
  ROUND(
    (SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END)::NUMERIC /
     NULLIF(COUNT(*), 0)) * 100,
    2
  ) as accuracy_percent,
  ROUND(
    SUM(COALESCE(pad.cost_impact_prevented_brl, 0)) / 1000000,
    2
  ) as cost_prevented_m_brl,
  ROUND(AVG(pad.learning_value), 1) as avg_learning_value
FROM pilot_approval_decisions pad
WHERE pad.actual_delay_occurred IS NOT NULL
GROUP BY pad.material_category
ORDER BY accuracy_percent DESC;

GRANT SELECT ON v_approval_material_performance TO buildly_user;

-- ============================================
-- Gestor Decision Quality View
-- ============================================
-- Track individual gestor decision patterns

CREATE OR REPLACE VIEW v_approval_gestor_quality AS
SELECT
  pad.gestor_id,
  ps.site_name,
  COUNT(*) as total_decisions,
  SUM(CASE WHEN pad.decision = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN pad.decision = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
  SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END) as correct_decisions,
  ROUND(
    (SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END)::NUMERIC /
     NULLIF(COUNT(*), 0)) * 100,
    2
  ) as accuracy_percent,
  ROUND(AVG(pad.learning_value), 1) as avg_learning_value,
  MAX(pad.decision_timestamp) as last_decision
FROM pilot_approval_decisions pad
JOIN pilot_sites ps ON pad.site_id = ps.id
WHERE pad.actual_delay_occurred IS NOT NULL
GROUP BY pad.gestor_id, ps.id, ps.site_name
ORDER BY accuracy_percent DESC;

GRANT SELECT ON v_approval_gestor_quality TO buildly_user;

-- ============================================
-- Weekly Decision Impact Summary
-- ============================================
-- Track cumulative ROI and decision quality per week

CREATE OR REPLACE VIEW v_approval_weekly_summary AS
SELECT
  ps.site_name,
  (DATE_TRUNC('week', pad.decision_timestamp))::DATE as week_start,
  COUNT(*) as decisions_made,
  SUM(CASE WHEN pad.decision = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN pad.decision = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
  ROUND(
    (SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END)::NUMERIC /
     NULLIF(COUNT(*), 0)) * 100,
    2
  ) as accuracy_percent,
  ROUND(
    SUM(COALESCE(pad.cost_impact_prevented_brl, 0)) / 1000000,
    2
  ) as cost_prevented_m_brl,
  ROUND(AVG(pad.predicted_confidence), 4) as avg_confidence_used
FROM pilot_approval_decisions pad
JOIN pilot_sites ps ON pad.site_id = ps.id
WHERE pad.actual_delay_occurred IS NOT NULL
GROUP BY ps.id, ps.site_name, DATE_TRUNC('week', pad.decision_timestamp)
ORDER BY week_start DESC, accuracy_percent DESC;

GRANT SELECT ON v_approval_weekly_summary TO buildly_user;

-- ============================================
-- Active Phase Go/No-Go Decision View
-- ============================================
-- Determines readiness to proceed to Phase 4.6 (Week 6 Analysis)

CREATE OR REPLACE VIEW v_approval_go_no_go_status AS
SELECT
  ps.site_name,
  COUNT(DISTINCT DATE(pad.decision_timestamp)) as decision_days,
  COUNT(*) as total_decisions,
  ROUND(
    (SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END)::NUMERIC /
     NULLIF(COUNT(*), 0)) * 100,
    2
  ) as accuracy_percent,
  ROUND(
    SUM(COALESCE(pad.cost_impact_prevented_brl, 0)) / 1000000,
    2
  ) as total_cost_prevented_m,
  CASE
    WHEN ROUND(
      (SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END)::NUMERIC /
       NULLIF(COUNT(*), 0)) * 100,
      2
    ) >= 75 AND COUNT(*) >= 30 THEN 'GO'
    WHEN ROUND(
      (SUM(CASE WHEN pad.was_correct_decision = TRUE THEN 1 ELSE 0 END)::NUMERIC /
       NULLIF(COUNT(*), 0)) * 100,
      2
    ) >= 70 AND COUNT(*) >= 20 THEN 'CONDITIONAL GO'
    ELSE 'NO-GO'
  END as phase_4_6_readiness
FROM pilot_approval_decisions pad
JOIN pilot_sites ps ON pad.site_id = ps.id
WHERE pad.actual_delay_occurred IS NOT NULL
  AND pad.decision_timestamp >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY ps.id, ps.site_name
ORDER BY accuracy_percent DESC;

GRANT SELECT ON v_approval_go_no_go_status TO buildly_user;

-- ============================================
-- Audit Entry
-- ============================================

INSERT INTO pilot_audit_log (event_type, event_data, created_at)
VALUES (
  'APPROVAL_WORKFLOW_SCHEMA_INITIALIZED',
  jsonb_build_object(
    'migration', 'V013',
    'tables_created', 2,
    'views_created', 4,
    'description', 'Approval workflow for Phase 4.3 (gestores make binding decisions)',
    'timestamp', NOW()
  ),
  NOW()
);

COMMIT;

-- ============================================
-- Post-Migration Verification
-- ============================================
-- SQL to verify:
-- SELECT COUNT(*) FROM pilot_approval_decisions;
-- SELECT * FROM v_approval_go_no_go_status;
-- SELECT * FROM v_approval_material_performance;
-- SELECT * FROM v_approval_gestor_quality;
