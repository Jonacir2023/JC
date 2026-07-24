-- Phase 3.8: ML Infrastructure
-- Model training history, predictions, and learning metrics

-- 1. ML Model Metadata
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(255) NOT NULL UNIQUE,
  model_type VARCHAR(100) NOT NULL, -- 'pattern_detector', 'alert_predictor', 'cost_model'
  version INTEGER NOT NULL DEFAULT 1,
  framework VARCHAR(50) NOT NULL, -- 'scikit-learn', 'xgboost', 'tensorflow'
  hyperparameters JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  is_active BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ml_models_active ON ml_models(is_active);
CREATE INDEX idx_ml_models_type ON ml_models(model_type);

-- 2. Training Job History
CREATE TABLE IF NOT EXISTS ml_training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ml_models(id),
  job_status VARCHAR(50) NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
  training_start TIMESTAMP,
  training_end TIMESTAMP,
  training_duration_seconds INTEGER,
  data_samples_used INTEGER,
  validation_split DECIMAL(3, 2) DEFAULT 0.2,
  test_split DECIMAL(3, 2) DEFAULT 0.1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT,
  triggered_by VARCHAR(255) -- 'scheduled', 'manual', 'automated'
);

CREATE INDEX idx_ml_training_jobs_status ON ml_training_jobs(job_status);
CREATE INDEX idx_ml_training_jobs_model ON ml_training_jobs(model_id, created_at DESC);

-- 3. Model Performance Metrics (per training)
CREATE TABLE IF NOT EXISTS ml_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_job_id UUID NOT NULL REFERENCES ml_training_jobs(id),
  model_id UUID NOT NULL REFERENCES ml_models(id),
  accuracy DECIMAL(5, 4),
  precision DECIMAL(5, 4),
  recall DECIMAL(5, 4),
  f1_score DECIMAL(5, 4),
  mean_absolute_error DECIMAL(10, 6),
  mean_squared_error DECIMAL(10, 6),
  roc_auc_score DECIMAL(5, 4),
  confusion_matrix JSONB, -- Serialized confusion matrix
  class_report JSONB, -- Per-class precision/recall/f1
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, training_job_id)
);

CREATE INDEX idx_ml_model_metrics_job ON ml_model_metrics(training_job_id);
CREATE INDEX idx_ml_model_metrics_model ON ml_model_metrics(model_id);

-- 4. Feature Importance (SHAP values, tree-based importance)
CREATE TABLE IF NOT EXISTS ml_feature_importance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ml_models(id),
  feature_name VARCHAR(255) NOT NULL,
  importance_score DECIMAL(10, 6) NOT NULL,
  shap_value DECIMAL(10, 6),
  direction VARCHAR(20), -- 'positive', 'negative'
  ranking INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, feature_name)
);

CREATE INDEX idx_ml_feature_importance_model ON ml_feature_importance(model_id, ranking);

-- 5. Predictive Alerts (forecast results)
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  prediction_type VARCHAR(100) NOT NULL, -- 'alert', 'delay', 'resource_shortage'
  pattern_type VARCHAR(100),
  predicted_date DATE,
  predicted_severity VARCHAR(50),
  probability DECIMAL(5, 4),
  estimated_impact_value DECIMAL(15, 2),
  recommended_action TEXT,
  actual_outcome VARCHAR(50), -- 'occurred', 'prevented', 'false_positive'
  actual_date DATE,
  actual_impact_value DECIMAL(15, 2),
  prediction_accuracy DECIMAL(5, 4), -- Calculated after outcome known
  created_at TIMESTAMP DEFAULT NOW(),
  feedback_at TIMESTAMP,
  FOREIGN KEY (obra_id) REFERENCES obras(id)
);

CREATE INDEX idx_ml_predictions_obra_date ON ml_predictions(obra_id, predicted_date);
CREATE INDEX idx_ml_predictions_outcome ON ml_predictions(actual_outcome);
CREATE INDEX idx_ml_predictions_accuracy ON ml_predictions(prediction_accuracy) WHERE actual_outcome IS NOT NULL;

-- 6. Cost Attribution History
CREATE TABLE IF NOT EXISTS ml_cost_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  attribution_date DATE NOT NULL,
  attribution_by VARCHAR(50) NOT NULL, -- 'pattern', 'team', 'activity'
  category_name VARCHAR(255) NOT NULL,
  cost_savings DECIMAL(15, 2),
  cost_prevention DECIMAL(15, 2),
  cost_optimization DECIMAL(15, 2),
  total_impact DECIMAL(15, 2) GENERATED ALWAYS AS (
    COALESCE(cost_savings, 0) + COALESCE(cost_prevention, 0) + COALESCE(cost_optimization, 0)
  ) STORED,
  roi_multiplier DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (obra_id) REFERENCES obras(id),
  PRIMARY KEY (id, attribution_date, obra_id)
) PARTITION BY RANGE (attribution_date) (
  PARTITION p_2026_q1 VALUES FROM ('2026-01-01') TO ('2026-04-01'),
  PARTITION p_2026_q2 VALUES FROM ('2026-04-01') TO ('2026-07-01'),
  PARTITION p_2026_q3 VALUES FROM ('2026-07-01') TO ('2026-10-01'),
  PARTITION p_2026_q4 VALUES FROM ('2026-10-01') TO ('2027-01-01'),
  PARTITION p_2027_rest VALUES FROM ('2027-01-01') TO (MAXVALUE)
);

