# 📚 Guia de Setup para Colaboradores (ChatGPT + Gemini)

**Data:** 19 de julho de 2026  
**Status:** Pronto para colaboração 3-Hands

---

## 🎯 Bem-vindo ao Buildly Premium!

Este projeto utiliza um modelo de **colaboração paralela** onde você trabalha autonomamente em sua própria branch e integra seu trabalho via pull request.

**Seu papel:**
- **ChatGPT:** Validação arquitetural, otimização de código, performance
- **Gemini:** Design de sistemas, arquitetura, planejamento roadmap

---

## 🚀 Setup Inicial (Primeira Vez)

### 1. Clone o Repositório

```bash
git clone <REPO_URL>
cd buildly-premium
```

### 2. Instale Dependências

```bash
pnpm install
```

### 3. Configure Ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais PostgreSQL + Neo4j
export PG_HOST=localhost
export PG_PORT=5432
export PG_DATABASE=buildly
export PG_USER=postgres
export PG_PASSWORD=password
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=password
export NEO4J_DB=neo4j
```

### 4. Inicie Docker (Bancos de Dados)

```bash
docker-compose up -d
```

---

## 📋 Branches de Trabalho

### Para ChatGPT (Validação & Otimização)

Sua branch principal: **`chatgpt/validacao-graph`**

```bash
# Clonar a branch
git clone -b chatgpt/validacao-graph <REPO_URL>
cd buildly-premium

# Ou se já tem clone:
git checkout chatgpt/validacao-graph
git pull origin chatgpt/validacao-graph
```

**Tarefas esperadas:**
1. Revisar `/libs/intelligence-types/src/graph-node.interface.ts`
   - Nós (EVENTO, OBJETIVO, DECISAO, COLABORADOR) são suficientes?
   - Relacionamentos (AMEACA, AFETA, MITIGADA_POR, CAUSADA_POR) cobrem todos os casos?
   - Propor novos nós ou relacionamentos se necessário

2. Revisar `/libs/intelligence-types/src/bmi.interface.ts`
   - 8 dimensões fazem sentido?
   - Pesos (Execução 0.35, Financeiro 0.25, etc.) estão balanceados?
   - Indicadores são os certos?

3. Revisar `/apps/intelligence-layer/src/infrastructure/queries.ts` (seção CYPHER)
   - Queries Cypher estão otimizadas?
   - Índices Neo4j recomendados?
   - Performance com 100k nós?

4. Revisar `/apps/intelligence-layer/src/bmi-engine/bmi-calculator.service.ts`
   - Fórmulas das 8 dimensões estão corretas?
   - Há oportunidades de otimização?

**Salida esperada:**
```
docs/architecture-review-chatgpt.md
  - Validação de nós e relacionamentos
  - Análise de fórmulas BMI
  - Recomendações de índices Neo4j
  - Performance analysis
```

---

### Para Gemini (Design & Arquitetura)

Sua branch principal: **`gemini/design-recommendation`**

```bash
# Clonar a branch
git clone -b gemini/design-recommendation <REPO_URL>
cd buildly-premium

# Ou se já tem clone:
git checkout gemini/design-recommendation
git pull origin gemini/design-recommendation
```

**Tarefas esperadas:**

1. **Desenhar Recommendation Engine (Phase 3)**
   - Como Decision Store (Phase 1) conecta a ML training?
   - Quais features (variáveis) alimentam o modelo?
   - Qual modelo ML é apropriado (regressão, classificação, ranking)?
   - Como fazer inference em tempo real?
   - Arquivo: `docs/phase3-recommendation-engine.md`

2. **Desenhar Persistence Layer (Phase 2)**
   - Schema PostgreSQL completo (migrations, ENUMs, constraints)
   - Índices estratégicos
   - Escalabilidade (100k eventos/mês)
   - Backup e recovery strategy
   - Arquivo: `docs/phase2-persistence-design.md`

3. **Desenhar Roadmap Phase 3-4**
   - Timeline (semanas)
   - Dependências entre componentes
   - Riscos e mitigações
   - Arquivo: `docs/phase3-4-complete-roadmap.md`

**Saída esperada:**
```
docs/
  ├── phase3-recommendation-engine.md (arquitetura ML)
  ├── phase2-persistence-design.md (schema + migrations)
  └── phase3-4-complete-roadmap.md (timeline + roadmap)
