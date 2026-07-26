-- V011B: Initialize Pilot Baseline Metrics Table
-- Phase 4.1 Week 1: Store accuracy baseline measurements

BEGIN;

-- Baseline metrics for each material category per site
CREATE TABLE IF NOT EXISTS pilot_baseline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id) ON DELETE CASCADE,
  material_category VARCHAR(100) NOT NULL,

  -- Historical Analysis
  total_records INTEGER NOT NULL DEFAULT 0,
  delayed_records INTEGER NOT NULL DEFAULT 0,
  delay_rate NUMERIC(5,4),                           -- % of records with delays
  avg_delay_days NUMERIC(8,2),                       -- Average delay in days
  max_delay_days INTEGER,                            -- Worst case delay

  -- Model Performance (Backtest Results)
  precision NUMERIC(5,4),                            -- TP / (TP + FP) — reliability
  recall NUMERIC(5,4),                               -- TP / (TP + FN) — coverage
  f1_score NUMERIC(5,4),                             -- Harmonic mean of precision/recall
  false_positive_rate NUMERIC(5,4),                  -- FP / (FP + TN)
  false_negative_rate NUMERIC(5,4),                  -- FN / (FN + TP)

  -- Calibration
  confidence_threshold NUMERIC(5,4),                 -- Recommended confidence threshold for alerts
  severity_assignment VARCHAR(50),                   -- How to assign severity (LOW/MEDIUM/HIGH/CRITICAL)

  -- Metadata
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_baseline UNIQUE(site_id, material_category)
);

CREATE INDEX idx_baseline_metrics_site ON pilot_baseline_metrics(site_id);
CREATE INDEX idx_baseline_metrics_precision ON pilot_baseline_metrics(precision DESC);
CREATE INDEX idx_baseline_metrics_recall ON pilot_baseline_metrics(recall DESC);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON pilot_baseline_metrics TO buildly_user;

-- ============================================
-- Baseline Performance Summary View
-- ============================================

CREATE OR REPLACE VIEW v_baseline_performance AS
SELECT
  ps.site_name,
  ps.client_name,
  COUNT(DISTINCT pbm.material_category) as categories_analyzed,
  ROUND(AVG(pbm.precision)::NUMERIC, 4) as avg_precision,
  ROUND(AVG(pbm.recall)::NUMERIC, 4) as avg_recall,
  ROUND(AVG(pbm.f1_score)::NUMERIC, 4) as avg_f1,
  ROUND(AVG(pbm.delay_rate)::NUMERIC, 4) as avg_delay_rate,
  SUM(pbm.total_records) as total_historical_records,
  CASE
    WHEN ROUND(AVG(pbm.precision)::NUMERIC, 2) >= 0.75 THEN 'PASS'
    WHEN ROUND(AVG(pbm.precision)::NUMERIC, 2) >= 0.70 THEN 'WARNING'
    ELSE 'FAIL'
  END as baseline_status
FROM pilot_sites ps
LEFT JOIN pilot_baseline_metrics pbm ON ps.id = pbm.site_id
GROUP BY ps.id, ps.site_name, ps.client_name
ORDER BY avg_precision DESC;

GRANT SELECT ON v_baseline_performance TO buildly_user;

-- ============================================
-- Material-Specific Baseline View
-- ============================================

CREATE OR REPLACE VIEW v_material_baseline_ranking AS
SELECT
  pbm.material_category,
  COUNT(DISTINCT pbm.site_id) as sites_analyzed,
  ROUND(AVG(pbm.precision)::NUMERIC, 4) as avg_precision,
  ROUND(AVG(pbm.recall)::NUMERIC, 4) as avg_recall,
  ROUND(AVG(pbm.delay_rate)::NUMERIC, 4) as avg_delay_rate,
  ROUND(AVG(pbm.confidence_threshold)::NUMERIC, 3) as recommended_threshold,
  ROUND(MIN(pbm.precision)::NUMERIC, 4) as min_precision,
  ROUND(MAX(pbm.precision)::NUMERIC, 4) as max_precision
FROM pilot_baseline_metrics pbm
GROUP BY pbm.material_category
ORDER BY avg_precision DESC;

GRANT SELECT ON v_material_baseline_ranking TO buildly_user;

-- ============================================
-- Audit Entry
-- ============================================

INSERT INTO pilot_audit_log (event_type, event_data, created_at)
VALUES (
  'BASELINE_METRICS_SCHEMA_INITIALIZED',
  jsonb_build_object(
    'migration', 'V011B',
    'tables_created', 1,
    'views_created', 2,
    'description', 'Baseline metrics for Phase 4.1 accuracy measurement',
    'timestamp', NOW()
  ),
  NOW()
);

COMMIT;

-- ============================================
-- Post-Migration Verification
-- ============================================
-- SQL to verify:
-- SELECT * FROM v_baseline_performance;
-- SELECT * FROM v_material_baseline_ranking;
