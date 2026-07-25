-- Phase 4.3: Pilot Validation Infrastructure
-- Tables for tracking pilot sites, historical material data, and validation metrics

-- 1. Pilot Sites Registry
CREATE TABLE IF NOT EXISTS pilot_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  location_state VARCHAR(2) NOT NULL, -- SP, MG, RJ, DF, AM
  location_city VARCHAR(255) NOT NULL,
  project_scope VARCHAR(500),
  budget_brl DECIMAL(15, 2),
  site_coordinator VARCHAR(255),
  site_coordinator_email VARCHAR(255),
  gestor_name VARCHAR(255),
  gestor_email VARCHAR(255),
  historical_data_months INTEGER,
  expected_historical_records INTEGER,
  status VARCHAR(50) DEFAULT 'setup', -- 'setup', 'data_loaded', 'baseline_ready', 'soft_launch', 'active', 'analysis', 'complete'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_name, client_name)
);

CREATE INDEX idx_pilot_sites_status ON pilot_sites(status);
CREATE INDEX idx_pilot_sites_location ON pilot_sites(location_state);

-- 2. Historical Material Delivery Records
CREATE TABLE IF NOT EXISTS pilot_material_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  material_name VARCHAR(255) NOT NULL, -- 'Cimento CP II', 'Aço CA-50', etc.
  material_category VARCHAR(100) NOT NULL, -- 'Cimento', 'Aço', 'Blocos', 'Vidro', 'Esquadrias', 'Maquinário', 'Diesel'
  supplier_name VARCHAR(255),
  order_date DATE NOT NULL,
  promised_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  delay_days INTEGER, -- Calculated from actual_delivery_date - promised_delivery_date
  quantity DECIMAL(12, 2),
  unit_of_measure VARCHAR(50), -- 'ton', 'unidade', 'litro', 'm²'
  unit_cost_brl DECIMAL(10, 2),
  total_cost_brl DECIMAL(15, 2),
  delay_impact_brl DECIMAL(15, 2), -- Cost of delay if applicable
  status VARCHAR(50), -- 'on_time', 'delayed', 'cancelled'
  external_factors TEXT, -- 'greve', 'chuva', 'acidente', 'burocracia', 'null'
  notes TEXT,
  data_source VARCHAR(100) DEFAULT 'pilot_historical',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pilot_material_site_date ON pilot_material_history(site_id, order_date DESC);
CREATE INDEX idx_pilot_material_delay ON pilot_material_history(site_id, delay_days) WHERE delay_days > 0;
CREATE INDEX idx_pilot_material_category ON pilot_material_history(material_category);

-- 3. Pilot Baseline Predictions (generated at Week 1)
CREATE TABLE IF NOT EXISTS pilot_baseline_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  material_name VARCHAR(255) NOT NULL,
  material_category VARCHAR(100) NOT NULL,
  predicted_delay_days INTEGER,
  confidence DECIMAL(5, 4),
  severity VARCHAR(50), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  predicted_cost_impact_brl DECIMAL(15, 2),
  historical_occurrences INTEGER, -- How many times has this material been delayed at this site?
  average_historical_delay_days DECIMAL(8, 2),
  prediction_notes TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  validation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'validated_correct', 'validated_incorrect'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pilot_baseline_site ON pilot_baseline_predictions(site_id);
CREATE INDEX idx_pilot_baseline_confidence ON pilot_baseline_predictions(confidence DESC);

-- 4. Pilot Soft Launch Observations (Week 2-3)
CREATE TABLE IF NOT EXISTS pilot_soft_launch_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  observation_date DATE NOT NULL,
  alerts_generated INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,
  system_latency_p95_ms INTEGER,
  cache_hit_rate DECIMAL(5, 4),
  system_health_notes TEXT,
  precision_live DECIMAL(5, 4), -- Calculated: TP / (TP + FP)
  recall_estimated DECIMAL(5, 4), -- Estimated based on historical comparison
  observation_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pilot_soft_launch_site_date ON pilot_soft_launch_observations(site_id, observation_date DESC);

