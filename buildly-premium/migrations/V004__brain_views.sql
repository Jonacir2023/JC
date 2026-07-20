-- Migration V004: Brain Statistics Views
-- PostgreSQL materialized views for Brain dashboard

-- ============================================================
-- VIEWS FOR BRAIN MONITORING
-- ============================================================

-- View 1: Brain Statistics (real-time)
CREATE OR REPLACE VIEW v_brain_stats AS
SELECT
    d.obra_id,
    COUNT(DISTINCT d.id) as total_rdos_processed,
    SUM(CASE WHEN d.brain_processado = true THEN 1 ELSE 0 END) as total_rdos_extracted,
    SUM(CASE WHEN d.brain_processado = false THEN 1 ELSE 0 END) as pending_extraction,
    MAX(d.brain_processado_em) as last_extraction_time,
    COUNT(DISTINCT CASE WHEN d.brain_error_message IS NOT NULL THEN d.id END) as extraction_errors,
    ROUND(
        COUNT(DISTINCT CASE WHEN d.brain_processado = true THEN d.id END)::numeric /
        NULLIF(COUNT(DISTINCT d.id), 0) * 100, 2
    ) as extraction_success_rate
FROM diario_obras d
GROUP BY d.obra_id;

-- View 2: Top Lessons (most impactful)
CREATE OR REPLACE VIEW v_top_lessons AS
SELECT
    obra_id,
    rdo_id,
    resumo,
    resultado,
    impacto_economia,
    impacto_prazo_dias,
    confiabilidade,
    criado_em,
    ROW_NUMBER() OVER (
        PARTITION BY obra_id
        ORDER BY confiabilidade DESC, impacto_economia DESC
    ) as rank
FROM neo4j_lessons_export
WHERE confiabilidade > 0.70;

