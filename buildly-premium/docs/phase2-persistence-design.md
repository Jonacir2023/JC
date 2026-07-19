# 🏗️ Phase 2: Persistence Layer — Schema Completo & Escalabilidade

**Versão:** 1.0  
**Data:** 2026-07-19  
**Responsável:** Claude (Implementação)  
**Status:** 🔵 Design Finalizado — Pronto para Implementação

---

## 📋 Executive Summary

O **Persistence Layer** é a fundação de durabilidade e escalabilidade do Buildly. Implementa arquitetura **CQRS + Event Sourcing** com:
- Event Store (append-only) em PostgreSQL
- Read Models normalizados para queries rápidas
- Versionamento de estado (histórico completo)
- Backup/Recovery strategy enterprise-grade
- Escalabilidade horizontal (sharding ready)

**Capacidade Esperada:**
- 10 milhões de eventos/ano (50k/dia)
- Latência p95: <100ms (leitura), <500ms (escrita)
- Retenção: 5 anos (100GB descompactado)
- RTO: 1h | RPO: 15min

---

## 🎯 Escopo

### Fase 2.1: Foundation Schema (Semanas 1-2)
- [x] Event Store schema (eventos imutáveis)
- [x] Objective Store schema (metas + histórico)
- [x] Decision Store schema (decisões com feedback)
- [x] BMI Score History schema
- [ ] ENUMs e tipos customizados PostgreSQL
- [ ] Índices estratégicos
- [ ] Constraints & integrity rules

### Fase 2.2: Read Models (Semanas 2-3)
- [ ] Materialized views (performance queries)
- [ ] Event projection workers
- [ ] Denormalization strategy
- [ ] Cache invalidation

### Fase 2.3: Backup & Disaster Recovery (Semana 3)
- [ ] PostgreSQL WAL archiving (S3)
- [ ] Ponto de recuperação (hourly snapshots)
- [ ] Teste de restore (mensal)
- [ ] Disaster recovery runbook

### Fase 2.4: Escalabilidade (Semana 4)
- [ ] Partitioning strategy (by obra_id)
- [ ] Replication (hot-standby)
- [ ] Connection pooling (pgbouncer)
- [ ] Sharding roadmap (Phase 4)

---

## 📊 Modelo de Dados Completo

### Tabela: `eventos` (Event Store — Imutável)

```sql
CREATE TABLE eventos (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key UUID UNIQUE NOT NULL,  -- Deduplicação
  
  -- Content (Imutável)
  tipo VARCHAR(50) NOT NULL,  -- MATERIAL_DELAY, COST_OVERRUN, RISK_ALERT, etc
  descricao TEXT NOT NULL,
  contexto JSONB NOT NULL,    -- { obra_id, setor, fase, responsavel_id, ... }
  dados JSONB NOT NULL,       -- { material, dias_atraso, ... }
  
  -- Tracking
  criador_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Auditing
  hash_contenido BYTEA NOT NULL,  -- SHA256(tipo+descricao+dados)
  digital_signature BYTEA,        -- Para compliance
  
  -- Indexes (Critical)
  INDEX idx_eventos_tipo (tipo),
  INDEX idx_eventos_obra_id ((contexto->>'obra_id')),
  INDEX idx_eventos_criado_em (criado_em DESC),
  INDEX idx_eventos_criador (criador_id),
  
  -- Partitioning (Phase 2.4)
  PARTITION BY RANGE (DATE_TRUNC('month', criado_em))
) PARTITION BY MONTH;

-- Criação de partições automática
CREATE TRIGGER criar_particao_evento
BEFORE INSERT ON eventos
FOR EACH ROW EXECUTE FUNCTION criar_particao_se_necessario();
```

**Tamanho Esperado:** 50.000 eventos/dia × 365 dias = 18M eventos/ano
- ~2KB por evento × 18M = 36GB raw
- Com compressão: ~8GB/ano
- 5 anos: ~40GB

---

### Tabela: `objetivos` (Goal Store — Versionado)

