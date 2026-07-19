# 🏛️ Buildly Premium — Instruções para Desenvolvimento

**Versão:** 0.1.0  
**Status:** 🟢 Fase 1 (Foundation) — Operacionalização em Andamento  
**Última Atualização:** 2026-07-19

---

## 📍 Contexto Rápido

**O Buildly Premium** é um Sistema Operacional para Empreendimentos de Infraestrutura Pesada. Diferente de um ERP tradicional, opera como um "cérebro digital" que:

1. **Registra tudo** (Imutabilidade via Event Sourcing)
2. **Entende relacionamentos** (Neo4j Graph DB)
3. **Aprende com o tempo** (Decision Store + Machine Learning)
4. **Recomenda proativamente** (IA Prescritiva)

---

## 🏗️ Arquitetura em Uma Página

```
┌─────────────────────────────────────────────────────┐
│         BUILDLY PREMIUM: Stack Completo             │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Apps:                                              │
│  ├─ /core-api (NestJS + Events)                    │
│  ├─ /ia-engine (Python FastAPI + RAG)              │
│  └─ /worker-events (Node.js Event Processing)      │
│                                                      │
│  Libs (Compartilhadas):                            │
│  ├─ /common-types (IEvent, IObjective, IDecision)  │
│  ├─ /infrastructure (DB, Bus, Cache)               │
│  └─ /domain-logic (Regras de Negócio)              │
│                                                      │
│  Persistência:                                       │
│  ├─ PostgreSQL (Event Store + Estado)              │
│  ├─ Neo4j (Grafo de Relacionamentos)               │
│  ├─ Redis (Cache)                                  │
│  └─ Qdrant (Vector DB para RAG)                    │
│                                                      │
│  Bus & Async:                                       │
│  ├─ NATS (Message Bus)                             │
│  └─ Bull.js (Job Queue)                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📚 Arquivos Críticos

### Documentação
- **`ARCHITECTURE_HANDBOOK.md`** ← Leia PRIMEIRO (constituição técnica)
- **`CLAUDE.md`** ← Você está aqui

### Interfaces (Common Types)
- **`libs/common-types/src/event.interface.ts`** — IEvent (átomo do sistema)
- **`libs/common-types/src/objective.interface.ts`** — IObjective (metas)
- **`libs/common-types/src/decision.interface.ts`** — IDecision (aprendizado)

### Use Cases & Demo
- **`apps/core-api/src/use-cases/material-delay-workflow.service.ts`** — Fluxo completo (Evento → Objetivo → Decisão)
- **`apps/core-api/demo.ts`** — Script de demonstração (execute: `npx ts-node demo.ts`)

---

## 🔑 Conceitos Fundamentais

### 1. IEvent (O Evento)
```typescript
// O que é: Registro imutável de uma mudança no sistema
// Onde vai: Event Store (PostgreSQL, append-only)
// Exemplo: "Cimento chegou 15 dias atrasado"

const evento = new EventBuilder(uuid(), 'MATERIAL_DELAY')
  .withContext({ obra_id: '...', prioridade: 'CRITICA' })
  .withData({ material: 'Cimento', atraso_dias: 15 })
  .build();
```

### 2. IObjective (O Objetivo)
```typescript
// O que é: Meta mensurável da obra
// Onde vai: Objetivo Store (PostgreSQL)
// Exemplo: "Concluir Bloco A até 31 de agosto com 100% qualidade"

const objetivo = new ObjectiveBuilder(uuid(), obra_id, 'Concluir Bloco A...', 'execucao')
  .withMetricaPrincipal({ nome: '% conclusão', valor_alvo: 100 })
  .withDatas('2026-07-20', '2026-08-31')
  .build();
```

### 3. IDecision (A Decisão)
```typescript
// O que é: Registro de uma escolha com contexto, alternativas, e resultado
// Onde vai: Decision Store (PostgreSQL + treinamento de IA)
// Exemplo: Escolher entre esperar material, importar ou reordenar atividades

const decisao = new DecisionBuilder(uuid(), obra_id, evento_id, 'OPERACIONAL')
  .addOpcao({ descricao: 'Esperar', custo: 150000, prazo: 15, risco: 'ALTO' })
  .addOpcao({ descricao: 'Importar', custo: 225000, prazo: 3, risco: 'MEDIO' })
  .addOpcao({ descricao: 'Reordenar', custo: 50000, prazo: 7, risco: 'BAIXO' })
  .withOpcaoEscolhida('reordenar')
  .withResultadoEsperado({ economia: 100000, ganho_prazo: 8 })
  .build();