CREATE INDEX idx_ml_cost_attr_obra_date ON ml_cost_attributions(obra_id, attribution_date DESC);
CREATE INDEX idx_ml_cost_attr_impact ON ml_cost_attributions(total_impact DESC);

-- 7. Model Drift Detection
CREATE TABLE IF NOT EXISTS ml_model_drift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ml_models(id),
  check_date DATE NOT NULL,
  data_drift_score DECIMAL(5, 4), -- Statistical distance of current data vs training data
  prediction_drift_score DECIMAL(5, 4), -- Change in prediction distribution
  performance_drift_score DECIMAL(5, 4), -- Change in model performance
  overall_drift_status VARCHAR(50), -- 'stable', 'warning', 'critical'
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, check_date)
);

CREATE INDEX idx_ml_model_drift_status ON ml_model_drift(model_id, overall_drift_status);

-- 8. Training Data Snapshots (for audit and reproducibility)
CREATE TABLE IF NOT EXISTS ml_training_data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_job_id UUID NOT NULL REFERENCES ml_training_jobs(id),
  obra_id VARCHAR(255),
  data_hash VARCHAR(64), -- SHA256 of training data
  total_samples INTEGER,
  feature_count INTEGER,
  class_distribution JSONB,
  date_range_start DATE,
  date_range_end DATE,
  quality_checks JSONB, -- Missing values, outliers, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ml_training_snapshots_job ON ml_training_data_snapshots(training_job_id);

-- 9. Materialized View: Model Leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS ml_models_leaderboard AS
SELECT
  m.id,
  m.model_name,
  m.model_type,
  m.version,
  m.is_active,
  mmm.accuracy,
  mmm.precision,
  mmm.recall,
  mmm.f1_score,
  mmm.roc_auc_score,
  MAX(mtj.training_end) as last_trained,
  COUNT(DISTINCT mmd.id) as prediction_count
FROM ml_models m
LEFT JOIN ml_model_metrics mmm ON m.id = mmm.model_id
LEFT JOIN ml_training_jobs mtj ON m.id = mtj.model_id
LEFT JOIN ml_predictions mmd ON m.model_name LIKE CONCAT('%', mmd.pattern_type, '%')
GROUP BY m.id, m.model_name, m.model_type, m.version, m.is_active, mmm.accuracy, mmm.precision, mmm.recall, mmm.f1_score, mmm.roc_auc_score
ORDER BY mmm.f1_score DESC;

CREATE UNIQUE INDEX idx_ml_leaderboard ON ml_models_leaderboard(id);

-- 10. Grant permissions
GRANT SELECT ON ml_models TO api_user;
GRANT SELECT ON ml_training_jobs TO api_user;
GRANT SELECT ON ml_model_metrics TO api_user;
GRANT SELECT ON ml_predictions TO api_user;
GRANT SELECT ON ml_cost_attributions TO api_user;
GRANT SELECT ON ml_models_leaderboard TO api_user;

-- Stored Procedure: Record prediction feedback
CREATE OR REPLACE FUNCTION record_prediction_feedback(
  p_prediction_id UUID,
  p_actual_outcome VARCHAR,
  p_actual_date DATE,
  p_actual_impact DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE ml_predictions
  SET
    actual_outcome = p_actual_outcome,
    actual_date = p_actual_date,
    actual_impact_value = p_actual_impact,
    prediction_accuracy = CASE
      WHEN p_actual_outcome = 'occurred' THEN 1.0
      WHEN p_actual_outcome = 'prevented' THEN 0.9
      WHEN p_actual_outcome = 'false_positive' THEN 0.0
    END,
    feedback_at = NOW()
  WHERE id = p_prediction_id;
END;
$$ LANGUAGE plpgsql;

-- Log infrastructure creation
INSERT INTO audit_log (
  table_name,
  operation,
  timestamp,
  details
) VALUES (
  'ml_infrastructure',
  'CREATED',
  NOW(),
  'Phase 3.8 ML infrastructure: 8 tables + 1 materialized view for model training, predictions, cost attribution, and drift detection'
) ON CONFLICT DO NOTHING;
