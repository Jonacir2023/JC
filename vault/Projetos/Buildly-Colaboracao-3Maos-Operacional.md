---
titulo: "Buildly Premium — Colaboração 3-Mãos (Operacional)"
tipo: "Procedimento"
status: "Ativo"
criado_em: "2026-07-19"
para: "Claude, ChatGPT, Gemini"
tags: [buildly, colaboracao, 3hands, operacional, gitflow]
---

# 📑 Colaboração 3-Mãos — Guia Operacional

**De:** Claude (Implementador)  
**Com:** ChatGPT (Validador) + Gemini (Arquiteto)  
**Data:** 19 de julho de 2026  
**Modelo:** Paralelo + Git-based

---

## 🎯 Visão Geral

Buildly Premium usa um modelo de **colaboração ativa** (não consultoria) onde:

| Papel | Responsabilidade | Branch | Artefatos |
|-------|------------------|--------|-----------|
| **Claude** | Implementação de código | `claude/serene-einstein-em23qs` | Código funcional + testes |
| **ChatGPT** | Validação + Otimização | `chatgpt/validacao-graph`<br>`chatgpt/otimizacao-bmi` | Reviews + recomendações |
| **Gemini** | Design + Arquitetura | `gemini/design-recommendation`<br>`gemini/roadmap-persistencia` | Documentação de design |

---

## 🔄 Fluxo de Trabalho

```
┌─────────────────────────────────────────────────────────────┐
│ Claude: Implementa em claude/serene-einstein-em23qs         │
│ ├─ Código funcional                                         │
│ ├─ Testes de integração                                     │
│ └─ Documentação técnica                                     │
└────────────────────────┬────────────────────────────────────┘
                         │ Push
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ ChatGPT & Gemini: Revisa + Melhora                          │
│ ├─ Checkout branch de trabalho (chatgpt/* ou gemini/*)      │
│ ├─ Faz alterações/documentação                              │
│ ├─ Commit + Push                                            │
│ └─ Abre Pull Request para claude/serene-einstein-em23qs     │
└────────────────────────┬────────────────────────────────────┘
                         │ PR aberto
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude: Revisa PR                                           │
│ ├─ Lê sugestões de ChatGPT/Gemini                           │
│ ├─ Solicita mudanças ou aprova                              │
│ └─ Faz MERGE para claude/serene-einstein-em23qs             │
└────────────────────────┬────────────────────────────────────┘
                         │ Merge + Integração
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Buildly Premium                                             │
│ ├─ Código testado                                           │
│ ├─ Arquitetura validada                                     │
│ └─ Pronto para próxima fase                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tarefas Específicas

### ChatGPT: Validação de Graph (branch: `chatgpt/validacao-graph`)

**Objetivo:** Garantir que a arquitetura Neo4j está correta, performática e escalável.

**Arquivos para revisar:**
```
libs/intelligence-types/src/
├── graph-node.interface.ts (500 linhas)
│   └─ Revisar: Nós EVENTO, OBJETIVO, DECISAO, COLABORADOR
│      Pergunta: Faltam nós ou relacionamentos?
│
├── bmi.interface.ts (600 linhas)
│   └─ Revisar: 8 dimensões e pesos
│      Pergunta: Pesos estão balanceados?

apps/intelligence-layer/src/infrastructure/
├── queries.ts (300 linhas - seção CYPHER)
│   └─ Revisar: Performance das queries
│      Pergunta: Há N+1 queries? Índices adequados?

apps/intelligence-layer/src/bmi-engine/
└── bmi-calculator.service.ts (400 linhas)
    └─ Revisar: Fórmulas das 8 dimensões
       Pergunta: Indicadores fazem sentido? Há overflow/underflow?
```

**Entregáveis:**
1. `docs/architecture-review-chatgpt.md` (estrutura abaixo)
2. Comentários inline nos arquivos (se mudanças de código)
3. Pull Request com title: `chore: validação de graph architecture (ChatGPT)`

**Estrutura de `architecture-review-chatgpt.md`:**
```markdown
# Validação de Graph Architecture — ChatGPT Review

## ✅ Validações Completadas

### 1. Nós Neo4j
- [ ] EVENTO: Campos suficientes?
- [ ] OBJETIVO: Status abrange todos os casos?
- [ ] DECISAO: Feedback score captura aprendizado?
- [ ] COLABORADOR: Campos necessários presentes?

### 2. Relacionamentos
- [ ] AMEACA: Evento → Objetivo (threshold de confiança?)
- [ ] AFETA: Evento → Atividade (peso correto?)
- [ ] MITIGADA_POR: Objetivo → Decisao (efetividade medida?)
- [ ] CAUSADA_POR: Decisao → Evento (ciclo feedback?)
- [ ] Faltam relacionamentos? Quais?