-- View 3: Recurring Risks (patterns)
CREATE OR REPLACE VIEW v_recurring_risks AS
SELECT
    obra_id,
    tipo_evento,
    COUNT(*) as frequency,
    ROUND(AVG(confiabilidade), 3) as avg_confidence,
    ROUND(AVG(impacto_economia), 0) as avg_impact_economia,
    STRING_AGG(DISTINCT risk, ', ' ORDER BY risk) as risks_identified,
    ROUND(
        COUNT(CASE WHEN resultado = 'sucesso' THEN 1 END)::numeric /
        NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate
FROM neo4j_lessons_export,
LATERAL unnest(risks) as risk
WHERE tipo_evento IN ('ATRASO_MATERIAL', 'ATRASO_MÃO_OBRA', 'QUALIDADE', 'CUSTO')
GROUP BY obra_id, tipo_evento
HAVING COUNT(*) > 1
ORDER BY frequency DESC;

-- View 4: Event Type Patterns (aggregated)
CREATE OR REPLACE VIEW v_event_patterns AS
SELECT
    obra_id,
    tipo_evento,
    COUNT(*) as total_occurrences,
    ROUND(
        COUNT(CASE WHEN resultado = 'sucesso' THEN 1 END)::numeric /
        NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate,
    ROUND(
        COUNT(CASE WHEN resultado = 'falha' THEN 1 END)::numeric /
        NULLIF(COUNT(*), 0) * 100, 2
    ) as failure_rate,
    ROUND(AVG(impacto_economia), 0) as avg_impact,
    MAX(impacto_economia) as max_impact,
    MIN(impacto_economia) as min_impact,
    STRING_AGG(DISTINCT decision, ', ' ORDER BY decision) as common_solutions
FROM neo4j_lessons_export,
LATERAL unnest(solucoes) as decision
GROUP BY obra_id, tipo_evento;

-- View 5: Seasonal Patterns (by month)
CREATE OR REPLACE VIEW v_seasonal_patterns AS
SELECT
    obra_id,
    EXTRACT(MONTH FROM data::date) as mes,
    COUNT(*) as incidents_this_month,
    ROUND(AVG(impacto_prazo_dias), 2) as avg_delay_days,
    ROUND(
        COUNT(CASE WHEN resultado = 'sucesso' THEN 1 END)::numeric /
        NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate,
    STRING_AGG(DISTINCT tipo_evento, ', ' ORDER BY tipo_evento) as event_types,
    COUNT(DISTINCT tipo_evento) as unique_event_count
FROM neo4j_lessons_export
WHERE data IS NOT NULL
GROUP BY obra_id, EXTRACT(MONTH FROM data::date)
ORDER BY mes;

-- View 6: Brain Health Metrics
CREATE OR REPLACE VIEW v_brain_health AS
SELECT
    obra_id,
    (SELECT COUNT(*) FROM neo4j_lessons_export WHERE obra_id = d.obra_id) as total_lessons,
    ROUND(
        (SELECT AVG(confiabilidade) FROM neo4j_lessons_export WHERE obra_id = d.obra_id),
        3
    ) as avg_confidence,
    (SELECT COUNT(*) FROM neo4j_lessons_export
     WHERE obra_id = d.obra_id AND resultado = 'sucesso') as successful_lessons,
    (SELECT COUNT(*) FROM neo4j_lessons_export
     WHERE obra_id = d.obra_id AND resultado = 'falha') as failed_lessons,
    (SELECT MAX(criado_em) FROM neo4j_lessons_export WHERE obra_id = d.obra_id) as last_lesson_date,
    (SELECT COUNT(DISTINCT tipo_evento) FROM neo4j_lessons_export
     WHERE obra_id = d.obra_id) as unique_event_types,
    CASE
        WHEN (SELECT COUNT(*) FROM neo4j_lessons_export WHERE obra_id = d.obra_id) < 10 THEN 'INITIALIZING'
        WHEN (SELECT AVG(confiabilidade) FROM neo4j_lessons_export WHERE obra_id = d.obra_id) < 0.65 THEN 'LOW_CONFIDENCE'
        WHEN (SELECT COUNT(*) FROM neo4j_lessons_export WHERE obra_id = d.obra_id) < 50 THEN 'GROWING'
        WHEN (SELECT COUNT(*) FROM neo4j_lessons_export WHERE obra_id = d.obra_id) >= 50 THEN 'MATURE'
        ELSE 'UNKNOWN'
    END as brain_maturity
FROM diario_obras d
GROUP BY d.obra_id;

-- ============================================================
-- MATERIALIZED VIEWS (Refreshed daily)
-- ============================================================

CREATE MATERIALIZED VIEW mv_brain_insights AS
SELECT
    obra_id,
    'MOST_COMMON_ISSUE' as insight_type,
    tipo_evento as insight_category,
    (SELECT COUNT(*) FROM neo4j_lessons_export nl
     WHERE nl.obra_id = nle.obra_id AND nl.tipo_evento = nle.tipo_evento) as frequency
FROM neo4j_lessons_export nle
WHERE (nle.obra_id, nle.tipo_evento) IN (
    SELECT obra_id, tipo_evento
    FROM neo4j_lessons_export
    GROUP BY obra_id, tipo_evento
    HAVING COUNT(*) >= 2
)
UNION ALL
SELECT
    obra_id,
    'BEST_SOLUTION' as insight_type,
    solution as insight_category,
    (SELECT COUNT(*) FROM neo4j_lessons_export nl
     WHERE nl.obra_id = nle.obra_id
       AND 'SOLUTION_HERE' = ANY(nl.solucoes)) as frequency
FROM neo4j_lessons_export nle,
LATERAL unnest(nle.solucoes) as solution
WHERE resultado = 'sucesso';

CREATE INDEX idx_mv_brain_insights ON mv_brain_insights(obra_id, insight_type);

-- ============================================================
-- REFRESH STRATEGY
-- ============================================================

-- Schedule daily refresh at 03:00 UTC (after extraction completes at 02:00)
-- Using pg_cron extension (must be enabled first):
-- SELECT cron.schedule('refresh_brain_views', '0 3 * * *', 'REFRESH MATERIALIZED VIEW mv_brain_insights');

-- Manual refresh command:
-- REFRESH MATERIALIZED VIEW mv_brain_insights;

-- ============================================================
-- AUDIT TABLE FOR EXTRACTION LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS brain_extraction_audit (
    id BIGSERIAL PRIMARY KEY,
    obra_id VARCHAR(50) NOT NULL,
    rdo_id VARCHAR(50) NOT NULL UNIQUE,
    extraction_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL, -- success|error|skipped
    lessons_extracted INT DEFAULT 0,
    extraction_duration_ms INT,
    error_message TEXT,
    claude_tokens_used INT,
    claude_cost_usd DECIMAL(10, 4),
    neo4j_write_time_ms INT,
    similarity_links_created INT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_obra_id ON brain_extraction_audit(obra_id);
CREATE INDEX idx_audit_status ON brain_extraction_audit(status);
CREATE INDEX idx_audit_timestamp ON brain_extraction_audit(extraction_timestamp DESC);

-- ============================================================
-- PERFORMANCE QUERIES FOR MONITORING
-- ============================================================

-- Query extraction pipeline health
CREATE OR REPLACE FUNCTION check_extraction_health()
RETURNS TABLE (
    last_successful_extraction TIMESTAMP,
    hours_since_extraction NUMERIC,
    total_extractions_24h INT,
    success_rate_24h DECIMAL(5,2),
    avg_extraction_time_ms INT,
    total_claude_cost_24h DECIMAL(10, 4)
) AS $$
SELECT
    MAX(extraction_timestamp),
    EXTRACT(EPOCH FROM (NOW() - MAX(extraction_timestamp))) / 3600,
    COUNT(*),
    ROUND(COUNT(CASE WHEN status = 'success' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2),
    ROUND(AVG(extraction_duration_ms), 0)::INT,
    COALESCE(SUM(claude_cost_usd), 0)
FROM brain_extraction_audit
WHERE extraction_timestamp > NOW() - INTERVAL '24 hours';
$$ LANGUAGE SQL;

-- Query Brain statistical trends
CREATE OR REPLACE FUNCTION get_brain_trends(p_obra_id VARCHAR(50), p_days INT = 30)
RETURNS TABLE (
    date DATE,
    total_lessons INT,
    new_lessons_today INT,
    avg_confidence DECIMAL(5,3),
    success_rate DECIMAL(5,2)
) AS $$
SELECT
    DATE(criado_em),
    COUNT(*) OVER (PARTITION BY DATE(criado_em)) as total_lessons,
    COUNT(*) as new_lessons,
    ROUND(AVG(confiabilidade)::numeric, 3) as avg_confidence,
    ROUND(COUNT(CASE WHEN resultado = 'sucesso' THEN 1 END)::numeric /
          NULLIF(COUNT(*), 0) * 100, 2) as success_rate
FROM neo4j_lessons_export
WHERE obra_id = p_obra_id
  AND criado_em > NOW() - (p_days || ' days')::INTERVAL
GROUP BY DATE(criado_em)
ORDER BY DATE(criado_em) DESC;
$$ LANGUAGE SQL;

-- ============================================================
-- ALERTS FOR BRAIN HEALTH
-- ============================================================

CREATE OR REPLACE FUNCTION alert_extraction_failures()
RETURNS TABLE (
    alert_type VARCHAR,
    obra_id VARCHAR(50),
    message TEXT,
    severity VARCHAR
) AS $$
SELECT
    'EXTRACTION_FAILED' as alert_type,
    obra_id,
    CONCAT('Extraction failed ', COUNT(*), ' times in last 24 hours'),
    CASE WHEN COUNT(*) >= 3 THEN 'CRITICAL' ELSE 'WARNING' END
FROM brain_extraction_audit
WHERE status = 'error'
  AND extraction_timestamp > NOW() - INTERVAL '24 hours'
GROUP BY obra_id
HAVING COUNT(*) >= 1
UNION ALL
SELECT
    'NO_RECENT_EXTRACTIONS' as alert_type,
    obra_id,
    CONCAT('No extractions in last 48 hours (last: ', MAX(extraction_timestamp), ')'),
    'WARNING'
FROM brain_extraction_audit
GROUP BY obra_id
HAVING MAX(extraction_timestamp) < NOW() - INTERVAL '48 hours';
$$ LANGUAGE SQL;
