-- V012: Initialize Soft Launch Observation Infrastructure
-- Phase 4.4 Week 2-3: Silent observation tracking tables and metrics views
-- Created: 2026-07-26

BEGIN;

-- ============================================
-- Soft Launch Observation Table
-- ============================================
-- Records daily prediction metrics and accuracy measurements
-- during the observation-only phase (Week 2-3)

CREATE TABLE IF NOT EXISTS pilot_soft_launch_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL,

  -- Daily Prediction Metrics
  predictions_generated INT DEFAULT 0 NOT NULL,              -- Count of predictions created today
  avg_confidence_score NUMERIC(3,2),                         -- Average confidence (0.00-1.00)
  critical_count INT DEFAULT 0 NOT NULL,                    -- Number of CRITICAL severity
  high_count INT DEFAULT 0 NOT NULL,                        -- Number of HIGH severity
  medium_count INT DEFAULT 0 NOT NULL,                      -- Number of MEDIUM severity
  low_count INT DEFAULT 0 NOT NULL,                         -- Number of LOW severity

  -- Accuracy Metrics (tracking prediction vs. actual)
  actual_delays_observed INT DEFAULT 0 NOT NULL,           -- Count of delays that actually occurred
  true_positives INT DEFAULT 0 NOT NULL,                   -- Predicted delay, delay occurred ✓
  false_positives INT DEFAULT 0 NOT NULL,                  -- Predicted delay, no delay occurred ✗
  true_negatives INT DEFAULT 0 NOT NULL,                   -- Predicted on-time, was on-time ✓
  false_negatives INT DEFAULT 0 NOT NULL,                  -- Predicted on-time, delay occurred ✗

  -- Calculated Rates (computed at end of day)
  false_positive_rate NUMERIC(5,2),                        -- FP / (FP + TP) × 100
  false_negative_rate NUMERIC(5,2),                        -- FN / (FN + TN) × 100
  precision_rate NUMERIC(5,2),                             -- TP / (TP + FP) × 100 (reliability)
  recall_rate NUMERIC(5,2),                                -- TP / (TP + FN) × 100 (coverage)

  -- System Health Metrics
  prediction_pipeline_latency_ms INT,                      -- Avg milliseconds to generate predictions
  system_uptime_percent NUMERIC(5,2),                      -- Percentage of time system was operational
  cache_hit_rate NUMERIC(5,2),                             -- Percentage of requests served from cache

  -- Cost Impact
  total_cost_exposure_brl NUMERIC(15,2) DEFAULT 0,        -- Sum of all predicted cost impacts (R$)
  prevented_cost_brl NUMERIC(15,2) DEFAULT 0,             -- Estimated cost if prediction prevented delay (R$)

  -- Gestor Feedback & Issues (optional, filled during observation)
  gestor_notes TEXT,                                       -- Free-form notes from gestor
  issues_reported TEXT,                                    -- Any issues encountered
  system_issues TEXT,                                      -- System-side issues detected

  -- Audit Trail
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),           -- When this record was created
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),            -- When this record was last updated

  -- Constraints
  CONSTRAINT unique_observation UNIQUE(site_id, observation_date),
  CONSTRAINT valid_counts CHECK (
    predictions_generated >= 0 AND
    critical_count >= 0 AND high_count >= 0 AND
    medium_count >= 0 AND low_count >= 0
  ),
  CONSTRAINT valid_accuracy CHECK (
    true_positives >= 0 AND false_positives >= 0 AND
    true_negatives >= 0 AND false_negatives >= 0
  )
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_soft_launch_obs_date
  ON pilot_soft_launch_observations(observation_date DESC);

CREATE INDEX IF NOT EXISTS idx_soft_launch_obs_site
  ON pilot_soft_launch_observations(site_id, observation_date DESC);

CREATE INDEX IF NOT EXISTS idx_soft_launch_obs_fp_rate
  ON pilot_soft_launch_observations(false_positive_rate DESC)
  WHERE observation_date >= CURRENT_DATE - INTERVAL '14 days';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON pilot_soft_launch_observations TO buildly_user;

-- ============================================
-- Daily Aggregate Metrics View
-- ============================================
-- Real-time view of soft launch performance across all sites

CREATE OR REPLACE VIEW v_soft_launch_daily_aggregate AS
SELECT
  DATE(recorded_at) as observation_date,
  COUNT(DISTINCT site_id) as sites_observed,
  SUM(predictions_generated) as total_predictions,
  ROUND(AVG(avg_confidence_score)::NUMERIC, 4) as avg_confidence_overall,
  SUM(critical_count) as total_critical,
  SUM(high_count) as total_high,
  SUM(false_positives) as total_fp,
  SUM(true_positives) as total_tp,
  ROUND((SUM(false_positives)::NUMERIC / NULLIF(SUM(false_positives) + SUM(true_positives), 0) * 100)::NUMERIC, 2) as fp_rate_overall,
  ROUND((SUM(true_positives)::NUMERIC / NULLIF(SUM(true_positives) + SUM(false_negatives), 0) * 100)::NUMERIC, 2) as recall_rate_overall,
  ROUND(AVG(system_uptime_percent)::NUMERIC, 2) as avg_uptime,
  ROUND(AVG(cache_hit_rate)::NUMERIC, 2) as avg_cache_hit,
  ROUND(AVG(prediction_pipeline_latency_ms)::NUMERIC, 0) as avg_latency_ms,
  ROUND(SUM(total_cost_exposure_brl) / 1000000, 2) as total_cost_exposure_m
