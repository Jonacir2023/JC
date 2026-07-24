-- Phase 3.7: Analytics Views & Materialized Aggregations
-- Materialized views for Looker Studio integration

-- 1. Daily Events Aggregation View
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_events_daily AS
SELECT
  DATE_TRUNC('day', e.created_at)::DATE as date,
  e.obra_id,
  e.tenant_id,
  e.tipo_evento,
  COUNT(*) as event_count,
  COUNT(CASE WHEN e.extracted_at IS NOT NULL THEN 1 END) as extracted_count,
  ROUND(
    COUNT(CASE WHEN e.extracted_at IS NOT NULL THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as extraction_rate_pct,
  ROUND(
    EXTRACT(EPOCH FROM AVG(e.extracted_at - e.created_at)) / 60,
    2
  ) as avg_processing_time_minutes,
  MIN(e.created_at) as first_event_time,
  MAX(e.created_at) as last_event_time
FROM brain_events e
GROUP BY DATE_TRUNC('day', e.created_at), e.obra_id, e.tenant_id, e.tipo_evento
WITH DATA;

CREATE UNIQUE INDEX idx_analytics_events_daily
  ON analytics_events_daily(date, obra_id, tipo_evento);

-- 2. Pattern Effectiveness Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_patterns_summary AS
SELECT
  p.obra_id,
  p.tenant_id,
  p.pattern_type,
  COUNT(DISTINCT p.id) as pattern_count,
  ROUND(AVG(p.confidence)::NUMERIC, 3) as avg_confidence,
  ROUND(AVG(pw.weight)::NUMERIC, 3) as avg_effectiveness_weight,
  COUNT(DISTINCT a.id) as total_alerts_generated,
  COUNT(DISTINCT af.id) as total_recommendations_acted_on,
  ROUND(
    COUNT(DISTINCT af.id)::NUMERIC /
    NULLIF(COUNT(DISTINCT a.id), 0) * 100,
    2
  ) as recommendation_adoption_rate,
  COALESCE(ROUND(SUM(af.impact_value)::NUMERIC, 2), 0) as total_impact_value,
  CASE
    WHEN AVG(pw.weight) > 0.7 THEN 'High Performing'
    WHEN AVG(pw.weight) > 0.4 THEN 'Moderate Performing'
    ELSE 'Needs Improvement'
  END as performance_category,
  MIN(p.created_at) as first_detected_at,
  MAX(p.updated_at) as last_updated_at
FROM brain_patterns p
LEFT JOIN brain_pattern_weights pw ON p.id = pw.pattern_id
LEFT JOIN brain_alerts a ON p.id = a.pattern_id
LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
GROUP BY p.obra_id, p.tenant_id, p.pattern_type
WITH DATA;

CREATE UNIQUE INDEX idx_analytics_patterns_summary
  ON analytics_patterns_summary(obra_id, pattern_type);

-- 3. Alert Resolution Timeline
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_alerts_resolution AS
SELECT
  DATE_TRUNC('day', a.created_at)::DATE as alert_date,
  a.obra_id,
  a.tenant_id,
  a.severity,
  COUNT(*) as alert_count,
  COUNT(DISTINCT p.pattern_type) as distinct_pattern_types,
  ROUND(
    EXTRACT(EPOCH FROM AVG(
      COALESCE(af.resolution_date, NOW()) - a.created_at
    )) / 3600,
    2
  ) as avg_resolution_hours,
  ROUND(
    COUNT(CASE WHEN af.id IS NOT NULL THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as resolution_rate_pct,
  COUNT(CASE WHEN af.effectiveness_score > 0.5 THEN 1 END) as high_effectiveness_count,
  MIN(a.created_at) as first_alert_time,
  MAX(COALESCE(af.resolution_date, NOW())) as last_resolution_time
FROM brain_alerts a
LEFT JOIN brain_patterns p ON a.pattern_id = p.id
LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
GROUP BY
  DATE_TRUNC('day', a.created_at),
  a.obra_id,
  a.tenant_id,
  a.severity
WITH DATA;

CREATE INDEX idx_analytics_alerts_resolution
  ON analytics_alerts_resolution(alert_date, obra_id, severity);

-- 4. Obra KPI Summary (Multi-tenant aggregated)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_obras_kpi AS
SELECT
  o.id as obra_id,
  o.name as obra_name,
  o.tenant_id,
  o.status as obra_status,
  COUNT(DISTINCT e.id) as total_events_30d,
  COUNT(DISTINCT p.id) as active_patterns,
  COUNT(DISTINCT a.id) as total_alerts_30d,
  COUNT(DISTINCT CASE WHEN a.severity = 'CRITICAL' THEN a.id END) as critical_alerts_30d,
  ROUND(AVG(pw.weight)::NUMERIC, 3) as overall_pattern_effectiveness,
  COUNT(DISTINCT af.id) as recommendations_implemented,
  COALESCE(ROUND(SUM(af.impact_value)::NUMERIC, 2), 0) as estimated_savings,
  ROUND(
    EXTRACT(EPOCH FROM AVG(
      COALESCE(af.resolution_date, NOW()) - a.created_at
    )) / 3600,
    2
  ) as avg_alert_resolution_hours,
  CASE
    WHEN COUNT(DISTINCT a.id) > 20 THEN 'At Risk'
    WHEN COUNT(DISTINCT a.id) > 10 THEN 'Monitoring'
    WHEN COUNT(DISTINCT a.id) > 5 THEN 'Stable'
    ELSE 'Healthy'
  END as health_status,
  MAX(a.created_at) as last_alert_date,
  MAX(e.created_at) as last_event_date,
  DATE_TRUNC('day', NOW())::DATE as snapshot_date
FROM obras o
LEFT JOIN brain_events e ON o.id = e.obra_id
  AND e.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN brain_patterns p ON o.id = p.obra_id
LEFT JOIN brain_alerts a ON p.id = a.pattern_id
  AND a.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN brain_pattern_weights pw ON p.id = pw.pattern_id
LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
GROUP BY o.id, o.name, o.tenant_id, o.status
WITH DATA;

CREATE UNIQUE INDEX idx_analytics_obras_kpi
  ON analytics_obras_kpi(obra_id, snapshot_date);

-- 5. Tenant-level Consolidated Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_tenant_consolidated AS
SELECT
  t.id as tenant_id,
  t.slug as tenant_slug,
  COUNT(DISTINCT o.id) as total_obras,
  COUNT(DISTINCT CASE WHEN o.status = 'ativo' THEN o.id END) as active_obras,
  SUM(akpi.total_events_30d) as total_events_30d,
  SUM(akpi.total_alerts_30d) as total_alerts_30d,
  SUM(akpi.critical_alerts_30d) as critical_alerts_30d,
  SUM(akpi.recommendations_implemented) as total_recommendations_implemented,
  ROUND(SUM(akpi.estimated_savings)::NUMERIC, 2) as total_estimated_savings,
  ROUND(AVG(akpi.overall_pattern_effectiveness)::NUMERIC, 3) as avg_pattern_effectiveness,
  ROUND(AVG(akpi.avg_alert_resolution_hours)::NUMERIC, 2) as avg_alert_resolution_hours,
  COUNT(DISTINCT CASE WHEN akpi.health_status = 'At Risk' THEN akpi.obra_id END) as obras_at_risk,
  COUNT(DISTINCT CASE WHEN akpi.health_status = 'Healthy' THEN akpi.obra_id END) as obras_healthy,
  DATE_TRUNC('day', NOW())::DATE as snapshot_date
FROM tenants t
LEFT JOIN obras o ON t.id = o.tenant_id
LEFT JOIN analytics_obras_kpi akpi ON o.id = akpi.obra_id
GROUP BY t.id, t.slug
WITH DATA;

CREATE UNIQUE INDEX idx_analytics_tenant_consolidated
  ON analytics_tenant_consolidated(tenant_id, snapshot_date);

-- 6. Pattern Learning Metrics (for ML feedback loop)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_pattern_learning AS
SELECT
  p.pattern_type,
  p.obra_id,
  p.tenant_id,
  COUNT(DISTINCT p.id) as pattern_occurrences,
  ROUND(AVG(p.confidence)::NUMERIC, 3) as avg_confidence_score,
  ROUND(STDDEV_POP(p.confidence)::NUMERIC, 3) as confidence_std_dev,
  COUNT(DISTINCT af.id) as successful_interventions,
  ROUND(
    COUNT(DISTINCT af.id)::NUMERIC /
    NULLIF(COUNT(DISTINCT a.id), 0) * 100,
    2
  ) as intervention_success_rate,
  ROUND(AVG(pw.weight)::NUMERIC, 4) as current_weight_ema,
  COUNT(DISTINCT pw.id) as weight_update_count,
  AVG(EXTRACT(EPOCH FROM af.created_at - a.created_at) / 3600) as avg_feedback_delay_hours,
  MIN(p.created_at) as first_occurrence,
  MAX(p.created_at) as last_occurrence,
  DATE_TRUNC('day', NOW())::DATE as training_snapshot_date
FROM brain_patterns p
LEFT JOIN brain_alerts a ON p.id = a.pattern_id
LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
LEFT JOIN brain_pattern_weights pw ON p.id = pw.pattern_id
GROUP BY p.pattern_type, p.obra_id, p.tenant_id
WITH DATA;

CREATE INDEX idx_analytics_pattern_learning
  ON analytics_pattern_learning(pattern_type, obra_id);

-- Refresh schedule: materialized views should be refreshed daily via scheduled job
-- Example: SELECT refresh_analytics_views(); (stored procedure below)

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_events_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_patterns_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_alerts_resolution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_obras_kpi;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_tenant_consolidated;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_pattern_learning;
  RAISE NOTICE 'Analytics views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for analytics API
GRANT SELECT ON analytics_events_daily TO api_user;
GRANT SELECT ON analytics_patterns_summary TO api_user;
GRANT SELECT ON analytics_alerts_resolution TO api_user;
GRANT SELECT ON analytics_obras_kpi TO api_user;
GRANT SELECT ON analytics_tenant_consolidated TO api_user;
GRANT SELECT ON analytics_pattern_learning TO api_user;