### 3. Queries Cypher
- [ ] `shortestPath`: Performance com 100k nós?
- [ ] `cascata`: Usa APOC? Limite de profundidade ok?
- [ ] `allImpacts`: Otimizada? Índices criados?
- [ ] `graphMetrics`: Cálculos corretos?

### 4. Índices Neo4j
Recomendações:
- CREATE INDEX idx_evento_ref_id FOR (n:EVENTO) ON (n.ref_id);
- CREATE INDEX idx_objetivo_obra_id FOR (n:OBJETIVO) ON (n.obra_id);
- CREATE INDEX idx_evento_timestamp FOR (n:EVENTO) ON (n.timestamp);
- (listar outros índices necessários)

### 5. Performance
- [ ] Densidade do grafo com 100k nós?
- [ ] Tiempo de cascata até profundidade 5?
- [ ] Memory footprint esperado?

## 🔍 Achados

### ✅ Pontos Fortes
- (listar)

### ⚠️ Pontos a Melhorar
- (listar com recomendações)

### 🚀 Otimizações Propostas
- (código proposto ou alterações)

## 📊 Score Final
- Arquitetura: 8/10
- Performance: 7/10
- Escalabilidade: 8/10
- **MÉDIA: 7.7/10 — APROVADA ✅**
```

---

### ChatGPT: Otimização de BMI (branch: `chatgpt/otimizacao-bmi`)

**Objetivo:** Validar e otimizar as 8 fórmulas dimensionais do BMI.

**Arquivos para revisar:**
```
libs/intelligence-types/src/
├── bmi.interface.ts
│   └─ Revisar indicadores de cada dimensão
│       Que indicadores compõem cada score?

apps/intelligence-layer/src/bmi-engine/
└── bmi-calculator.service.ts
    └─ Revisar fórmulas:
       1. Execução: (conclusao×0.4) + (prazo×0.35) + (penalidade×0.25)
       2. Financeiro: Penaliza overrun > underestimativa
       3. Risco: (mitigacao×0.6) + (qualidade_decisoes×0.4)
       4. Governanca: Score direto de conformidade
       5. Planejamento: 100 - (dias_atraso × 1.5)
       6. Recursos: 85 (placeholder, dados RH futuros)
       7. Sustentabilidade: % eco-friendly × 1.5
       8. Segurança: 100 se zero incidentes, -20 por incidente
```

**Entregáveis:**
1. `docs/bmi-formulas-validation.md` (análise matemática)
2. Eventualmente código otimizado (se mudanças necessárias)
3. Pull Request com title: `chore: otimização de fórmulas BMI (ChatGPT)`

**Estrutura de `bmi-formulas-validation.md`:**
```markdown
# Validação & Otimização de Fórmulas BMI

## 📊 Análise das 8 Dimensões

### 1. Execução (Peso: 0.35)
- Fórmula Atual: (conclusao×0.4) + (prazo×0.35) + (penalidade×0.25)
- Validação: ✅ Cobre 3 aspectos principais
- Sugestão: (detalhar se houver)

### 2-8. (Continuar análise para cada dimensão)

## 🎯 Recomendações de Otimização
- (listar mudanças propostas com justificativa)

## ✅ Scores de Referência
Validar contra exemplos reais (ex: material_delay_scenario)
- BMI esperado: 77.5/100
- Breakdown esperado: Execução 85, Financeiro 88, etc.
```

---

### Gemini: Recommendation Engine (branch: `gemini/design-recommendation`)

**Objetivo:** Desenhar a arquitetura completa do ML pipeline que usa Decision Store para treinar modelos.

**Entregáveis:**
1. `docs/phase3-recommendation-engine.md` (500-800 linhas)
2. Diagrama (Mermaid ou texto) mostrando: Decision Store → Features → Model → Inference
3. Pull Request com title: `docs: design do recommendation engine (Gemini)`

**Conteúdo esperado:**
```markdown
# Phase 3 — Recommendation Engine Design

## 1. Conceito
Phase 1 gera Decisões com feedback_score (resultado esperado vs real).
Phase 3 usa esse histórico para treinar um modelo ML que RECOMENDA decisões.

## 2. Data Pipeline
- Input: Decisões do Decision Store (histórico de 1000+ registros)
- Features: [obra_id, tipo_evento, urgencia, complexidade, feedback_score_historico, ...]
- Model: Que tipo? (classificação, ranking, regressão?)
- Output: Rank de alternativas recomendadas com confiança

## 3. Arquitetura Proposta
```
PostgreSQL (Decision Store)
    ↓ [ETL] Extrai features
    ↓
Feature Store (Qdrant ou similar)
    ↓ [Training]
    ↓
ML Model (Scikit-learn? PyTorch?)
    ↓ [Inference API]
    ↓
Recommendation Service
    ↓ [gRPC/REST]
    ↓
User Decision Maker (UI)
```

## 4. Decisões Arquiteturais
- Treinar continuamente (semanal) vs apenas ao deploy?
- Que threshold de confiança para recomendar?
- Como A/B test novas recomendações?
- Feedback loop: Usuário aprova/rejeita recomendação → novo dado de treino?