FROM pilot_soft_launch_observations
GROUP BY DATE(recorded_at)
ORDER BY observation_date DESC;

GRANT SELECT ON v_soft_launch_daily_aggregate TO buildly_user;

-- ============================================
-- Per-Site Weekly Trend View
-- ============================================
-- Track per-site performance over the 2-week observation window

CREATE OR REPLACE VIEW v_soft_launch_weekly_trends AS
SELECT
  site_id,
  (DATE_TRUNC('week', observation_date))::DATE as week_start,
  COUNT(*) as days_observed,
  SUM(predictions_generated) as week_predictions,
  ROUND(AVG(avg_confidence_score)::NUMERIC, 4) as avg_confidence,
  ROUND((SUM(false_positives)::NUMERIC / NULLIF(SUM(false_positives) + SUM(true_positives), 0) * 100)::NUMERIC, 2) as week_fp_rate,
  ROUND(AVG(system_uptime_percent)::NUMERIC, 2) as avg_uptime,
  ROUND(SUM(total_cost_exposure_brl) / 1000000, 2) as week_cost_exposure_m
FROM pilot_soft_launch_observations
GROUP BY site_id, DATE_TRUNC('week', observation_date)
ORDER BY site_id, week_start DESC;

GRANT SELECT ON v_soft_launch_weekly_trends TO buildly_user;

-- ============================================
-- Soft Launch Status Summary View
-- ============================================
-- Quick status check for go/no-go decision

CREATE OR REPLACE VIEW v_soft_launch_status AS
SELECT
  ps.site_name,
  COUNT(DISTINCT pso.observation_date) as days_observed,
  ROUND(AVG(pso.avg_confidence_score)::NUMERIC, 4) as avg_confidence,
  ROUND((SUM(pso.false_positives)::NUMERIC / NULLIF(SUM(pso.false_positives) + SUM(pso.true_positives), 0) * 100)::NUMERIC, 2) as fp_rate,
  ROUND(AVG(pso.system_uptime_percent)::NUMERIC, 2) as avg_uptime,
  ROUND(AVG(pso.prediction_pipeline_latency_ms)::NUMERIC, 0) as avg_latency_ms,
  MAX(pso.observation_date) as last_observation,
  CASE
    WHEN ROUND((SUM(pso.false_positives)::NUMERIC / NULLIF(SUM(pso.false_positives) + SUM(pso.true_positives), 0) * 100)::NUMERIC, 2) > 12 THEN 'NO-GO'
    WHEN ROUND(AVG(pso.system_uptime_percent)::NUMERIC, 2) < 99 THEN 'NO-GO'
    WHEN ROUND(AVG(pso.avg_confidence_score)::NUMERIC, 4) < 0.65 THEN 'NO-GO'
    WHEN ROUND((SUM(pso.false_positives)::NUMERIC / NULLIF(SUM(pso.false_positives) + SUM(pso.true_positives), 0) * 100)::NUMERIC, 2) > 10 THEN 'CONDITIONAL GO'
    ELSE 'GO'
  END as go_no_go_status
FROM pilot_sites ps
LEFT JOIN pilot_soft_launch_observations pso ON ps.id = pso.site_id
  AND pso.observation_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY ps.id, ps.site_name
ORDER BY go_no_go_status DESC, avg_uptime DESC;

GRANT SELECT ON v_soft_launch_status TO buildly_user;

-- ============================================
-- Initialize Observation Records
-- ============================================
-- Pre-populate 14 days of observation records for each of 5 sites
-- This ensures tracking starts immediately when enabled

INSERT INTO pilot_soft_launch_observations (site_id, observation_date, recorded_at)
SELECT
  ps.id,
  CURRENT_DATE + INTERVAL '1 day' * (n::integer),
  NOW()
FROM pilot_sites ps
CROSS JOIN generate_series(0, 13) AS t(n)
ON CONFLICT (site_id, observation_date) DO NOTHING;

-- ============================================
-- Audit Table Enhancement
-- ============================================
-- Add soft launch activation event to audit log

INSERT INTO pilot_audit_log (event_type, event_data, created_at)
VALUES (
  'SOFT_LAUNCH_SCHEMA_INITIALIZED',
  jsonb_build_object(
    'migration', 'V012',
    'tables_created', 1,
    'views_created', 3,
    'observation_records_initialized', 70,
    'timestamp', NOW()
  ),
  NOW()
)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- Post-Migration Verification
-- ============================================
-- SQL to verify:
-- SELECT COUNT(*) as observation_records FROM pilot_soft_launch_observations;
-- SELECT * FROM v_soft_launch_status;
-- SELECT * FROM v_soft_launch_daily_aggregate;
