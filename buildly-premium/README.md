# 🏗️ Buildly Premium — OS para Infraestrutura Pesada

**Versão:** 0.1.0  
**Fase:** 2 (Intelligence Layer)  
**Status:** 🟡 Em Desenvolvimento — Colaboração 3-Hands Ativa

---

## 📍 Sobre o Projeto

Buildly Premium é um **Sistema Operacional** para empreendimentos de infraestrutura pesada que funciona como um "cérebro digital" capaz de:

1. **Registrar tudo** — Event Sourcing (imutabilidade)
2. **Entender relacionamentos** — Neo4j Graph DB
3. **Aprender com o tempo** — Decision Store + Machine Learning
4. **Recomendar proativamente** — IA Prescritiva

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
buildly-premium/
├── libs/
│   ├── common-types/              # Phase 1: IEvent, IObjective, IDecision
│   └── intelligence-types/        # Phase 2: Graph, Twin, BMI
├── apps/
│   ├── core-api/                  # Phase 1: Event workflows
│   │   ├── src/use-cases/
│   │   ├── demo.ts
│   │   └── package.json
│   └── intelligence-layer/        # Phase 2: Neo4j, Digital Twin, BMI
│       ├── src/neo4j/
│       ├── src/bmi-engine/
│       ├── src/infrastructure/
│       ├── bmi-demo.ts
│       ├── demo.ts
│       └── package.json
├── ARCHITECTURE_HANDBOOK.md       # Constituição técnica
├── CLAUDE.md                      # Guia de desenvolvimento
├── docker-compose.yml
└── package.json
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

## 📝 Documentação Essencial

1. **[ARCHITECTURE_HANDBOOK.md](./ARCHITECTURE_HANDBOOK.md)** — Constituição técnica (leia PRIMEIRO)
2. **[CLAUDE.md](./CLAUDE.md)** — Padrões de código + desenvolvimento
3. **[Obsidian Vault](../JC/vault/Projetos/)** — Notas de projeto + decisões

---

## 🔄 Fases de Desenvolvimento

### Phase 1: Foundation ✅ COMPLETO
- [x] IEvent, IObjective, IDecision interfaces
- [x] Builders com validação
- [x] MaterialDelayWorkflowService demo
- [x] Event Sourcing pattern

### Phase 2: Intelligence Layer 🟡 70% COMPLETO
- [x] Neo4j Graph interfaces
- [x] Digital Twin (Real vs Planejado vs Forecast)
- [x] BMI (8 dimensões) calculator
- [x] EventSyncWorker (lógica)
- [x] Database factory + queries
- [ ] Testes unitários (80% coverage)
- [ ] Integração PostgreSQL/Neo4j

### Phase 3: IA & Automation ⏳ PRÓXIMO
- [ ] RAG integration (Qdrant)
- [ ] Recommendation Engine
- [ ] Decision Store training
- [ ] Predictive Analytics

### Phase 4: Enterprise ⏳ FUTURO
- [ ] Multi-tenancy
- [ ] Advanced Security
- [ ] API Pública (GraphQL + REST)
- [ ] Mobile App

---

## 🎯 Para Colaboradores

### ChatGPT: Validação & Otimização

**Tarefas:**
1. Revisar `libs/intelligence-types/graph-node.interface.ts`
   - Nós e relacionamentos suficientes?
   - Índices Neo4j recomendados?
   
2. Revisar `libs/intelligence-types/bmi.interface.ts`
   - Fórmulas das 8 dimensões estão otimizadas?
   - Indicadores fazem sentido?

3. Revisar `apps/intelligence-layer/src/infrastructure/queries.ts`
   - Cypher queries eficientes?
   - Performance com 100k nós?

**Branch:** `chatgpt/validacao-graph` + `chatgpt/otimizacao-bmi`

---

### Gemini: Design & Arquitetura

**Tarefas:**
1. Desenhar Recommendation Engine (Phase 3)
   - Como Decision Store treina ML?
   - Features + modelo + inference?

2. Desenhar Persistence Layer (Phase 2)
   - Schema PostgreSQL completo
   - Migrations + índices
   - Escalabilidade (100k eventos/mês)

3. Desenhar roadmap Phase 3-4
   - Timeline
   - Dependências
   - Riscos

**Branch:** `gemini/design-recommendation` + `gemini/roadmap-persistencia`

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