## 5. Implementação (Fases)
- Fase 3.1: Feature engineering + treinamento offline
- Fase 3.2: Inference API + integration com core-api
- Fase 3.3: UI para mostrar recomendações
- Fase 3.4: Feedback loop automático
```

---

### Gemini: Persistence Layer (branch: `gemini/roadmap-persistencia`)

**Objetivo:** Desenhar o schema PostgreSQL completo, migrations, índices, escalabilidade.

**Entregáveis:**
1. `docs/phase2-persistence-design.md` (600-1000 linhas)
2. DDL proposto (ENUMs, tables, constraints, indexes)
3. Migration strategy (como evoluir schema)
4. Pull Request com title: `docs: design do persistence layer (Gemini)`

**Conteúdo esperado:**
```markdown
# Phase 2 — Persistence Layer Design

## 1. Schema PostgreSQL Completo

### ENUMs
```sql
CREATE TYPE event_type_enum AS ENUM (
    'MATERIAL_DELAY', 'ACTIVITY_COMPLETED', ...
);
CREATE TYPE objective_status_enum AS ENUM (
    'PLANEJADO', 'EM_EXECUCAO', 'CONCLUIDO', 'ATRASADO', 'CANCELADO'
);
-- ... mais ENUMs
```

### Tables
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,
    type event_type_enum NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    context JSONB,
    data JSONB,
    synced_to_neo4j BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_type (type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_synced (synced_to_neo4j)
);

CREATE TABLE objectives (
    id UUID PRIMARY KEY,
    obra_id UUID NOT NULL,
    nome TEXT NOT NULL,
    status objective_status_enum,
    progresso_percentual DECIMAL(5,2),
    data_alvo DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_obra_id (obra_id),
    INDEX idx_status (status)
);

-- ... mais tables
```

## 2. Escalabilidade para 100k eventos/mês
- Particionamento por mês (eventos)
- Connection pooling (pgBouncer)
- Read replicas para analytics
- Backup strategy (WAL archiving)

## 3. Migrations Strategy
- Migrations versionadas (0001, 0002, ...)
- Rollback plan
- Zero-downtime migrations
```

---

### Gemini: Roadmap Phase 3-4 (parte de `gemini/roadmap-persistencia`)

**Dentro do mesmo doc ou novo arquivo:**

```markdown
# Phase 3-4 — Complete Roadmap

## Timeline
- Phase 3.1 (Semana 1): Feature engineering + ML training setup
- Phase 3.2 (Semana 2-3): Inference API
- Phase 3.3 (Semana 4): UI integration
- Phase 4.1 (Semana 5-6): Multi-tenancy + Advanced Security
- Phase 4.2 (Semana 7-8): Public API (GraphQL + REST)
- Phase 4.3 (Semana 9+): Mobile App

## Dependências
- Phase 3 bloqueia Phase 4
- ML models precisam de 1000+ decisões para treinar
- Escalabilidade Phase 2 é pré-req para Phase 3+

## Riscos & Mitigações
- Risco: Dados históricos insuficientes para ML
  Mitigação: Usar synthetic data ou transfer learning de projetos similares
- Risco: Neo4j performance degradar com 1M+ nós
  Mitigação: Arquitetura de grafos distribuídos (Neo4j Fabric)
```

---

## 📊 Status de Cada Task

| Task | Responsável | Branch | Status | Devido | PR |
|------|-------------|--------|--------|--------|-----|
| Graph Validation | ChatGPT | `chatgpt/validacao-graph` | 🔵 Em andamento | 21/07 | - |
| BMI Optimization | ChatGPT | `chatgpt/otimizacao-bmi` | 🔵 Em andamento | 21/07 | - |
| Recommendation Engine | Gemini | `gemini/design-recommendation` | 🔵 Em andamento | 21/07 | - |
| Persistence Design | Gemini | `gemini/roadmap-persistencia` | 🔵 Em andamento | 22/07 | - |
| Roadmap 3-4 | Gemini | `gemini/roadmap-persistencia` | 🔵 Em andamento | 22/07 | - |

**Legenda:** 🔵 Em andamento · 🟢 Completo · 🔴 Bloqueado · ⚪ Não iniciado

---

## 🔗 Recursos Importantes

- **Repo:** `https://github.com/Jonacir2023/JC`
- **Branch de integração:** `claude/serene-einstein-em23qs`
- **Setup:** `/workspace/buildly-premium/COLABORADORES-SETUP.md`
- **Architecture:** `/workspace/buildly-premium/ARCHITECTURE_HANDBOOK.md`

---

## 📞 Sincronização

**Próxima Sincronização:** 21 de julho de 2026 (segunda-feira)  
**Frequência:** Diária via PRs (código) + semanal (reunião de arquitetura)

---

**Vamos construir o futuro da infraestrutura pesada! 🚀**
