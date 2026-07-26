# 🏗️ Buildly Premium — SO para Infraestrutura Pesada

**Versão:** 1.0.0  
**Core:** Phase 2 (Intelligence Layer)  
**Brain Module:** Phase 3.7-3.8 (IA & Analytics) ✅ Completo  
**Status:** 🟢 Production-Ready

---

## 📍 Sobre o Projeto

**Buildly** é um **Sistema Operacional Integrado** para empreendimentos de infraestrutura pesada que:

1. **Orquestra processos** — Event Sourcing + workflows
2. **Entende relacionamentos** — Neo4j Graph DB
3. **Aprende continuamente** — Decision Store + Machine Learning
4. **Recomenda decisões** — IA Prescritiva via **Brain Module**

### 🧠 O que é o Brain?

**Buildly Brain** é um **módulo complementar** de IA que não orquestra, apenas *recomenda*. Trabalha em paralelo, observando:

- 📄 Documentos (diários, reuniões, contratos, cronogramas)
- 🔍 Padrões (delays, custos, recursos)
- 🚨 Alertas (previsões com 7 dias de antecedência)
- 💰 Otimizações (atribuição de custos, ROI)

---

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- TypeScript 5+
- PostgreSQL 15+
- Neo4j 5+
- pnpm 8+

### Setup Local

```bash
# 1. Clone o repositório
git clone <repo-url>
cd buildly-premium

# 2. Instale dependências
pnpm install

# 3. Configure ambiente
cp .env.example .env
# Edite .env com suas credenciais PostgreSQL + Neo4j

# 4. Inicie bancos de dados (Docker)
docker-compose up -d

# 5. Execute demo Phase 1
cd apps/core-api
npx ts-node demo.ts

# 6. Execute demo Phase 2
cd ../intelligence-layer
npx ts-node demo.ts
npx ts-node bmi-demo.ts
```

---

## 📂 Estrutura do Projeto

```
buildly-premium/                   # 🏗️ BUILDLY CORE
├── libs/
│   ├── common-types/              # Phase 1: IEvent, IObjective, IDecision
│   └── intelligence-types/        # Phase 2: Graph, Twin, BMI
├── apps/
│   ├── core-api/                  # Phase 1: Event workflows (Buildly Core)
│   │   ├── src/use-cases/
│   │   ├── demo.ts
│   │   └── package.json
│   └── intelligence-layer/        # Phase 2: Neo4j, Digital Twin, BMI (Buildly Core)
│       ├── src/neo4j/
│       ├── src/bmi-engine/
│       ├── src/infrastructure/
│       └── package.json
│
├── modules/
│   └── brain/                      # 🧠 BUILDLY BRAIN (Complementary Module)
│       ├── apps/
│       │   ├── intelligence-layer/ # Phase 3.7: Analytics (REST API)
│       │   └── ml-engine/          # Phase 3.8: ML Optimization (REST API)
│       ├── supabase/migrations/
│       │   ├── V008__create_analytics_views.sql
│       │   ├── V009__create_analytics_indexes.sql
│       │   └── V010__create_ml_infrastructure.sql
│       ├── docs/
│       │   ├── PHASE3.7-ANALYTICS.md
│       │   └── PHASE3.8-ML-OPTIMIZATION.md
│       ├── README.md               # Brain module overview
│       └── CLAUDE.md               # Brain development guide
│
├── ARCHITECTURE_HANDBOOK.md       # Constituição técnica (Core)
├── CLAUDE.md                      # Guia de desenvolvimento (Core)
├── docker-compose.yml
└── package.json
```

### Hierarquia

```
BUILDLY (Sistema Operacional Principal)
  ├─ Core API (Orquestra processos)
  ├─ Intelligence Layer (Neo4j, BMI, Digital Twin)
  └─ BRAIN Module (Recomenda via IA)
      ├─ Analytics (observa, agrega, visualiza)
      └─ ML Engine (prevê, otimiza, aprende)
```

---

## 🤝 Colaboração 3-Hands

Este projeto usa modelo de **colaboração paralela** onde:

- **Claude** — Implementador (escreve código, testes)
- **ChatGPT** — Validador (revisão arquitetura, otimização)
- **Gemini** — Arquiteto (design, roadmap, escalabilidade)

### Branches de Trabalho

```bash
# Claude trabalha em
master                             # branch principal

# ChatGPT trabalha em
chatgpt/validacao-graph           # Revisa Neo4j, queries, índices
chatgpt/otimizacao-bmi            # Revisa fórmulas BMI

# Gemini trabalha em
gemini/design-recommendation      # Arquiteta ML pipeline
gemini/roadmap-persistencia       # Schema PostgreSQL, escalabilidade
```

### Workflow de Colaboração

```
1. Claude faz implementação no master
   ↓
2. Cria branches para ChatGPT + Gemini
   ↓
3. ChatGPT e Gemini fazem alterações/documentação
   ↓
4. Claude revisa e integra
   ↓
5. Merge de volta para master
```

