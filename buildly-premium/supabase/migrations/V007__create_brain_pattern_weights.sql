-- V007__create_brain_pattern_weights.sql
-- Creates brain_pattern_weights table for machine learning feedback loop
-- Stores learned weights for pattern detection confidence and recommendation effectiveness

-- Create brain_pattern_weights table
CREATE TABLE IF NOT EXISTS brain_pattern_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type pattern_type_enum NOT NULL,
  obra_id VARCHAR(100) NOT NULL,
  detection_confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.5,
  recommendation_effectiveness NUMERIC(3, 2) NOT NULL DEFAULT 0.5,
  sample_count INTEGER NOT NULL DEFAULT 0,
  total_impact_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_cost_impact NUMERIC(15, 2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  CONSTRAINT uk_pattern_obra UNIQUE (pattern_type, obra_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_pattern_type ON brain_pattern_weights (pattern_type);
CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_obra_id ON brain_pattern_weights (obra_id);
CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_detection_conf ON brain_pattern_weights (detection_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_last_updated ON brain_pattern_weights (last_updated DESC);

-- Create trigger to update last_updated
CREATE OR REPLACE FUNCTION update_brain_pattern_weights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_pattern_weights_update_timestamp
BEFORE UPDATE ON brain_pattern_weights
FOR EACH ROW
EXECUTE FUNCTION update_brain_pattern_weights_updated_at();

-- Create audit table for pattern weight changes
CREATE TABLE IF NOT EXISTS brain_pattern_weights_audit (
  id BIGSERIAL PRIMARY KEY,
  weight_id UUID NOT NULL REFERENCES brain_pattern_weights(id) ON DELETE CASCADE,
  action VARCHAR(10),
  old_detection_confidence NUMERIC(3, 2),
  new_detection_confidence NUMERIC(3, 2),
  old_effectiveness NUMERIC(3, 2),
  new_effectiveness NUMERIC(3, 2),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_audit_weight_id ON brain_pattern_weights_audit (weight_id);
CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_audit_changed_at ON brain_pattern_weights_audit (changed_at DESC);

-- Create view for pattern weight trends
CREATE OR REPLACE VIEW v_brain_pattern_weights_trends AS
SELECT
  pattern_type,
  obra_id,
  detection_confidence,
  recommendation_effectiveness,
  sample_count,
  ROUND(total_impact_days / NULLIF(sample_count, 0)::NUMERIC, 2) as avg_impact_days,
  ROUND(total_cost_impact / NULLIF(sample_count, 0)::NUMERIC, 2) as avg_cost_impact,
  last_updated,
  CASE
    WHEN detection_confidence > 0.8 THEN 'High Confidence'
    WHEN detection_confidence > 0.6 THEN 'Medium Confidence'
    ELSE 'Low Confidence'
  END as confidence_level
FROM brain_pattern_weights
ORDER BY last_updated DESC;

-- Create view for pattern performance by obra
CREATE OR REPLACE VIEW v_brain_pattern_performance_by_obra AS
SELECT
  obra_id,
  COUNT(DISTINCT pattern_type) as pattern_count,
  ROUND(AVG(detection_confidence)::NUMERIC, 2) as avg_detection_confidence,
  ROUND(AVG(recommendation_effectiveness)::NUMERIC, 2) as avg_effectiveness,
  SUM(sample_count) as total_samples,
  ROUND(SUM(total_impact_days) / NULLIF(SUM(sample_count), 0)::NUMERIC, 2) as total_impact_days,
  ROUND(SUM(total_cost_impact) / NULLIF(SUM(sample_count), 0)::NUMERIC, 2) as total_cost_impact,
  MAX(last_updated) as latest_update
FROM brain_pattern_weights
GROUP BY obra_id
ORDER BY avg_effectiveness DESC;

-- Create materialized view for training data
CREATE MATERIALIZED VIEW v_brain_pattern_weights_for_training AS
SELECT
  a.id as alert_id,
  a.pattern_type,
  a.obra_id,
  a.confidence as predicted_confidence,
  COALESCE(pw.detection_confidence, 0.5) as current_weight,
  a.alert_severity,
  CASE WHEN f.id IS NOT NULL THEN TRUE ELSE FALSE END as has_feedback,
  COALESCE(f.effectiveness_achieved, 0) as actual_effectiveness,
  a.detected_at,
  f.created_at as feedback_date,
  EXTRACT(DAY FROM f.created_at - a.detected_at) as days_to_feedback
FROM brain_alerts a
LEFT JOIN brain_alert_feedback f ON a.id = f.alert_id
LEFT JOIN brain_pattern_weights pw ON a.pattern_type = pw.pattern_type AND a.obra_id = pw.obra_id
WHERE a.created_at > CURRENT_TIMESTAMP - INTERVAL '90 days'
ORDER BY a.detected_at DESC;

-- Create index on materialized view
CREATE INDEX idx_v_brain_pattern_weights_training_pattern ON v_brain_pattern_weights_for_training (pattern_type, obra_id);

-- Create stored procedure to update pattern weights
CREATE OR REPLACE FUNCTION update_pattern_weights(
  p_pattern_type pattern_type_enum,
  p_obra_id VARCHAR,
  p_new_confidence NUMERIC DEFAULT NULL,
  p_new_effectiveness NUMERIC DEFAULT NULL,
  p_impact_days INTEGER DEFAULT 0,
  p_cost_impact NUMERIC DEFAULT 0
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  updated_confidence NUMERIC,
  updated_effectiveness NUMERIC
) AS $$
DECLARE
  v_existing_record RECORD;
  v_new_confidence NUMERIC(3, 2);
  v_new_effectiveness NUMERIC(3, 2);
  v_new_sample_count INTEGER;
BEGIN
  -- Get existing record
  SELECT * INTO v_existing_record
  FROM brain_pattern_weights
  WHERE pattern_type = p_pattern_type AND obra_id = p_obra_id;

  IF v_existing_record IS NULL THEN
    -- Insert new record
    INSERT INTO brain_pattern_weights (
      pattern_type,
      obra_id,
      detection_confidence,
      recommendation_effectiveness,
      sample_count,
      total_impact_days,
      total_cost_impact,
      updated_by
    ) VALUES (
      p_pattern_type,
      p_obra_id,
      COALESCE(p_new_confidence, 0.5),
      COALESCE(p_new_effectiveness, 0.5),
      1,
      p_impact_days,
      p_cost_impact,
      CURRENT_USER
    );

    RETURN QUERY SELECT TRUE, 'Pattern weight created', COALESCE(p_new_confidence, 0.5)::NUMERIC, COALESCE(p_new_effectiveness, 0.5)::NUMERIC;
  ELSE
    -- Update existing record with exponential moving average
    v_new_sample_count := v_existing_record.sample_count + 1;
    v_new_confidence := (v_existing_record.detection_confidence * 0.7 + COALESCE(p_new_confidence, v_existing_record.detection_confidence) * 0.3);
    v_new_effectiveness := (v_existing_record.recommendation_effectiveness * 0.7 + COALESCE(p_new_effectiveness, v_existing_record.recommendation_effectiveness) * 0.3);

    UPDATE brain_pattern_weights
    SET
      detection_confidence = v_new_confidence,
      recommendation_effectiveness = v_new_effectiveness,
      sample_count = v_new_sample_count,
      total_impact_days = total_impact_days + p_impact_days,
      total_cost_impact = total_cost_impact + p_cost_impact,
      updated_by = CURRENT_USER
    WHERE pattern_type = p_pattern_type AND obra_id = p_obra_id;

    -- Audit the change
    INSERT INTO brain_pattern_weights_audit (
      weight_id,
      action,
      old_detection_confidence,
      new_detection_confidence,
      old_effectiveness,
      new_effectiveness,
      changed_by
    ) VALUES (
      v_existing_record.id,
      'UPDATE',
      v_existing_record.detection_confidence,
      v_new_confidence,
      v_existing_record.recommendation_effectiveness,
      v_new_effectiveness,
      CURRENT_USER
    );

    RETURN QUERY SELECT TRUE, 'Pattern weight updated', v_new_confidence, v_new_effectiveness;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure to refresh training materialized view
CREATE OR REPLACE FUNCTION refresh_pattern_training_data()
RETURNS TABLE (
  message TEXT,
  rows_processed INTEGER
) AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_brain_pattern_weights_for_training;

  SELECT COUNT(*) INTO v_row_count FROM v_brain_pattern_weights_for_training;

  RETURN QUERY SELECT 'Training data refreshed'::TEXT, v_row_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON brain_pattern_weights TO app_user;
GRANT SELECT ON brain_pattern_weights_audit TO app_user;
GRANT SELECT ON v_brain_pattern_weights_trends TO app_user;
GRANT SELECT ON v_brain_pattern_performance_by_obra TO app_user;
GRANT SELECT ON v_brain_pattern_weights_for_training TO app_user;
GRANT EXECUTE ON FUNCTION update_pattern_weights TO app_user;
GRANT EXECUTE ON FUNCTION refresh_pattern_training_data TO app_user;
