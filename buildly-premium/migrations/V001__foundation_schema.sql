-- V001: Foundation Schema — Buildly Premium Event Store
-- Phase 2: Persistence Layer
-- Created: 2026-07-23
-- Purpose: Create base tables for Event Sourcing + CQRS architecture

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create custom types
CREATE TYPE tipo_evento AS ENUM (
  'MATERIAL_DELAY',
  'COST_OVERRUN',
  'RISK_ALERT',
  'QUALITY_ISSUE',
  'RESOURCE_SHORTAGE',
  'WEATHER_IMPACT',
  'SAFETY_INCIDENT',
  'SCHEDULE_CHANGE'
);

CREATE TYPE tipo_objetivo AS ENUM (
  'execucao',
  'financeiro',
  'risco',
  'governanca',
  'planejamento',
  'recursos',
  'sustentabilidade',
  'seguranca'
);

CREATE TYPE tipo_decisao AS ENUM (
  'OPERACIONAL',
  'FINANCEIRO',
  'ESTRATEGICO',
  'EMERGENCIA'
);

CREATE TYPE status_objetivo AS ENUM (
  'Aberto',
  'Em Andamento',
  'Concluído'
);

CREATE TYPE bmi_classificacao AS ENUM (
  'CRITICO',
  'BAIXO',
  'MÉDIO',
  'BOM',
  'EXCELENTE'
);

-- 3. Create usuarios table
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_usuarios_email (email),
  INDEX idx_usuarios_role (role),
  INDEX idx_usuarios_status (status)
);

-- 4. Create Event Store (Imutável — append-only)
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key UUID UNIQUE NOT NULL,

  tipo tipo_evento NOT NULL,
  descricao TEXT NOT NULL,
  contexto JSONB NOT NULL,
  dados JSONB NOT NULL,

  criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  hash_contenido BYTEA NOT NULL,

  INDEX idx_eventos_tipo (tipo),
  INDEX idx_eventos_obra_id ((contexto->>'obra_id')),
  INDEX idx_eventos_criado_em (criado_em DESC),
  INDEX idx_eventos_criador (criador_id)
) PARTITION BY RANGE (DATE_TRUNC('month', criado_em));

-- Criar partições para próximos 12 meses
-- Será feito via migration separada ou script de setup

-- 5. Create Objetivos table (Versionado)
CREATE TABLE objetivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versao INT NOT NULL DEFAULT 1,
  versao_anterior_id UUID REFERENCES objetivos(id),

  obra_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  tipo tipo_objetivo NOT NULL,

  metrica_principal JSONB NOT NULL,
  metricas_secundarias JSONB,

  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  data_real_termino DATE,

  status status_objetivo NOT NULL DEFAULT 'Aberto',

  criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT data_logica CHECK (data_inicio < data_prevista_termino),

  INDEX idx_objetivos_obra (obra_id),
  INDEX idx_objetivos_status (status),
  INDEX idx_objetivos_tipo (tipo),
  INDEX idx_objetivos_datas (data_inicio, data_prevista_termino)
);

-- 6. Create Decisões table (Com feedback para ML)
CREATE TABLE decisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL,

  tipo tipo_decisao NOT NULL,
  descricao_situacao TEXT NOT NULL,

  opcoes JSONB NOT NULL,
  opcao_escolhida_id UUID NOT NULL,

  resultado_esperado JSONB NOT NULL,
  resultado_real JSONB,

  feedback_score SMALLINT CHECK (feedback_score IN (-1, 0, 1)),
  justificativa_feedback TEXT,
  feedback_fornecido_em TIMESTAMP,

  decisor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_decisoes_evento (evento_id),
  INDEX idx_decisoes_obra (obra_id),
  INDEX idx_decisoes_feedback (feedback_score),
  INDEX idx_decisoes_decisor (decisor_id),
  INDEX idx_decisoes_criado (criado_em DESC),
  INDEX idx_decisoes_pendente_feedback (obra_id) WHERE feedback_score IS NULL
);