```

---

## 🔄 Fluxo de Trabalho

### 1. Faça suas mudanças na sua branch

```bash
git checkout chatgpt/validacao-graph  # ou sua branch
# ... edite arquivos ...
git add .
git commit -m "feat: documento de validação de graph architecture"
```

### 2. Push para origin

```bash
git push origin chatgpt/validacao-graph
```

### 3. Crie uma Pull Request

Vá para GitHub e abra uma PR:
- **Base:** `claude/serene-einstein-em23qs` (branch de integração do Claude)
- **Head:** sua branch (ex: `chatgpt/validacao-graph`)
- **Título:** "chore: validação de graph architecture (ChatGPT)"
- **Descrição:** Explique:
  - O que foi validado
  - Achados principais
  - Recomendações
  - Se há mudanças de código (com justificativa)

### 4. Claude revisa e integra

Claude vai revisar, solicitar mudanças se necessário, e fazer merge.

---

## 📁 Estrutura de Diretórios

```
buildly-premium/
├── libs/
│   ├── common-types/              # Phase 1: IEvent, IObjective, IDecision
│   └── intelligence-types/        # Phase 2: Graph, Twin, BMI
├── apps/
│   ├── core-api/                  # Phase 1: Event workflows
│   └── intelligence-layer/        # Phase 2: Neo4j, Digital Twin, BMI
├── docs/                          # ← ARQUIVOS DE DESIGN/ANÁLISE VÃO AQUI
│   ├── architecture-review-chatgpt.md
│   ├── phase3-recommendation-engine.md
│   ├── phase2-persistence-design.md
│   └── phase3-4-complete-roadmap.md
├── ARCHITECTURE_HANDBOOK.md       # Constituição técnica
├── CLAUDE.md                      # Padrões de desenvolvimento
├── README.md                       # Overview + setup
└── package.json
```

---

## 💻 Comandos Úteis

### Ver status da sua branch

```bash
git status
git log --oneline -10
```

### Sincronizar com a branch de integração (Claude)

```bash
git fetch origin
git merge origin/claude/serene-einstein-em23qs
```

### Desfazer commits locais (se necessário)

```bash
git reset HEAD~1  # Desfaz último commit, mantém mudanças
git reset --hard HEAD~1  # Desfaz e descarta mudanças
```

### Ver diferenças antes de fazer push

```bash
git diff origin/chatgpt/validacao-graph
```

---

## 🔗 Arquivos Críticos para Revisar

### Para ChatGPT (Validação)
- `/libs/intelligence-types/src/graph-node.interface.ts` (500 linhas)
- `/libs/intelligence-types/src/bmi.interface.ts` (600 linhas)
- `/apps/intelligence-layer/src/bmi-engine/bmi-calculator.service.ts` (400 linhas)
- `/apps/intelligence-layer/src/infrastructure/queries.ts` (300 linhas)
- `/workspace/buildly-premium/ARCHITECTURE_HANDBOOK.md` (400 linhas)

### Para Gemini (Design)
- `/workspace/buildly-premium/ARCHITECTURE_HANDBOOK.md` (visão geral)
- `/libs/common-types/src/decision.interface.ts` (feedback_score field)
- `/apps/intelligence-layer/src/neo4j/event-sync.worker.ts` (sincronização)
- `/apps/intelligence-layer/src/bmi-engine/bmi-calculator.service.ts` (métricas)

---

## 📞 Comunicação & Status

**Status Atual:** Phase 2A (Graph Intelligence) 70% completo  
**Próxima Sincronização:** 21 de julho de 2026  
**Modelo:** 3-Hands Colaborativo (não consultoria)

### Comunicação
- Documentação e decisões: via este repositório + Obsidian vault
- PRs e code review: via GitHub
- Discussões arquiteturais: via ARCHITECTURE_HANDBOOK.md + documentação em `docs/`

---

## 🎓 Referências Rápidas

- **IEvent:** Imutável, vem de eventos reais do canteiro
- **IObjective:** Meta com status (PLANEJADO, EM_EXECUCAO, etc.)
- **IDecision:** Escolha com feedback_score conectando resultado_esperado ← → resultado_real
- **Neo4j Graph:** Sincronização automática de Eventos → Objetivos → Decisões
- **Digital Twin:** Compara REAL vs PLANEJADO vs FORECAST (ML prediction)
- **BMI:** Score 0-100 em 8 dimensões, base para recomendações Phase 3

---

## ✅ Checklist de Setup

- [ ] Git clone
- [ ] pnpm install
- [ ] .env configurado
- [ ] Docker rodando (PostgreSQL + Neo4j)
- [ ] Leu ARCHITECTURE_HANDBOOK.md
- [ ] Leu README.md
- [ ] Entendeu sua role (ChatGPT validador vs Gemini arquiteto)
- [ ] Checkout da sua branch
- [ ] Pronto para começar!

---

**Bem-vindo ao time! 🚀**

Qualquer dúvida, abra uma issue no GitHub ou documente em `docs/PERGUNTAS.md`.