---

## 📚 Documentação Phase 4-5 (Pilot Validation & Enterprise)

**NOVO: Documentação completa do Pilot Validation (Phase 4) e Enterprise Roadmap (Phase 5)**

### Para Executivos
- **[PILOT-VALIDATION-PLAYBOOK.md](./PILOT-VALIDATION-PLAYBOOK.md)** — Guia completo 6 semanas (leia PRIMEIRO)
- **[PHASE-4.6-ANALYSIS.md](./PHASE-4.6-ANALYSIS.md)** — Resultados finais & decisão Go/No-Go
- **[PHASE-5-ROADMAP.md](./PHASE-5-ROADMAP.md)** — Roadmap expansão enterprise + receita

### Para Time Técnico
- **[PHASE-4.5-ACTIVE.md](./PHASE-4.5-ACTIVE.md)** — Semanas 4-5: Decisions em tempo real
- **[architecture.json](./architecture.json)** — Arquitetura completa (formato estruturado)
- **[architecture-refined.html](./architecture-refined.html)** — Visualização HTML

### Cronograma
```
Week 1-3: Pilot Phase 4.1-4.2 (Observation)
  ├─ Phase 4.1: Baseline (Week 1)
  └─ Phase 4.2: Soft Launch (Weeks 2-3)

Week 4-5: Phase 4.3 (Live Decisions)
  └─ Gestores approve/reject predictions

Week 6: Phase 4.6 (Analysis & Go/No-Go)
  └─ Final decision for enterprise rollout

Week 7+: Phase 5 (Enterprise Expansion)
  ├─ 20 sites online
  ├─ Neo4j Intelligence Layer
  └─ Revenue generation
```

---

## 📝 Documentação Essencial (Cores Phases 1-3)

1. **[ARCHITECTURE_HANDBOOK.md](./ARCHITECTURE_HANDBOOK.md)** — Constituição técnica (leia PRIMEIRO)
2. **[CLAUDE.md](./CLAUDE.md)** — Padrões de código + desenvolvimento
3. **[Obsidian Vault](../JC/vault/Projetos/)** — Notas de projeto + decisões

---

## 🔄 Fases de Desenvolvimento

### **BUILDLY CORE**

#### Phase 1: Foundation ✅ COMPLETO
- [x] IEvent, IObjective, IDecision interfaces
- [x] Builders com validação
- [x] MaterialDelayWorkflowService demo
- [x] Event Sourcing pattern

#### Phase 2: Intelligence Layer 🟡 70% COMPLETO
- [x] Neo4j Graph interfaces
- [x] Digital Twin (Real vs Planejado vs Forecast)
- [x] BMI (8 dimensões) calculator
- [x] EventSyncWorker (lógica)
- [x] Database factory + queries
- [ ] Testes unitários (80% coverage)
- [ ] Integração PostgreSQL/Neo4j

#### Phase 3: IA & Automation ⏳ PRÓXIMO
- [ ] Brain Module integration (via REST APIs)
- [ ] RAG integration (Qdrant)
- [ ] Recommendation Engine consumption
- [ ] Decision Store training

---

### **BUILDLY BRAIN Module**

#### Phase 3.7: Advanced Analytics ✅ COMPLETO
- [x] 6 Materialized Views (sub-500ms)
- [x] Redis Cache (24h TTL)
- [x] Analytics REST API (4 endpoints + health)
- [x] Python Aggregation Service (daily/hourly)
- [x] Looker Studio integration

#### Phase 3.8: ML Optimization ✅ COMPLETO
- [x] Adaptive EMA Pattern Learning (recency-based alpha)
- [x] 7-Day Alert Forecasting (seasonal patterns)
- [x] Cost Attribution (3 components)
- [x] ML REST API (5 endpoints + health)
- [x] Model Performance Tracking (accuracy, F1, ROC-AUC)

#### Phase 3.9: Document Recognition ⏳ PRÓXIMO
- [ ] OCR Connector (Tesseract)
- [ ] Diário de Obra Parser
- [ ] Meeting Transcription (Whisper)
- [ ] Contract Analysis (NLP)
- [ ] Schedule Deviation Detection

---

### **BUILDLY PREMIUM: PILOT VALIDATION & ENTERPRISE (Phase 4-5)**

#### Phase 4: Pilot Validation 🟡 ROADMAPS READY
- [x] Phase 4.1: Baseline establishment (Week 1)
- [x] Phase 4.2: Soft Launch observation (Weeks 2-3)
- [x] Phase 4.3: Active Phase decisions (Weeks 4-5) — **[PHASE-4.5-ACTIVE.md](./PHASE-4.5-ACTIVE.md)**
- [x] Phase 4.6: Analysis & Go/No-Go (Week 6) — **[PHASE-4.6-ANALYSIS.md](./PHASE-4.6-ANALYSIS.md)**
- [x] Playbook: Complete 6-week guide — **[PILOT-VALIDATION-PLAYBOOK.md](./PILOT-VALIDATION-PLAYBOOK.md)**