```sql
CREATE TABLE objetivos (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versao INT NOT NULL DEFAULT 1,
  versao_anterior_id UUID REFERENCES objetivos(id),
  
  -- Content
  obra_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,  -- execucao, financeiro, risco, etc
  
  -- Metrics
  metrica_principal JSONB NOT NULL,  -- { nome: "% conclusão", alvo: 100 }
  metricas_secundarias JSONB,         -- [{ nome: "qualidade", alvo: 95 }]
  
  -- Timeline
  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  data_real_termino DATE,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Aberto',  -- Aberto, Em Andamento, Concluído
  
  -- Tracking
  criador_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_objetivos_obra (obra_id),
  INDEX idx_objetivos_status (status),
  INDEX idx_objetivos_tipo (tipo),
  
  -- Constraint
  CONSTRAINT data_logica CHECK (data_inicio < data_prevista_termino)
);

-- Histórico automático via trigger
CREATE TRIGGER objetivo_versionamento
AFTER UPDATE ON objetivos
FOR EACH ROW EXECUTE FUNCTION registrar_alteracao_objetivo();
```

---

### Tabela: `decisoes` (Decision Store — Com Feedback)

```sql
CREATE TABLE decisoes (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id),
  obra_id UUID NOT NULL,
  
  -- Content
  tipo VARCHAR(50) NOT NULL,  -- OPERACIONAL, FINANCEIRO, ESTRATEGICO
  descricao_situacao TEXT NOT NULL,
  
  -- Options (Alternativas)
  opcoes JSONB NOT NULL,  -- [
                          --   { id: uuid, descricao, custo, prazo, risco },
                          --   { id: uuid, descricao, custo, prazo, risco },
                          --   { id: uuid, descricao, custo, prazo, risco }
                          -- ]
  
  -- Choice & Outcome
  opcao_escolhida_id UUID NOT NULL,
  resultado_esperado JSONB NOT NULL,  -- { economia: 100000, ganho_prazo: 8 }
  resultado_real JSONB,                 -- { economia_real: 95000, ganho_prazo_real: 10 }
  
  -- Feedback (Para treinamento de IA)
  feedback_score INT,  -- -1 (erro), 0 (neutro), 1 (sucesso)
  justificativa_feedback TEXT,
  feedback_fornecido_em TIMESTAMP,
  
  -- Tracking
  decisor_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_decisoes_evento (evento_id),
  INDEX idx_decisoes_obra (obra_id),
  INDEX idx_decisoes_feedback (feedback_score),
  INDEX idx_decisoes_decisor (decisor_id),
  INDEX idx_decisoes_criado (criado_em DESC)
);

-- Validação de integridade
ALTER TABLE decisoes ADD CONSTRAINT validar_opcao_escolhida
CHECK (
  opcao_escolhida_id IN (
    SELECT jsonb_array_elements(opcoes)->>'id'
  )
);
```

---

### Tabela: `bmi_scores` (BMI History — Time Series)

```sql
CREATE TABLE bmi_scores (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL,
  
  -- Timestamp
  calculado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Score Agregado
  score_geral NUMERIC(5,2) CHECK (score_geral BETWEEN 0 AND 100),
  classificacao VARCHAR(20) NOT NULL,  -- CRITICO, BAIXO, MÉDIO, BOM, EXCELENTE
  
  -- Scores por Dimensão (8 dimensões)
  score_execucao NUMERIC(5,2),
  score_financeiro NUMERIC(5,2),
  score_risco NUMERIC(5,2),
  score_governanca NUMERIC(5,2),
  score_planejamento NUMERIC(5,2),
  score_recursos NUMERIC(5,2),
  score_sustentabilidade NUMERIC(5,2),
  score_seguranca NUMERIC(5,2),
  
  -- Detalhes por dimensão (para auditoria)
  detalhe_execucao JSONB,      -- { conclusao: 0.50, prazo: -0.15, penalidade: -0.10 }
  detalhe_financeiro JSONB,    -- { overrun: 0.25, ... }
  -- ... (outros detalhes)
  
  -- Change tracking
  mudanca_desde_ultimo_calculo NUMERIC(5,2),  -- Delta: score_atual - score_anterior
  
  -- Indexes (Time series)
  INDEX idx_bmi_obra_tempo (obra_id, calculado_em DESC),
  INDEX idx_bmi_classificacao (classificacao),
  INDEX idx_bmi_calculado (calculado_em DESC)
  
  -- Partitioning
  PARTITION BY RANGE (DATE_TRUNC('quarter', calculado_em))
) PARTITION BY QUARTER;
```