```

---

## 🚀 Primeira Execução

### 1. Clonar e Setup
```bash
cd /workspace/buildly-premium
pnpm install
```

### 2. Executar Demo
```bash
cd apps/core-api
npx ts-node demo.ts
```

**Esperado:** Fluxo completo de atraso de material com Evento → Objetivo → 3 Decisões alternativas

---

## 📋 Fases de Desenvolvimento

### ✅ Fase 1 (4 semanas): Foundation
- [x] Monorepo estruturado (pnpm workspaces)
- [x] Interfaces IEvent, IObjective, IDecision
- [x] Builders com validação
- [x] Use case de demonstração (material delay)
- [ ] Event Store (PostgreSQL migrations)
- [ ] NATS Bus setup
- [ ] Testes unitários

### ⏳ Fase 2 (6 semanas): Intelligence Layer
- [ ] Neo4j Graph DB integration
- [ ] Event → Graph sync worker
- [ ] Digital Twin (Real vs. Planned vs. Forecast)
- [ ] BMI (Buildly Maturity Index) calculation
- [ ] Pathfinding para causalidade de eventos

### ⏳ Fase 3 (8 semanas): IA & Automation
- [ ] RAG integration (Qdrant)
- [ ] Recommendation Engine
- [ ] Decision Store training
- [ ] Predictive Analytics
- [ ] Automated Decision Making

### ⏳ Fase 4 (Ongoing): Enterprise
- [ ] Multi-tenancy
- [ ] Advanced Security & RLS
- [ ] API Pública (GraphQL + REST)
- [ ] Mobile App
- [ ] Marketplace

---

## 💻 Padrões de Código

### TypeScript
- Use interfaces explícitas (`IEvent`, `IObjective`, etc)
- Builders para criação de objetos complexos
- Enums para tipos fixos (EventType, ObjectiveDomain, etc)

### Estrutura de Pastas
```
apps/core-api/src/
├── controllers/       # REST endpoints
├── services/          # Lógica de negócio
├── use-cases/         # Workflows completos (Evento → Decisão)
├── domain/            # Domínios de negócio
├── infrastructure/    # DB, Bus, Cache
└── main.ts
```

### Nomes de Variáveis
- Usar português para domínio (obra_id, evento_id, atividade_id)
- Usar inglês para infraestrutura (user_id, timestamp, version)
- Prefixo `I` para interfaces (IEvent, IObjective)
- Sufixo `Builder` para builders (EventBuilder, ObjectiveBuilder)

---

## 🧪 Testes

### Executar Demo (validação visual)
```bash
cd apps/core-api && npx ts-node demo.ts
```

### Testes Unitários (futuros)
```bash
pnpm test
```

### Testes E2E (futuros)
```bash
pnpm test:e2e
```

---

## 📖 Documentação Essencial

1. **ARCHITECTURE_HANDBOOK.md** — Constituição técnica (leia primeiro!)
2. **CLAUDE.md** — Este arquivo
3. **Inline comments** — Cada interface tem exemplos de uso

---

## 🔄 Próximos Passos Imediatos

### Para Claude (Próxima Sessão):
1. [ ] Implementar Event Store (PostgreSQL migrations)
2. [ ] Setup NATS Message Bus
3. [ ] Criar serviço de persistência (write IEvent → DB)
4. [ ] Testes unitários para builders
5. [ ] Documentação de API (OpenAPI/Swagger)

### Para ChatGPT & Gemini (Ciclo de 3 Mãos):
Levar esta arquitetura para validação:
- Coerência entre IEvent → IObjective → IDecision
- Escalabilidade do Event Store (milhões de eventos/ano)
- Pathfinding no Neo4j (performance com 100k+ nodos)
- Estratégia de treinamento de IA (Decision Store)

---

## 🔗 Repositório

- **GitHub:** https://github.com/jonacir2023/buildly-premium (futuro)
- **Arquivo Local:** `/workspace/buildly-premium`
- **Branch:** `main` (desenvolvimento)

---

## 💡 Princípios Inegociáveis

1. **Imutabilidade** — Tudo é append-only (Event Sourcing)
2. **Contexto** — Cada ação carrega contexto completo
3. **Proatividade** — Sistema recomenda, não só informa
4. **Rastreabilidade** — 100% auditável
5. **Aprendizado** — Decision Store alimenta IA

---

**Criado por:** Claude (Arquiteto de Plataforma)  
**Data:** 2026-07-19  
**Status:** 🟢 Operacional — Fase 1 em Progresso

Para dúvidas, consulte ARCHITECTURE_HANDBOOK.md seção 1-2.
