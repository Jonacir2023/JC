-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_decisions_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (entity_type, entity_id, action, old_values, new_values, changed_by)
  VALUES (
    'decision',
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'CREATE'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
    END,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    COALESCE(NEW.created_by, OLD.created_by, '00000000-0000-0000-0000-000000000000'::uuid)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_decisions AFTER INSERT OR UPDATE OR DELETE ON decisions
    FOR EACH ROW EXECUTE FUNCTION audit_decisions_change();

-- Event store metrics view
CREATE OR REPLACE VIEW event_metrics AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  event_type,
  COUNT(*) as count
FROM event_store
GROUP BY DATE_TRUNC('hour', created_at), event_type;

-- Decision metrics view
CREATE OR REPLACE VIEW decision_metrics AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  status,
  type,
  COUNT(*) as count
FROM decisions
GROUP BY DATE_TRUNC('day', created_at), status, type;