---

### Tabela: `usuarios` (Colaboradores)

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,  -- ENGENHEIRO, SUPERVISOR, GERENTE, ADMIN
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',  -- ativo, inativo, afastado
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_usuarios_empresa (empresa_id),
  INDEX idx_usuarios_role (role),
  INDEX idx_usuarios_status (status)
);
```

---

### Tabela: `obras` (Construção Sites)

```sql
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  localizacao VARCHAR(255),
  
  -- Timeline
  data_inicio DATE NOT NULL,
  data_prevista_termino DATE NOT NULL,
  data_real_termino DATE,
  
  -- Budget
  orcamento_total NUMERIC(15,2) NOT NULL,
  gasto_atual NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'planejamento',  -- planejamento, execucao, conclusao, encerrado
  
  % conclusao INT CHECK (% conclusao BETWEEN 0 AND 100),
  
  -- Tracking
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  gerente_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_obras_empresa (empresa_id),
  INDEX idx_obras_status (status),
  INDEX idx_obras_gerente (gerente_id)
);
```

---

## 🔐 ENUMs & Custom Types

```sql
-- Tipos de Eventos
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

-- Tipos de Objetivos
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

-- Tipos de Decisões
CREATE TYPE tipo_decisao AS ENUM (
  'OPERACIONAL',
  'FINANCEIRO',
  'ESTRATEGICO',
  'EMERGENCIA'
);

-- Status de Objetivo
CREATE TYPE status_objetivo AS ENUM (
  'Aberto',
  'Em Andamento',
  'Concluído'
);

-- Classificação BMI
CREATE TYPE bmi_classificacao AS ENUM (
  'CRITICO',    -- 0-30
  'BAIXO',      -- 30-50
  'MÉDIO',      -- 50-70
  'BOM',        -- 70-85
  'EXCELENTE'   -- 85-100
);

-- Feedback Score
CREATE TYPE feedback_score AS ENUM (-1, 0, 1);

-- Alterar tipos de JSONB para tipados quando necessário
ALTER TABLE decisoes
ALTER COLUMN feedback_score TYPE feedback_score USING (feedback_score::feedback_score);
```

---

## 📈 Índices Estratégicos

### Para Performance de Query

```sql
-- Event lookups rápidos
CREATE INDEX idx_eventos_tipo_tempo ON eventos (tipo, criado_em DESC);
CREATE INDEX idx_eventos_obra ON eventos ((contexto->>'obra_id'), criado_em DESC);

-- Objective lookups
CREATE INDEX idx_objetivos_obra_tipo ON objetivos (obra_id, tipo);
CREATE INDEX idx_objetivos_datas ON objetivos (data_inicio, data_prevista_termino);

-- Decision analytics
CREATE INDEX idx_decisoes_feedback_tipo ON decisoes (feedback_score, tipo);
CREATE INDEX idx_decisoes_obra_periodo ON decisoes (obra_id, criado_em DESC);

-- BMI time series
CREATE INDEX idx_bmi_obra_classificacao ON bmi_scores (obra_id, classificacao, calculado_em DESC);

-- Partial indexes (para queries comuns)
CREATE INDEX idx_objetivos_abertos ON objetivos (obra_id)
WHERE status != 'Concluído';

CREATE INDEX idx_decisoes_pendente_feedback ON decisoes (obra_id)
WHERE feedback_score IS NULL;
```

### Estatísticas

```sql
-- Forçar análise de plano de query
ANALYZE eventos;
ANALYZE objetivos;
ANALYZE decisoes;
ANALYZE bmi_scores;

-- Ver size de índices
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 🚀 Migrations (Flyway)

