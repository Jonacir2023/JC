# 🏗️ Buildly Premium — Arquitetura Técnica

**Versão:** 1.0.0  
**Data:** 2026-07-26  
**Status:** Production-Ready

---

## 📐 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Frontend)                      │
│  • React Web Dashboard                             │
│  • React Native Mobile App                         │
│  • Gestores interface (approval/rejection)         │
└──────────────────┬──────────────────────────────────┘
                   │ (REST/GraphQL)
┌──────────────────┴──────────────────────────────────┐
│  API LAYER                                          │
│  • Core API (NestJS) — Port 3001                   │
│  • GraphQL API (Apollo) — /graphql                 │
│  • Decision API (Express) — Port 3003              │
│  • ML Engine (FastAPI) — Port 3002                 │
└──────────────────┬──────────────────────────────────┘
                   │ (Service Pattern)
┌──────────────────┴──────────────────────────────────┐
│  BUSINESS LOGIC LAYER                              │
│  • Event Sourcing (immutability)                   │
│  • Use Cases (workflows)                           │
│  • Decision Store (feedback loop)                  │
│  • ML Model Training                               │
│  • Cost Attribution                                │
│  • Pattern Detection                               │
└──────────────────┬──────────────────────────────────┘
                   │ (Repository Pattern)
┌──────────────────┴──────────────────────────────────┐
│  DATA LAYER                                         │
│  • PostgreSQL (Event Store + State)                │
│  • Neo4j (Relationship Graph)                      │
│  • Redis (Cache + Sessions)                        │
│  • Qdrant (Vector DB for RAG)                      │
│  • Message Bus (NATS)                              │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Core Concepts

### 1. Event Sourcing (Imutabilidade)

**Princípio:** Tudo começa como um evento imutável.

**Flow:**
```
Ação (ex: Material atrasado)
    ↓
Event → Event Store (PostgreSQL, append-only)
    ↓
Event Processor → Aggregates + State
    ↓
Views (for querying)
```

**Tabelas:**
- `events` — Append-only log (nunca deletado, nunca atualizado)
- `event_snapshots` — Snapshots para performance (optional)
- `event_subscriptions` — Quem está listening a quais eventos

**Vantagens:**
- ✅ 100% auditável (completa história de mudanças)
- ✅ Replayable (pode recalcular estado a qualquer hora)
- ✅ Time travel debugging (ver estado em qualquer ponto)
- ✅ Perfect CQRS separation

---

### 2. Graph Database (Neo4j)

**Uso:** Relacionamentos complexos entre entidades.

```cypher
// Exemplo: Encontrar correlações de atrasos
MATCH (material:Material)-[:SUPPLIED_BY]->(supplier:Supplier)
  -[:OPERATES_IN]->(region:Region)-[:AFFECTS]->(project:Project)
WHERE material.delay_probability > 0.8
  AND supplier.reliability_score < 0.7
RETURN material, supplier, region, project
```

**Nodes Principais:**
- `Material` — Tipos de material (Vidro, Aço, Concreto, etc)
- `Supplier` — Fornecedores
- `Site` — Obras/empreendimentos
- `Gestor` — Tomadores de decisão
- `Prediction` — Previsões geradas
- `Decision` — Decisões tomadas

**Relationships:**
- `SUPPLIED_BY` — Material → Supplier
- `OPERATES_IN` — Supplier → Region
- `AFFECTS` — Region → Site
- `PREDICTED_FOR` — Prediction → Material
- `DECIDED_BY` — Decision → Gestor

---

### 3. Decision Store (Feedback Loop)

**Conceito:** Cada decisão é armazenada com seu resultado, alimentando IA.

```
Prediction Generated
    ↓
Gestor Reviews Prediction
    ↓
Gestor Makes Decision (APPROVED/REJECTED)
    ↓ (7+ days later)
Actual Outcome Recorded (delay occurred? cost saved?)
    ↓
Learning Value Calculated (0-100, importance for training)
    ↓
Model Retraining (nightly, using high learning value samples)
    ↓
Improved Model (next day predictions better)
```

**Tabelas:**
- `pilot_approval_decisions` — Decisão registrada
- `pilot_model_retraining_log` — Histórico de retreinamentos
- `decision_learning_samples` — High-value samples (learning_value > 70)

---

## 🗄️ Banco de Dados

### PostgreSQL (Event Store + Relational State)

```
Public Schema:
├── events (append-only)
├── event_snapshots (optimization)
├── users (gestores + admins)
├── pilot_sites (5 construction sites)
├── pilot_material_history (historical delivery data)
├── pilot_baseline_metrics (Week 1 baselines)
├── pilot_soft_launch_observations (Weeks 2-3 metrics)
├── pilot_approval_decisions (Weeks 4-5 decisions)
├── pilot_model_retraining_log (Model improvements)
└── pilot_audit_log (todas as operações)

Indexes:
├── idx_events_aggregate_id (rápido lookups por agregado)
├── idx_events_timestamp (time-series queries)
├── idx_approval_decision_site (filtering por site)
└── idx_soft_launch_obs_precision (performance tracking)
```

