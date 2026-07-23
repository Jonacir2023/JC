-- V006__create_brain_alert_feedback.sql
-- Creates brain_alert_feedback table to track alert outcomes and measure effectiveness
-- Enables machine learning feedback loop for pattern detection improvements

-- Create ENUM for action taken
DO $$ BEGIN
  CREATE TYPE alert_action_enum AS ENUM ('implemented', 'ignored', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create brain_alert_feedback table
CREATE TABLE IF NOT EXISTS brain_alert_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES brain_alerts(id) ON DELETE CASCADE,
  action_taken alert_action_enum NOT NULL,
  feedback_text TEXT,
  actual_outcome_days INTEGER,
  actual_outcome_cost NUMERIC(15, 2),
  implementation_date TIMESTAMP WITH TIME ZONE,
  responsible_team VARCHAR(100),
  recommendation_id VARCHAR(100),
  effectiveness_achieved NUMERIC(3, 2),
  learning_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_id FOREIGN KEY (alert_id) REFERENCES brain_alerts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_alert_id ON brain_alert_feedback (alert_id);
CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_action ON brain_alert_feedback (action_taken);
CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_created_at ON brain_alert_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_implementation_date ON brain_alert_feedback (implementation_date DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brain_alert_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_alert_feedback_update_timestamp
BEFORE UPDATE ON brain_alert_feedback
FOR EACH ROW
EXECUTE FUNCTION update_brain_alert_feedback_updated_at();

-- Create trigger to update alert effectiveness_score when feedback is recorded
CREATE OR REPLACE FUNCTION update_alert_effectiveness()
RETURNS TRIGGER AS $$
DECLARE
  v_estimated_impact_days INTEGER;
  v_actual_impact_days INTEGER;
  v_effectiveness NUMERIC(3, 2);
BEGIN
  -- Get estimated impact from alert description (simplified)
  -- In production, this would parse the alert description or store estimated_impact_days
  v_estimated_impact_days := COALESCE(NEW.actual_outcome_days + 8, 8);
  v_actual_impact_days := COALESCE(NEW.actual_outcome_days, 0);

  -- Calculate effectiveness: (estimated - actual) / estimated
  IF v_estimated_impact_days > 0 THEN
    v_effectiveness := GREATEST(0, LEAST(1, ((v_estimated_impact_days - v_actual_impact_days)::NUMERIC(3, 2)) / v_estimated_impact_days));
  ELSE
    v_effectiveness := 0;
  END IF;

  -- Update alert with effectiveness score
  UPDATE brain_alerts
  SET
    effectiveness_score = v_effectiveness,
    action_taken = TRUE,
    action_taken_at = CURRENT_TIMESTAMP
  WHERE id = NEW.alert_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_alert_feedback_update_effectiveness
AFTER INSERT ON brain_alert_feedback
FOR EACH ROW
EXECUTE FUNCTION update_alert_effectiveness();

-- Create audit table for feedback changes
CREATE TABLE IF NOT EXISTS brain_alert_feedback_audit (
  id BIGSERIAL PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES brain_alert_feedback(id) ON DELETE CASCADE,
  action VARCHAR(10),
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_audit_feedback_id ON brain_alert_feedback_audit (feedback_id);
CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_audit_changed_at ON brain_alert_feedback_audit (changed_at DESC);

-- Create view for feedback statistics
CREATE OR REPLACE VIEW v_brain_alert_feedback_stats AS
SELECT
  a.obra_id,
  a.pattern_type,
  COUNT(DISTINCT a.id) as total_alerts,
  COUNT(DISTINCT CASE WHEN f.id IS NOT NULL THEN a.id END) as alerts_with_feedback,
  COUNT(DISTINCT CASE WHEN f.action_taken = 'implemented' THEN a.id END) as implemented_count,
  AVG(CASE WHEN f.effectiveness_achieved IS NOT NULL THEN f.effectiveness_achieved ELSE NULL END) as avg_effectiveness,
  AVG(CASE WHEN f.actual_outcome_days IS NOT NULL THEN f.actual_outcome_days ELSE NULL END) as avg_outcome_days,
  SUM(CASE WHEN f.actual_outcome_cost IS NOT NULL THEN f.actual_outcome_cost ELSE 0 END) as total_cost_impact
FROM brain_alerts a
LEFT JOIN brain_alert_feedback f ON a.id = f.alert_id
WHERE a.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY a.obra_id, a.pattern_type;

-- Create view for learning metrics
CREATE OR REPLACE VIEW v_brain_alert_learning_metrics AS
SELECT
  a.pattern_type,
  a.alert_severity,
  COUNT(DISTINCT a.id) as total_alerts,
  ROUND(AVG(a.confidence)::NUMERIC, 2) as avg_confidence,
  COUNT(DISTINCT CASE WHEN f.action_taken = 'implemented' THEN a.id END)::FLOAT /
    NULLIF(COUNT(DISTINCT a.id), 0) as implementation_rate,
  ROUND(AVG(CASE WHEN f.effectiveness_achieved IS NOT NULL THEN f.effectiveness_achieved END)::NUMERIC, 2) as avg_effectiveness,
  COUNT(DISTINCT a.id) - COUNT(DISTINCT f.id) as feedback_needed
FROM brain_alerts a
LEFT JOIN brain_alert_feedback f ON a.id = f.alert_id
WHERE a.created_at > CURRENT_TIMESTAMP - INTERVAL '60 days'
GROUP BY a.pattern_type, a.alert_severity
ORDER BY total_alerts DESC;

-- Create stored procedure to record feedback and update patterns
CREATE OR REPLACE FUNCTION record_alert_feedback(
  p_alert_id UUID,
  p_action alert_action_enum,
  p_outcome_days INTEGER DEFAULT NULL,
  p_outcome_cost NUMERIC DEFAULT NULL,
  p_feedback_text TEXT DEFAULT NULL
) RETURNS TABLE (
  feedback_id UUID,
  effectiveness NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_feedback_id UUID;
  v_effectiveness NUMERIC(3, 2);
  v_alert_record RECORD;
BEGIN
  -- Get alert details
  SELECT id, pattern_type, rdo_id INTO v_alert_record FROM brain_alerts WHERE id = p_alert_id;

  IF v_alert_record IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::NUMERIC, 'Alert not found'::TEXT;
    RETURN;
  END IF;

  -- Insert feedback
  INSERT INTO brain_alert_feedback (alert_id, action_taken, actual_outcome_days, actual_outcome_cost, feedback_text)
  VALUES (p_alert_id, p_action, p_outcome_days, p_outcome_cost, p_feedback_text)
  RETURNING brain_alert_feedback.id INTO v_feedback_id;

  -- Get updated effectiveness
  SELECT effectiveness_score INTO v_effectiveness FROM brain_alerts WHERE id = p_alert_id;

  RETURN QUERY SELECT v_feedback_id, v_effectiveness, 'Feedback recorded successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON brain_alert_feedback TO app_user;
GRANT SELECT ON brain_alert_feedback_audit TO app_user;
GRANT SELECT ON v_brain_alert_feedback_stats TO app_user;
GRANT SELECT ON v_brain_alert_learning_metrics TO app_user;
GRANT EXECUTE ON FUNCTION record_alert_feedback TO app_user;