-- 5. Pilot Active Phase Feedback (Week 3-5)
CREATE TABLE IF NOT EXISTS pilot_active_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  prediction_id UUID REFERENCES ml_predictions(id),
  material_name VARCHAR(255) NOT NULL,
  predicted_delay_days INTEGER,
  predicted_date DATE,
  confidence DECIMAL(5, 4),
  gestor_decision VARCHAR(50), -- 'approved', 'rejected'
  gestor_id VARCHAR(255),
  decision_timestamp TIMESTAMP,
  actual_outcome VARCHAR(50), -- 'occurred', 'prevented', 'false_positive', 'partial'
  actual_delay_days INTEGER,
  actual_delivery_date DATE,
  actual_impact_brl DECIMAL(15, 2),
  prevented_cost_brl DECIMAL(15, 2), -- Cost saved by acting on this prediction
  feedback_notes TEXT,
  model_accuracy_contribution DECIMAL(5, 4), -- How much did this feedback help model?
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pilot_active_site_date ON pilot_active_feedback(site_id, created_at DESC);
CREATE INDEX idx_pilot_active_outcome ON pilot_active_feedback(actual_outcome);
CREATE INDEX idx_pilot_active_accuracy ON pilot_active_feedback(model_accuracy_contribution DESC);

-- 6. Pilot Daily Metrics Rollup (for dashboard)
CREATE TABLE IF NOT EXISTS pilot_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  total_alerts_generated INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  high_alerts INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  true_positives INTEGER DEFAULT 0,
  prevented_delays INTEGER DEFAULT 0,
  total_prevented_cost_brl DECIMAL(15, 2),
  total_false_positive_cost_brl DECIMAL(15, 2),
  cache_hit_rate DECIMAL(5, 4),
  system_latency_p95_ms INTEGER,
  system_uptime_percent DECIMAL(5, 2),
  adoption_rate DECIMAL(5, 4), -- % of gestores using system
  average_gestor_response_time_minutes DECIMAL(8, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (metric_date, site_id)
);

CREATE INDEX idx_pilot_daily_metrics_site ON pilot_daily_metrics(site_id, metric_date DESC);
CREATE INDEX idx_pilot_daily_metrics_prevented ON pilot_daily_metrics(total_prevented_cost_brl DESC);

-- 7. Pilot Weekly Summary (aggregate view)
CREATE TABLE IF NOT EXISTS pilot_weekly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  phase VARCHAR(50), -- 'setup', 'soft_launch', 'active', 'analysis'
  total_alerts INTEGER DEFAULT 0,
  total_false_positives INTEGER DEFAULT 0,
  precision DECIMAL(5, 4), -- TP / (TP + FP)
  recall DECIMAL(5, 4), -- TP / (TP + FN)
  false_positive_rate DECIMAL(5, 4), -- FP / Total
  roi DECIMAL(15, 2), -- (TP * prevented_cost) - (FP * cost_of_false_positive)
  adoption_rate DECIMAL(5, 4),
  system_availability DECIMAL(5, 4),
  key_insights TEXT,
  blockers_identified TEXT,
  recommendations TEXT,
  coordinator_notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pilot_weekly_site ON pilot_weekly_summary(site_id, week_start_date DESC);
CREATE INDEX idx_pilot_weekly_phase ON pilot_weekly_summary(phase);

-- 8. Material Category Reference
CREATE TABLE IF NOT EXISTS pilot_material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL UNIQUE, -- 'Cimento', 'Aço', 'Blocos', 'Vidro', 'Esquadrias', 'Maquinário', 'Diesel'
  typical_delay_risk VARCHAR(50), -- 'LOW', 'MEDIUM', 'HIGH'
  typical_cost_per_day_delay_brl DECIMAL(15, 2),
  sourcing_complexity VARCHAR(50), -- 'local', 'regional', 'import'
  seasonal_risk BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Materialized View: Pilot Performance Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS pilot_performance_summary AS