-- 7. Create BMI Scores table (Time series)
CREATE TABLE bmi_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL,

  calculado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  score_geral NUMERIC(5,2) CHECK (score_geral BETWEEN 0 AND 100),
  classificacao bmi_classificacao NOT NULL,

  score_execucao NUMERIC(5,2),
  score_financeiro NUMERIC(5,2),
  score_risco NUMERIC(5,2),
  score_governanca NUMERIC(5,2),
  score_planejamento NUMERIC(5,2),
  score_recursos NUMERIC(5,2),
  score_sustentabilidade NUMERIC(5,2),
  score_seguranca NUMERIC(5,2),

  detalhe_execucao JSONB,
  detalhe_financeiro JSONB,
  detalhe_risco JSONB,
  detalhe_governanca JSONB,
  detalhe_planejamento JSONB,
  detalhe_recursos JSONB,
  detalhe_sustentabilidade JSONB,
  detalhe_seguranca JSONB,

  mudanca_desde_ultimo_calculo NUMERIC(5,2),

  INDEX idx_bmi_obra_tempo (obra_id, calculado_em DESC),
  INDEX idx_bmi_classificacao (classificacao),
  INDEX idx_bmi_calculado (calculado_em DESC)
) PARTITION BY RANGE (DATE_TRUNC('quarter', calculado_em));

-- 8. Create Obras table
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  localizacao VARCHAR(255),

  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  data_real_termino DATE,

  orcamento_total NUMERIC(15,2) NOT NULL,
  gasto_atual NUMERIC(15,2) DEFAULT 0,

  status VARCHAR(20) NOT NULL DEFAULT 'planejamento',
  conclusao_pct INT CHECK (conclusao_pct BETWEEN 0 AND 100),

  gerente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_obras_status (status),
  INDEX idx_obras_gerente (gerente_id),
  INDEX idx_obras_datas (data_inicio, data_prevista_termino)
);

-- 9. Create Model Registry (para Phase 3.1)
CREATE TABLE model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,

  model_bytes BYTEA NOT NULL,
  metrics JSONB NOT NULL,
  feature_importance JSONB NOT NULL,

  trained_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  training_duration_seconds INT,

  improvement_f1 NUMERIC(5,2),
  status VARCHAR(20) NOT NULL DEFAULT 'registered',

  INDEX idx_model_version (version),
  INDEX idx_model_trained_at (trained_at DESC),
  INDEX idx_model_status (status)
);

-- 10. Create Recommendation Logs (para Phase 3.1)
CREATE TABLE recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL,

  recomendacoes JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_recom_evento (evento_id),
  INDEX idx_recom_obra (obra_id),
  INDEX idx_recom_timestamp (timestamp DESC)
);

-- 11. Criar trigger para versionamento de Objetivos
CREATE OR REPLACE FUNCTION objetivo_versionamento()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO objetivos (
      versao, versao_anterior_id, obra_id, descricao, tipo,
      metrica_principal, metricas_secundarias,
      data_inicio, data_prevista_termino, data_real_termino,
      status, criador_id, atualizado_em
    )
    VALUES (
      OLD.versao + 1,
      OLD.id,
      NEW.obra_id,
      NEW.descricao,
      NEW.tipo,
      NEW.metrica_principal,
      NEW.metricas_secundarias,
      NEW.data_inicio,
      NEW.data_prevista_termino,
      NEW.data_real_termino,
      NEW.status,
      NEW.criador_id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER objetivo_versionamento_trigger
AFTER UPDATE ON objetivos
FOR EACH ROW EXECUTE FUNCTION objetivo_versionamento();

-- 12. Criar índices adicionais para performance
CREATE INDEX idx_eventos_tipo_tempo ON eventos (tipo, criado_em DESC);
CREATE INDEX idx_decisoes_feedback_tipo ON decisoes (feedback_score, tipo);
CREATE INDEX idx_objetivos_abertos ON objetivos (obra_id) WHERE status != 'Concluído';

-- 13. Create partial index para decisões recentes
CREATE INDEX idx_decisoes_recentes ON decisoes (obra_id, criado_em DESC)
WHERE criado_em > NOW() - INTERVAL '90 days';

-- 14. Create JSONB index para queries rápidas
CREATE INDEX idx_eventos_contexto ON eventos USING GIN (contexto);
CREATE INDEX idx_decisoes_opcoes ON decisoes USING GIN (opcoes);

-- 15. Comentários de documentação
COMMENT ON TABLE eventos IS 'Event Store (Imutável) — Registro de todos os eventos da obra';
COMMENT ON TABLE objetivos IS 'Objetivo Store (Versionado) — Metas e KPIs';
COMMENT ON TABLE decisoes IS 'Decision Store — Histórico de decisões com feedback para ML';
COMMENT ON TABLE bmi_scores IS 'BMI Score History — Time series de scores de maturidade';
COMMENT ON TABLE model_registry IS 'Model Registry — Versionamento de modelos ML';
COMMENT ON TABLE recommendation_logs IS 'Recommendation Logs — Auditoria de recomendações';

-- Fim da migration V001
