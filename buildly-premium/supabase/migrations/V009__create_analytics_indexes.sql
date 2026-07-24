-- Phase 3.7: Analytics Performance Indexes
-- Strategic indexes for fast aggregations and Looker Studio queries

-- 1. Event Store Query Optimization
CREATE INDEX IF NOT EXISTS idx_brain_events_obra_date
  ON brain_events(obra_id, created_at DESC)
  INCLUDE (tipo_evento, extracted_at);

CREATE INDEX IF NOT EXISTS idx_brain_events_tenant_date
  ON brain_events(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_brain_events_tipo_extracted
  ON brain_events(tipo_evento, extracted_at)
  WHERE extracted_at IS NOT NULL;

-- 2. Pattern Detection Indexes
CREATE INDEX IF NOT EXISTS idx_brain_patterns_obra_type_date
  ON brain_patterns(obra_id, pattern_type, created_at DESC)
  INCLUDE (confidence, updated_at);

CREATE INDEX IF NOT EXISTS idx_brain_patterns_tenant_active
  ON brain_patterns(tenant_id, is_active)
  INCLUDE (confidence, pattern_type);

-- 3. Alert Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_brain_alerts_obra_severity_date
  ON brain_alerts(obra_id, severity, created_at DESC)
  INCLUDE (pattern_id, status);

CREATE INDEX IF NOT EXISTS idx_brain_alerts_resolution
  ON brain_alerts(obra_id, status)
  INCLUDE (created_at, severity)
  WHERE status IN ('ACTIVE', 'RESOLVED');

CREATE INDEX IF NOT EXISTS idx_brain_alerts_timeline
  ON brain_alerts(DATE_TRUNC('day', created_at)::DATE, severity, obra_id)
  INCLUDE (pattern_id, created_at);

-- 4. Alert Feedback (Effectiveness Tracking)
CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_outcome
  ON brain_alert_feedback(alert_id, effectiveness_score)
  INCLUDE (impact_value, created_at);

CREATE INDEX IF NOT EXISTS idx_brain_alert_feedback_impact
  ON brain_alert_feedback(obra_id, created_at DESC)
  INCLUDE (impact_value, effectiveness_score)
  WHERE impact_value > 0;

-- 5. Pattern Weights (ML Learning Loop)
CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_ema
  ON brain_pattern_weights(pattern_id, updated_at DESC)
  INCLUDE (weight, weight_count);

CREATE INDEX IF NOT EXISTS idx_brain_pattern_weights_by_obra
  ON brain_pattern_weights(obra_id, updated_at DESC);

-- 6. Obra Summary Indexes
CREATE INDEX IF NOT EXISTS idx_obras_tenant_status
  ON obras(tenant_id, status)
  INCLUDE (name, created_at);

-- 7. Composite Indexes for Common Aggregation Queries
-- Events grouped by obra and day
CREATE INDEX IF NOT EXISTS idx_events_aggregation
  ON brain_events(obra_id, DATE_TRUNC('day', created_at)::DATE, tipo_evento);

-- Alerts grouped by obra and severity
CREATE INDEX IF NOT EXISTS idx_alerts_aggregation
  ON brain_alerts(obra_id, DATE_TRUNC('day', created_at)::DATE, severity);

-- Patterns effectiveness by obra
CREATE INDEX IF NOT EXISTS idx_pattern_effectiveness
  ON brain_patterns(obra_id, pattern_type)
  INCLUDE (confidence, is_active);

-- 8. Bitmap Indexes for Filter Operations (if PostgreSQL version >= 12 supports them)
-- These help with boolean/enum filters in Looker Studio
CREATE INDEX IF NOT EXISTS idx_alerts_severity_bitmap
  ON brain_alerts USING hash (severity);

CREATE INDEX IF NOT EXISTS idx_patterns_type_bitmap
  ON brain_patterns USING hash (pattern_type);

-- 9. Full-text Search Index for Looker Studio filters
CREATE INDEX IF NOT EXISTS idx_obras_search
  ON obras USING gin(to_tsvector('portuguese', name));

-- 10. Analyze table statistics after index creation (important for query planner)
ANALYZE brain_events;
ANALYZE brain_patterns;
ANALYZE brain_alerts;
ANALYZE brain_alert_feedback;
ANALYZE brain_pattern_weights;
ANALYZE obras;

-- Log index creation for monitoring
INSERT INTO audit_log (
  table_name,
  operation,
  timestamp,
  details
) VALUES (
  'analytics_indexes',
  'CREATED',
  NOW(),
  'Phase 3.7 analytics performance indexes created: 18 indexes for events, patterns, alerts, and KPI queries'
) ON CONFLICT DO NOTHING;