### Neo4j (Relationship Graph)

```
Nodes:
├── (:Material {name: "Vidro", reliability: 0.87})
├── (:Supplier {name: "XYZ Corp", ontime_rate: 0.75})
├── (:Site {name: "São Paulo", region: "SP"})
├── (:Gestor {name: "Jonacir", site: "São Paulo"})
└── (:Prediction {id: "pred-123", confidence: 0.82})

Relationships:
├── (:Material)-[:SUPPLIED_BY]->(:Supplier)
├── (:Supplier)-[:OPERATES_IN]->(:Region)
├── (:Region)-[:AFFECTS]->(:Site)
├── (:Prediction)-[:FOR_MATERIAL]->(:Material)
├── (:Prediction)-[:AT_SITE]->(:Site)
└── (:Prediction)-[:DECIDED_BY]->(:Gestor)
```

### Redis (Cache + Sessions)

```
Keys:
├── predictions:site-{id}:{date} → JSON array (TTL: 24h)
├── baseline:metrics:{material} → JSON (TTL: 7 days)
├── model:thresholds → JSON (TTL: 24h, updated after retrain)
├── user:session:{token} → User data (TTL: 24h)
└── rate_limit:{ip} → Counter (TTL: 1 minute)
```

### Qdrant (Vector DB for RAG)

```
Collections:
├── obra_documents (Diários de obra, reuniões, relatórios)
├── supplier_history (Histórico de fornecedores)
└── material_delays (Histórico de atrasos)
```

---

## 🔄 Data Flow

### Phase 4.1 (Baseline — Week 1)

```
Historical Data (6 months)
    ↓
generate-baseline-predictions.ts
    ├─ Load from pilot_material_history
    ├─ Calculate delay rates per material
    ├─ Generate predictions for all historical records
    └─ Store in pilot_baseline_metrics
    ↓
Go/No-Go Decision (Precision ≥75%?)
```

### Phase 4.2 (Soft Launch — Weeks 2-3)

```
Daily (6:00 AM):
  generate-daily-predictions.ts
    ├─ Fetch current orders
    ├─ Generate 5-8 predictions per site
    └─ Send email to gestores (observation only)

Daily (8:00 PM):
  collect-daily-observations.ts
    ├─ Check actual delivery outcomes
    ├─ Calculate TP/FP/TN/FN
    └─ Insert observation record
```

### Phase 4.3 (Active — Weeks 4-5)

```
Daily Predictions + Gestor Decisions
    ↓ (7+ Days Later)
Outcome Recording
    ↓
Learning Value Calculated
    ↓
Daily (11:00 PM):
  retrain-model-nightly.ts
    ├─ Fetch decisions from last 14 days
    ├─ Filter by learning_value (high = important)
    └─ Model ready for next day's predictions
```

---

## 🔌 API Endpoints

### Core API (NestJS, Port 3001)

```
REST:
GET    /health
GET    /api/v1/alerts/obras/{id}
POST   /api/v1/alerts/{id}/approve
POST   /api/v1/alerts/{id}/reject

GraphQL:
POST   /graphql
```

### Decision API (Express, Port 3003)

```
POST   /api/decisions
GET    /api/decisions/{siteId}
PUT    /api/decisions/{id}/outcome
GET    /api/quality/{siteId}
GET    /health
```

### ML Engine (FastAPI, Port 3002)

```
GET    /ml/health
GET    /ml/predict/alerts
GET    /ml/predict/delays
POST   /ml/train/patterns
GET    /ml/models/performance
```

---

## 🔐 Security Architecture

### Authentication
- **JWT** tokens for API access (24h expiry)
- **Refresh tokens** for session management (7 day expiry)
- **API keys** for service-to-service communication

### Authorization
- **RBAC** (Role-Based Access Control)
  - Admin: Full access
  - Gestor: Read predictions, approve/reject, view own site
  - Analyst: Read-only access

### Data Protection
- **Encryption at rest:** PostgreSQL pgcrypto extension
- **Encryption in transit:** TLS 1.3 for all connections
- **Secret rotation:** Monthly (credentials, JWT keys)
- **SQL injection prevention:** Parameterized queries everywhere
- **Rate limiting:** 100 req/min per IP

---

## 📊 Monitoring & Observability

### Prometheus Metrics
```
buildly_predictions_generated_total
buildly_prediction_accuracy_percent
buildly_api_request_duration_seconds
buildly_database_connection_pool_size
buildly_cache_hit_rate_percent
buildly_model_retraining_duration_seconds
```

### Logging
- **Format:** JSON (structured)
- **Levels:** debug, info, warn, error, fatal
- **Destination:** Stdout (Docker) + optional Datadog/Sentry

### Health Checks
- **Database:** `SELECT 1` ping
- **Redis:** PING command
- **Neo4j:** Cypher query health check
- **APIs:** `/health` endpoint per service

---

**Buildly Premium Architecture — Built for Scale, Built for Learning 🧠**
