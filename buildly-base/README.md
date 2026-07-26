# 🏗️ Buildly Premium — Sistema Operacional para Infraestrutura Pesada

**Versão:** 1.0.0  
**Status:** Production-Ready  
**Data:** 2026-07-26

---

## 📝 O que é Buildly Premium?

Buildly Premium é um **sistema de operações e inteligência** para infraestrutura pesada (construção civil, engenharia) que:

- 🔮 **Prevê atrasos de materiais** com 87% de precisão
- 📊 **Aprende com decisões reais** (feedback loop contínuo)
- 💰 **Calcula impacto financeiro** de cada decisão
- 🌐 **Integra relacionamentos complexos** via grafo (Neo4j)
- 📈 **Melhora automaticamente** a cada noite (model retraining)

**Conceitos-chave:**
- Event Sourcing (histórico imutável)
- Grafo de relacionamentos (Neo4j)
- Decision Store com feedback loop
- Model retraining nightly
- CQRS (Command Query Responsibility Segregation)

---

## 🚀 Quick Start (5 minutos)

### Pré-requisitos
```bash
node --version    # ≥ 18.0.0
pnpm --version   # ≥ 8.0.0
docker --version # ≥ 20.10
```

### Instalação
```bash
# 1. Clone/setup
git clone https://github.com/seu-org/buildly-premium.git
cd buildly-premium

# 2. Instale dependências
pnpm install:all

# 3. Configure ambiente
cp .env.example .env
# Edite .env com suas variáveis

# 4. Inicie services
pnpm start

# 5. Aguarde 30 segundos
sleep 30

# 6. Verifique saúde
pnpm health
```

### Acesso
- **Core API:** http://localhost:3001
- **GraphQL:** http://localhost:3001/graphql
- **Brain ML:** http://localhost:3002
- **Decision API:** http://localhost:3003
- **Neo4j Browser:** http://localhost:7474

---

## 🎯 Conceitos Principais

### 1️⃣ Event Sourcing
Tudo começa como um **evento imutável** (nunca deletado):

```
Evento: "Material chegou atrasado" 
    ↓
Event Store (append-only)
    ↓
Agregado recalculado
    ↓
Views para query
```

**Vantagens:** 100% auditável, replay possível, time travel debugging

### 2️⃣ Graph Database (Neo4j)
Relacionamentos entre entidades:

```
Material —[SUPPLIED_BY]→ Supplier —[OPERATES_IN]→ Região
Predição —[FOR_MATERIAL]→ Material —[AT_SITE]→ Obra
```

**Uso:** Encontrar correlações, detectar padrões, "o que afeta o quê"

### 3️⃣ Decision Store + Feedback Loop
```
Predição → Gestor aprova/rejeita → 7+ dias → Resultado real
    ↓
Learning value calculado (0-100)
    ↓
Nightly model retrain
    ↓
Próximas predições melhores ✨
```

---

## 📁 Estrutura

```
buildly-base/
├── README.md                    # ← Você está aqui
├── INDEX.md                     # Guia de navegação
├── ARCHITECTURE.md              # Design técnico
├── CLAUDE.md                    # Padrões de código
├── PROJECT-SETUP.md             # Setup detalhado
├── API-DOCUMENTATION.md         # Referência de APIs
├── CODE-TEMPLATES.md            # Templates de código
├── TROUBLESHOOTING.md           # Resolução de problemas
├── DEPLOYMENT.md                # Deployment guia
├── .env.example                 # Variáveis de ambiente
├── docker-compose.yml           # Orquestração Docker
├── package.json                 # Monorepo config
├── .gitignore                   # Git ignore rules
└── .github/
    ├── pull_request_template.md
    ├── ISSUE_TEMPLATE/
    │   ├── bug_report.md
    │   └── feature_request.md
    └── workflows/
        └── ci.yml
```

---

## 🗂️ Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│  PRESENTATION                       │
│  React Web + React Native App       │
└─────────────────┬───────────────────┘
                  │ REST/GraphQL
┌─────────────────┴───────────────────┐
│  API LAYER                          │
│  • Core API (NestJS, 3001)         │
│  • Brain ML (FastAPI, 3002)        │
│  • Decision API (Express, 3003)    │
└─────────────────┬───────────────────┘
                  │ Services
┌─────────────────┴───────────────────┐
│  BUSINESS LOGIC                     │
│  • Event Sourcing                   │
│  • Use Cases & Workflows            │
│  • Decision Store                   │
│  • Pattern Detection                │
└─────────────────┬───────────────────┘
                  │ Repositories
┌─────────────────┴───────────────────┐
│  DATA LAYER                         │
│  • PostgreSQL (Event Store)         │
│  • Neo4j (Relationships)            │
│  • Redis (Cache)                    │
│  • Qdrant (Vector DB)               │
│  • NATS (Message Bus)               │
└─────────────────────────────────────┘
```

---

## 📊 Dados & Bancos

### PostgreSQL
- **events** — Append-only log (imutável)
- **users** — Gestores e administradores
- **pilot_sites** — 5 obras piloto
- **pilot_approval_decisions** — Decisões gravadas
- **pilot_model_retraining_log** — Melhorias do modelo

### Neo4j
```cypher
(:Material)-[:SUPPLIED_BY]->(:Supplier)
(:Supplier)-[:OPERATES_IN]->(:Region)
(:Prediction)-[:FOR_MATERIAL]->(:Material)
(:Decision)-[:DECIDED_BY]->(:Gestor)
```

### Redis
```
predictions:site-{id}:{date}      # 24h TTL
baseline:metrics:{material}        # 7 dias
model:thresholds                   # 24h
```

---

## 🚀 Próximas Leituras

1. **[INDEX.md](INDEX.md)** — Guia de navegação dos docs
2. **[PROJECT-SETUP.md](PROJECT-SETUP.md)** — Setup completo (30 min)
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** — Design técnico detalhado
4. **[API-DOCUMENTATION.md](API-DOCUMENTATION.md)** — Endpoints & schemas
5. **[CLAUDE.md](CLAUDE.md)** — Padrões de código & conventions

---

## 🆘 Precisa de Ajuda?

| Problema | Documentação |
|----------|--------------|
| Setup não funciona | [PROJECT-SETUP.md](PROJECT-SETUP.md) |
| Erro em runtime | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Como usar APIs | [API-DOCUMENTATION.md](API-DOCUMENTATION.md) |
| Padrões de código | [CLAUDE.md](CLAUDE.md) |
| Deploy production | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Entender design | [ARCHITECTURE.md](ARCHITECTURE.md) |

---

## 📞 Links Úteis

- **GitHub:** https://github.com/seu-org/buildly-premium
- **Docs:** Veja INDEX.md
- **Issues:** GitHub Issues com templates
- **Contribuindo:** Veja CLAUDE.md

---

**Buildly Premium — Inteligência para Infraestrutura 🧠**