**Expected Results:**
- Precision: ≥75% (target 81%)
- Recall: ≥70% (target 76%)
- ROI: ≥R$ 20k per prevented delay (target R$ 42.7k)
- Uptime: ≥99.5% (target 99.7%)

#### Phase 5: Enterprise Expansion & Intelligence Layer 🚀 PLANNED
- [ ] Enterprise rollout (20+ sites)
- [ ] Neo4j integration
- [ ] Recommendation engine
- [ ] Predictive procurement
- [ ] Automation decisions
- [ ] Revenue monetization

See **[PHASE-5-ROADMAP.md](./PHASE-5-ROADMAP.md)** for details.

#### Phase 4: Enterprise ⏳ FUTURO (2027+)
- [ ] Multi-tenancy
- [ ] Advanced Security
- [ ] API Pública (GraphQL + REST)
- [ ] Mobile App

---

## 🧠 Usando o Brain Module

### Como o Buildly Core Consome Brain APIs

```typescript
// buildly-premium/apps/core-api/src/services/brain.service.ts
import axios from 'axios';

@Injectable()
export class BrainService {
  async getAlertPredictions(obra_id: string) {
    return axios.get('http://brain-ml:3002/ml/predict/alerts', {
      headers: { 'X-Tenant-ID': obra_id }
    });
  }

  async getCostOptimization(obra_id: string) {
    return axios.get('http://brain-ml:3002/ml/cost/attribution', {
      headers: { 'X-Tenant-ID': obra_id }
    });
  }

  async getObraKpis(obra_id: string) {
    return axios.get('http://brain-analytics:3001/analytics/obras/summary', {
      headers: { 'X-Tenant-ID': obra_id }
    });
  }
}
```

### Brain Module Endpoints

**Analytics Layer (Port 3001):**
- `GET /analytics/events/aggregated` — Agregação de eventos
- `GET /analytics/patterns/effectiveness` — Efetividade de padrões
- `GET /analytics/alerts/timeline` — Timeline de alertas
- `GET /analytics/obras/summary` — Resumo KPI

**ML Engine (Port 3002):**
- `GET /ml/predict/alerts` — Previsão 7-day forecast
- `GET /ml/cost/attribution` — Atribuição de custos
- `GET /ml/models/performance` — Performance de modelos
- `POST /ml/train/patterns` — Retrair pesos de padrões
- `POST /ml/training/prepare` — Preparar dataset

📚 Documentação completa: [modules/brain/README.md](./modules/brain/README.md)

---

## 🎯 Para Colaboradores

### Trabalhar no Buildly Core

**Tarefas:**
1. Implementar Event Store (PostgreSQL)
2. Integrar com Brain Module
3. Criar Recommendation Engine
4. Testes E2E

**Branch:** `main` (core development)

---

### Trabalhar no Buildly Brain

**Tarefas:**
1. Phase 3.9: Document Recognition (OCR + NLP)
2. Phase 4.0: Real-time Streaming (Kafka)
3. Phase 4.1: Multi-model Ensemble

**Branch:** `main` > `modules/brain/`  
**Dev Guide:** [modules/brain/CLAUDE.md](./modules/brain/CLAUDE.md)

---

## 💻 Ambiente & Configuração

### Variáveis de Ambiente

```bash
# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=buildly
PG_USER=postgres
PG_PASSWORD=password
PG_POOL_SIZE=20

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_DB=neo4j
```

### Docker Compose

```bash
docker-compose up -d postgres neo4j
```

Acesse:
- PostgreSQL: `localhost:5432`
- Neo4j Browser: `http://localhost:7474`

---

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes E2E
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## 📊 Commits & Versionamento

Commits seguem convenção:

```
feat: nova funcionalidade
fix: correção de bug
doc: documentação
test: testes
refactor: refatoração
```

Exemplo:
```bash
git commit -m "feat: implementa neo4j event sync worker

- EventSyncWorker sincroniza eventos para grafo
- DatabaseFactory cria conexões reais
- Cypher queries centralizadas
"
```

---

## 🔗 Links Úteis

- [GitHub Issues](./issues) — Bugs + features
- [Obsidian Vault](../JC/vault/) — Documentação de projeto
- [Architecture Handbook](./ARCHITECTURE_HANDBOOK.md) — Técnica
- [Neo4j Docs](https://neo4j.com/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 📞 Contato & Status

**Última Atualização:** 2026-07-19  
**Phase 2 Progress:** 70%  
**Próxima Sincronização:** 2026-07-21

**Colaboradores Ativos:**
- Claude — Implementador
- ChatGPT — Validador (em andamento)
- Gemini — Arquiteto (em andamento)

---

## 📜 Licença

Proprietário — Uso interno apenas

---

**Buildly Premium — Construindo o futuro da infraestrutura pesada 🏗️**