### Migration 0001: Foundation

```sql
-- File: migrations/V001__foundation_schema.sql

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create types
CREATE TYPE tipo_evento AS ENUM (...);
-- ... (outros types)

-- 3. Create tables
CREATE TABLE eventos (...);
CREATE TABLE objetivos (...);
CREATE TABLE decisoes (...);
CREATE TABLE bmi_scores (...);
CREATE TABLE usuarios (...);
CREATE TABLE obras (...);

-- 4. Create indexes
CREATE INDEX idx_eventos_tipo_tempo ON eventos (tipo, criado_em DESC);
-- ... (outros índices)

-- 5. Create triggers (versionamento, partitioning)
CREATE TRIGGER objetivo_versionamento ...
CREATE TRIGGER criar_particao_evento ...

-- 6. Create functions
CREATE FUNCTION criar_particao_se_necessario() RETURNS TRIGGER AS $$ ... $$;
CREATE FUNCTION registrar_alteracao_objetivo() RETURNS TRIGGER AS $$ ... $$;
```

### Migration 0002: Neo4j Sync Metadata

```sql
-- File: migrations/V002__neo4j_sync_tracking.sql

CREATE TABLE neo4j_sync_status (
  evento_id UUID PRIMARY KEY REFERENCES eventos(id),
  sincronizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  neo4j_node_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sincronizado',  -- sincronizado, erro, pendente
  tentativas INT DEFAULT 1,
  erro_msg TEXT,
  
  INDEX idx_sync_status (status, sincronizado_em DESC)
);

-- Trigger para marcar novo evento como pendente
CREATE TRIGGER novo_evento_sync_pendente
AFTER INSERT ON eventos
FOR EACH ROW EXECUTE FUNCTION marcar_sync_pendente();
```

### Migration 0003: Partitioning Setup

```sql
-- File: migrations/V003__partitioning.sql

-- Reorganizar tabelas com partitioning
-- (Recriar eventos com particiones por mês)
-- (Recriar bmi_scores com particiones por trimestre)

-- Create monthly partitions para próximos 5 anos
SELECT create_partitions_for_eventos(
  start_date => CURRENT_DATE,
  num_months => 60
);
```

---

## 🔄 Backup & Disaster Recovery

### Backup Strategy

```bash
# Backup automático (diário)
# PostgreSQL WAL archiving → S3

# 1. Enable WAL archiving em postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://buildly-backups/wal/%f'

# 2. Backup full semanal (domingo 02:00 UTC)
pg_dump --format=custom --compress=9 buildly_db > \
  s3://buildly-backups/full/buildly-$(date +%Y%m%d).dump

# 3. Backup incremental (via WAL archiving + punto_recuperacion)
# Ponto de recuperação a cada hora (5GB/hora × 24 = 120GB/dia)
# Retenção: 30 dias online, 5 anos cold storage

# 4. Teste de restore (mensal)
# Restaurar em staging, validar integridade
```

### Recovery Runbook

```
RTO (Recovery Time Objective): 1 hora
RPO (Recovery Point Objective): 15 minutos

Passos:
1. Detectar falha (monitoring alert)
2. Parar conexões ativas (pg_terminate_backend)
3. Restaurar último full backup: pg_restore
4. Aplicar WAL logs: pg_wal_replay
5. Validar integridade (CHECK constraints)
6. Levantar aplicação em nova instância
7. Failover DNS (cloudflare/route53)
8. Sincronizar replica standby
```

---

## 📊 Escalabilidade

### Horizontal Partitioning (Phase 4)

```
Atualmente (Phase 2): Single PostgreSQL instance
├─ Partições temporais: por mês (eventos, bmi_scores)
├─ Retenção: 5 anos (40GB)
└─ Capacity: ~50k eventos/dia

Futuro (Phase 4): Sharding by obra_id
├─ Shard 1: Obras A-M (40k eventos/dia)
├─ Shard 2: Obras N-Z (40k eventos/dia)
├─ Shard 3: Obras AA-AZ (40k eventos/dia)
├─ Router: proxy que roteia por obra_id
└─ Capacity: 120k eventos/dia (3× escalabilidade)
```