SELECT
  ps.id as site_id,
  ps.site_name,
  ps.client_name,
  ps.location_state,
  ps.status,
  COUNT(DISTINCT pdm.metric_date) as days_monitored,
  COALESCE(SUM(pdm.total_alerts_generated), 0) as total_alerts,
  COALESCE(SUM(pdm.true_positives), 0) as total_true_positives,
  COALESCE(SUM(pdm.false_positives), 0) as total_false_positives,
  ROUND(COALESCE(SUM(pdm.true_positives), 0)::NUMERIC /
    NULLIF(COALESCE(SUM(pdm.true_positives), 0) + COALESCE(SUM(pdm.false_positives), 0), 0), 4) as precision,
  COALESCE(SUM(pdm.total_prevented_cost_brl), 0) as total_prevented_cost,
  COALESCE(SUM(pdm.total_false_positive_cost_brl), 0) as total_false_positive_cost,
  ROUND(COALESCE(AVG(pdm.cache_hit_rate), 0), 4) as avg_cache_hit_rate,
  ROUND(COALESCE(AVG(pdm.system_latency_p95_ms), 0), 0) as avg_latency_p95_ms,
  MAX(pdm.metric_date) as last_updated
FROM pilot_sites ps
LEFT JOIN pilot_daily_metrics pdm ON ps.id = pdm.site_id
GROUP BY ps.id, ps.site_name, ps.client_name, ps.location_state, ps.status;

CREATE UNIQUE INDEX idx_pilot_perf_summary ON pilot_performance_summary(site_id);

-- Grants
GRANT SELECT, INSERT, UPDATE ON pilot_sites TO api_user;
GRANT SELECT, INSERT ON pilot_material_history TO api_user;
GRANT SELECT, INSERT ON pilot_baseline_predictions TO api_user;
GRANT SELECT, INSERT ON pilot_soft_launch_observations TO api_user;
GRANT SELECT, INSERT, UPDATE ON pilot_active_feedback TO api_user;
GRANT SELECT, INSERT ON pilot_daily_metrics TO api_user;
GRANT SELECT, INSERT ON pilot_weekly_summary TO api_user;
GRANT SELECT ON pilot_material_categories TO api_user;
GRANT SELECT ON pilot_performance_summary TO api_user;

-- Stored Procedure: Calculate daily metrics
CREATE OR REPLACE FUNCTION calculate_pilot_daily_metrics(p_site_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO pilot_daily_metrics (
    metric_date, site_id, true_positives, false_positives,
    total_prevented_cost_brl, total_false_positive_cost_brl, created_at
  )
  SELECT
    p_date,
    p_site_id,
    COALESCE(COUNT(CASE WHEN paf.actual_outcome = 'occurred' THEN 1 END), 0),
    COALESCE(COUNT(CASE WHEN paf.actual_outcome = 'false_positive' THEN 1 END), 0),
    COALESCE(SUM(CASE WHEN paf.actual_outcome = 'occurred' THEN paf.prevented_cost_brl END), 0),
    COALESCE(SUM(CASE WHEN paf.actual_outcome = 'false_positive' THEN paf.actual_impact_brl END), 0),
    NOW()
  FROM pilot_active_feedback paf
  WHERE paf.site_id = p_site_id
    AND DATE(paf.decision_timestamp) = p_date
  ON CONFLICT (metric_date, site_id) DO UPDATE SET
    true_positives = EXCLUDED.true_positives,
    false_positives = EXCLUDED.false_positives,
    total_prevented_cost_brl = EXCLUDED.total_prevented_cost_brl,
    total_false_positive_cost_brl = EXCLUDED.total_false_positive_cost_brl;
END;
$$ LANGUAGE plpgsql;

-- Log pilot infrastructure creation
INSERT INTO audit_log (
  table_name,
  operation,
  timestamp,
  details
) VALUES (
  'pilot_infrastructure',
  'CREATED',
  NOW(),
  'Phase 4.3 Pilot Infrastructure: 8 tables for 5-site validation, material history tracking, feedback recording, and daily metrics'
) ON CONFLICT DO NOTHING;
