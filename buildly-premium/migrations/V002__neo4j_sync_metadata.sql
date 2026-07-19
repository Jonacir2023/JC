-- V002: Neo4j Sync Metadata — Event Sourcing to Graph Synchronization
-- Phase 2: Persistence Layer + Neo4j Integration
-- Created: 2026-07-23
-- Purpose: Track which events have been synced to Neo4j graph database

-- 1. Create Neo4j sync tracking table
CREATE TABLE neo4j_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL UNIQUE REFERENCES eventos(id) ON DELETE CASCADE,

  -- Graph metadata
  neo4j_node_id BIGINT,
  neo4j_labels VARCHAR(255)[],  -- ['EVENTO', 'MATERIAL_DELAY', etc]

  -- Sync tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',  -- pendente, sincronizado, erro
  tentativas INT DEFAULT 0,
  proximo_retry TIMESTAMP,

  -- Error tracking
  erro_msg TEXT,
  erro_tipo VARCHAR(100),

  -- Timestamps
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sincronizado_em TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT status_valido CHECK (status IN ('pendente', 'sincronizado', 'erro')),

  INDEX idx_sync_status (status),
  INDEX idx_sync_evento_id (evento_id),
  INDEX idx_sync_proximo_retry (proximo_retry) WHERE status = 'erro',
  INDEX idx_sync_timestamp (sincronizado_em DESC)
);

-- 2. Create function para marcar novo evento como pendente
CREATE OR REPLACE FUNCTION marcar_novo_evento_sync_pendente()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO neo4j_sync_status (evento_id, status)
  VALUES (NEW.id, 'pendente')
  ON CONFLICT (evento_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para novo evento
CREATE TRIGGER novo_evento_sync_trigger
AFTER INSERT ON eventos
FOR EACH ROW
EXECUTE FUNCTION marcar_novo_evento_sync_pendente();

-- 4. Create function para retry automático de sync falhos
CREATE OR REPLACE FUNCTION auto_retry_sync_falhos()
RETURNS void AS $$
BEGIN
  UPDATE neo4j_sync_status
  SET
    status = 'pendente',
    tentativas = tentativas + 1,
    proximo_retry = NULL,
    atualizado_em = NOW()
  WHERE status = 'erro'
    AND tentativas < 3  -- máximo 3 tentativas
    AND proximo_retry IS NOT NULL
    AND proximo_retry <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Create table para sync metrics (agregadas)
CREATE TABLE neo4j_sync_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  data_metrica DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Totals
  total_eventos INT DEFAULT 0,
  total_sincronizados INT DEFAULT 0,
  total_pendentes INT DEFAULT 0,
  total_erros INT DEFAULT 0,

  -- Performance
  tempo_medio_sync_ms INT,
  tempo_max_sync_ms INT,

  -- Sucesso
  taxa_sucesso NUMERIC(5,2),  -- percentage

  -- Timestamps
  calculado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (data_metrica),

  INDEX idx_metrics_data (data_metrica DESC)
);

-- 6. Create function para calcular métricas diárias
CREATE OR REPLACE FUNCTION calcular_sync_metrics_diarias()
RETURNS void AS $$
DECLARE
  v_total INT;
  v_sincronizados INT;
  v_pendentes INT;
  v_erros INT;
  v_taxa_sucesso NUMERIC;
BEGIN
  -- Agregar do dia
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'sincronizado'),
    COUNT(*) FILTER (WHERE status = 'pendente'),
    COUNT(*) FILTER (WHERE status = 'erro')
  INTO v_total, v_sincronizados, v_pendentes, v_erros
  FROM neo4j_sync_status
  WHERE DATE(criado_em) = CURRENT_DATE;

  v_taxa_sucesso := CASE
    WHEN v_total = 0 THEN 0
    ELSE (v_sincronizados::NUMERIC / v_total * 100)
  END;

  -- Inserir ou atualizar métrica do dia
  INSERT INTO neo4j_sync_metrics (
    data_metrica, total_eventos, total_sincronizados,
    total_pendentes, total_erros, taxa_sucesso
  )
  VALUES (CURRENT_DATE, v_total, v_sincronizados, v_pendentes, v_erros, v_taxa_sucesso)
  ON CONFLICT (data_metrica) DO UPDATE
  SET
    total_eventos = v_total,
    total_sincronizados = v_sincronizados,
    total_pendentes = v_pendentes,
    total_erros = v_erros,
    taxa_sucesso = v_taxa_sucesso,
    calculado_em = NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. Create view para status atual de sync
CREATE VIEW v_neo4j_sync_status AS
SELECT
  COUNT(*) as total_eventos,
  COUNT(*) FILTER (WHERE status = 'sincronizado') as sincronizados,
  COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
  COUNT(*) FILTER (WHERE status = 'erro') as erros,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sincronizado')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as taxa_sucesso_pct,
  MAX(sincronizado_em) as ultimo_sync
FROM neo4j_sync_status;

-- 8. Comments para documentação
COMMENT ON TABLE neo4j_sync_status IS 'Tracks synchronization status of events to Neo4j graph database';
COMMENT ON TABLE neo4j_sync_metrics IS 'Daily aggregated metrics for Neo4j sync performance';
COMMENT ON VIEW v_neo4j_sync_status IS 'Real-time view of synchronization status';

-- 9. Initial sync of existing eventos (if any)
-- This would be a data migration step
-- INSERT INTO neo4j_sync_status (evento_id, status)
-- SELECT id, 'pendente' FROM eventos
-- ON CONFLICT (evento_id) DO NOTHING;

-- Fim da migration V002
