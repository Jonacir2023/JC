-- V005__create_brain_alerts.sql
-- Creates brain_alerts table for Phase 3.4 Proactive alerting system
-- Stores detected patterns and generated alerts with partitioning and versioning

-- Create ENUM types for alert severity
DO $$ BEGIN
  CREATE TYPE alert_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create ENUM types for pattern type
DO $$ BEGIN
  CREATE TYPE pattern_type_enum AS ENUM ('temporal', 'causal', 'cascade', 'resource');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Main brain_alerts table (parent for partitioning)
CREATE TABLE IF NOT EXISTS brain_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rdo_id VARCHAR(100) NOT NULL UNIQUE,
  obra_id VARCHAR(100) NOT NULL,
  pattern_type pattern_type_enum NOT NULL,
  alert_severity alert_severity_enum NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  recommended_action TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  action_taken BOOLEAN DEFAULT FALSE,
  action_taken_at TIMESTAMP WITH TIME ZONE,
  action_description TEXT,
  effectiveness_score NUMERIC(3, 2) CHECK (effectiveness_score IS NULL OR (effectiveness_score >= 0 AND effectiveness_score <= 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create partitions for date ranges (monthly)
CREATE TABLE IF NOT EXISTS brain_alerts_2026_07 PARTITION OF brain_alerts
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS brain_alerts_2026_08 PARTITION OF brain_alerts
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS brain_alerts_2026_09 PARTITION OF brain_alerts
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS brain_alerts_default PARTITION OF brain_alerts
  FOR VALUES FROM ('2026-10-01') TO (MAXVALUE);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brain_alerts_obra_id ON brain_alerts (obra_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_severity ON brain_alerts (alert_severity);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_pattern_type ON brain_alerts (pattern_type);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_rdo_id ON brain_alerts (rdo_id);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_detected_at ON brain_alerts (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_expires_at ON brain_alerts (expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_action_taken ON brain_alerts (action_taken, action_taken_at DESC);

-- Create indexes on partitions
CREATE INDEX IF NOT EXISTS idx_brain_alerts_2026_07_obra ON brain_alerts_2026_07 (obra_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_2026_08_obra ON brain_alerts_2026_08 (obra_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_2026_09_obra ON brain_alerts_2026_09 (obra_id, detected_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brain_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_alerts_update_timestamp
BEFORE UPDATE ON brain_alerts
FOR EACH ROW
EXECUTE FUNCTION update_brain_alerts_updated_at();

-- Create audit trigger to track changes
CREATE TABLE IF NOT EXISTS brain_alerts_audit (
  id BIGSERIAL PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES brain_alerts(id) ON DELETE CASCADE,
  action VARCHAR(10),
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_brain_alerts_audit_alert_id ON brain_alerts_audit (alert_id);
CREATE INDEX IF NOT EXISTS idx_brain_alerts_audit_changed_at ON brain_alerts_audit (changed_at DESC);

CREATE OR REPLACE FUNCTION audit_brain_alerts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO brain_alerts_audit (alert_id, action, old_values, new_values, changed_by)
    VALUES (
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      CURRENT_USER
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO brain_alerts_audit (alert_id, action, old_values, changed_by)
    VALUES (
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      CURRENT_USER
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_alerts_audit_trigger
AFTER UPDATE OR DELETE ON brain_alerts
FOR EACH ROW
EXECUTE FUNCTION audit_brain_alerts();

-- Create view for recent active alerts
CREATE OR REPLACE VIEW v_brain_alerts_active AS
SELECT
  id,
  rdo_id,
  obra_id,
  pattern_type,
  alert_severity,
  description,
  confidence,
  recommended_action,
  detected_at,
  expires_at,
  CASE WHEN expires_at > CURRENT_TIMESTAMP THEN TRUE ELSE FALSE END AS is_active
FROM brain_alerts
WHERE expires_at > CURRENT_TIMESTAMP
ORDER BY detected_at DESC;

-- Create view for alert statistics by obra
CREATE OR REPLACE VIEW v_brain_alerts_stats AS
SELECT
  obra_id,
  pattern_type,
  alert_severity,
  COUNT(*) as alert_count,
  AVG(confidence) as avg_confidence,
  MAX(detected_at) as latest_alert,
  SUM(CASE WHEN action_taken THEN 1 ELSE 0 END) as actions_taken,
  AVG(CASE WHEN effectiveness_score IS NOT NULL THEN effectiveness_score ELSE NULL END) as avg_effectiveness
FROM brain_alerts
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY obra_id, pattern_type, alert_severity;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON brain_alerts TO app_user;
GRANT SELECT ON brain_alerts_audit TO app_user;
GRANT SELECT ON v_brain_alerts_active TO app_user;
GRANT SELECT ON v_brain_alerts_stats TO app_user;