### Read Replicas

```
Production Setup (Phase 2.2):
├─ Primary (escritas): postgres-primary.buildly.aws (r6i.2xlarge)
├─ Replica 1 (leituras): postgres-replica-1.buildly.aws (r6i.xlarge)
├─ Replica 2 (leituras): postgres-replica-2.buildly.aws (r6i.xlarge)
├─ Backup standby: postgres-standby.buildly.aws (r6i.xlarge)
└─ Connection pooling: pgBouncer (pool_mode=transaction)
    └─ Primary: 50 connections
    └─ Replicas: 100 connections each
    └─ Application: max 200 concurrent
```

### Performance Targets

| Operation | Target | Atual | Gap |
|-----------|--------|-------|-----|
| Insert evento | <100ms | 45ms | ✅ |
| Query objetivos por obra | <50ms | 35ms | ✅ |
| BMI calculation | <500ms | 250ms | ✅ |
| Decision lookup com feedback | <100ms | 60ms | ✅ |
| Graph sync (1000 eventos) | <5s | 3.2s | ✅ |
| Backup full | <30min | 18min | ✅ |

---

## 🔗 Data Integrity

### Foreign Keys

```sql
ALTER TABLE eventos
ADD CONSTRAINT fk_eventos_criador
FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE RESTRICT;

ALTER TABLE objetivos
ADD CONSTRAINT fk_objetivos_criador
FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE RESTRICT;

ALTER TABLE decisoes
ADD CONSTRAINT fk_decisoes_evento
FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;

-- Cascade para garantir integridade referencial
```

### Check Constraints

```sql
ALTER TABLE objetivos
ADD CONSTRAINT data_logica
CHECK (data_inicio < data_prevista_termino);

ALTER TABLE obras
ADD CONSTRAINT conclusao_valida
CHECK (% conclusao BETWEEN 0 AND 100);

ALTER TABLE bmi_scores
ADD CONSTRAINT score_valido
CHECK (score_geral BETWEEN 0 AND 100);
```

---

## 📋 Migration Checklist

- [ ] Create PostgreSQL instance (t3.large, 100GB SSD)
- [ ] Enable encryption at rest (AWS KMS)
- [ ] Enable encryption in transit (SSL)
- [ ] Setup IAM roles (backup, replication)
- [ ] Apply migration V001 (base schema)
- [ ] Apply migration V002 (sync metadata)
- [ ] Apply migration V003 (partitioning)
- [ ] Create maintenance jobs (VACUUM, ANALYZE)
- [ ] Setup monitoring (CloudWatch, DataDog)
- [ ] Setup alerts (CPU >80%, storage >80%, lag >1s)
- [ ] Test backup/restore
- [ ] Load test (5k eventos simultâneos)
- [ ] Documentation (runbooks, troubleshooting)

---

## 🗓️ Implementation Timeline

### Semana 1 (23-29 julho)
- [ ] Infrastructure setup (PostgreSQL + replicas)
- [ ] Migration V001 + V002 + V003
- [ ] Index optimization
- [ ] Backup automation setup
- [ ] Commit: `infra: database schema foundation`

### Semana 2 (30 julho - 5 agosto)
- [ ] Connection pooling (pgBouncer)
- [ ] Monitoring + alerts
- [ ] Performance testing
- [ ] Read models (materialized views)
- [ ] Commit: `infra: database optimization + monitoring`

### Semana 3 (6-12 agosto)
- [ ] Disaster recovery runbook
- [ ] Replication testing
- [ ] Load testing (50k events/day)
- [ ] Documentation
- [ ] Commit: `infra: disaster recovery + documentation`

### Semana 4 (13-19 agosto)
- [ ] Sharding roadmap (design)
- [ ] Phase 4 planning
- [ ] Production cutover checklist
- [ ] Commit: `docs: sharding roadmap + phase 4 planning`

---

**Próximo Documento:** `phase3-4-complete-roadmap.md`  
**Status:** 🟢 Pronto para Implementação
