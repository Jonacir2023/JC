# 🚀 INÍCIO AQUI — Guia para Usar Este Repositório

**Bem-vindo ao Buildly Premium!**

Este é um repositório de **desenvolvimento colaborativo entre agentes de IA** (Claude, ChatGPT, Gemini).

---

## 📋 O Que é Este Repositório?

O Buildly Premium é um **Sistema Operacional para Infraestrutura Pesada** que funciona com:

1. **Event Sourcing** — Registra tudo que acontece
2. **Graph Intelligence** — Neo4j para relacionamentos
3. **Digital Twin** — Compara REAL vs PLANEJADO vs FORECAST
4. **BMI Calculator** — Score de maturidade em 8 dimensões
5. **Multi-Agent Orchestration** — Coordena trabalho entre IAs

---

## 👤 Você é...

### ▶️ Um Investidor / Gestor (Lê apenas)
👉 **Faça isto:**
1. Leia `docs/STATUS.md` — estado atual do projeto
2. Leia `docs/ROADMAP.md` — o que vem por aí
3. Volte a cada semana para monitorar progresso
4. Pronto! Agora é só sentar e observar

### ▶️ ChatGPT (Validador)
👉 **Faça isto:**
1. Clone: `git clone [REPO_URL]`
2. Checkout: `git checkout chatgpt/validacao-graph`
3. Leia: `COLABORADORES-SETUP.md`
4. Leia: `ARCHITECTURE_HANDBOOK.md`
5. Revise: código em `libs/intelligence-types/` e `apps/intelligence-layer/`
6. Crie: `docs/architecture-review-chatgpt.md`
7. Commit: `git commit -m "docs: validação de graph architecture"`
8. Push: `git push origin chatgpt/validacao-graph`
9. Abra PR: `gh pr create --base master`

### ▶️ Gemini (Arquiteto)
👉 **Faça isto:**
1. Clone: `git clone [REPO_URL]`
2. Checkout: `git checkout gemini/design-recommendation`
3. Leia: `COLABORADORES-SETUP.md`
4. Leia: `ARCHITECTURE_HANDBOOK.md`
5. Desenhe: `docs/phase3-recommendation-engine.md`
6. Commit: `git commit -m "docs: phase 3 recommendation engine design"`
7. Push: `git push origin gemini/design-recommendation`
8. Abra PR: `gh pr create --base master`

### ▶️ Claude (Implementador)
👉 **Já está trabalhando:**
1. Monitorar PRs de ChatGPT e Gemini
2. Integrar feedback
3. Manter master funcional
4. Atualizar STATUS.md

---

## 📂 Estrutura do Repositório

```
buildly-premium/
├── .github/workflows/          # ⚙️ GitHub Actions (automação)
│   ├── auto-status.yml         # Atualiza STATUS.md
│   ├── notify-agents.yml       # Notifica agentes
│   └── validate-pr.yml         # Valida código
│
├── docs/                       # 📚 Documentação & Coordenação
│   ├── STATUS.md               # ← LEIA ISTO PRIMEIRO
│   ├── ROADMAP.md              # Timeline e fases
│   ├── AGENTES.md              # Definição de papéis
│   ├── INICIO-AQUI.md          # Este arquivo
│   └── (arquivos de design gerados por agentes)
│
├── libs/                       # 📦 Bibliotecas compartilhadas
│   ├── common-types/           # Phase 1: IEvent, IObjective, IDecision
│   └── intelligence-types/     # Phase 2: Graph, Twin, BMI
│
├── apps/                       # 🚀 Aplicações
│   ├── core-api/               # Phase 1: Workflows
│   └── intelligence-layer/     # Phase 2: Neo4j, Twin, BMI
│
├── ARCHITECTURE_HANDBOOK.md    # 📖 "Constituição" do projeto
├── CLAUDE.md                   # 💻 Padrões de código
├── README.md                   # Overview geral
├── COLABORADORES-SETUP.md      # 🎓 Guia para novos agentes
└── package.json                # Dependencies
```

---

## 🔍 Principais Arquivos para Ler

### Para Entender o Projeto
1. **STATUS.md** — Estado atual (leia sempre primeiro)
2. **ROADMAP.md** — O que vem por aí
3. **ARCHITECTURE_HANDBOOK.md** — Conceitos técnicos
4. **README.md** — Overview rápido

### Para Começar a Trabalhar
1. **COLABORADORES-SETUP.md** — Setup inicial
2. **AGENTES.md** — Seu papel específico
3. **CLAUDE.md** — Padrões de código

### Para Ver o Código
1. `apps/intelligence-layer/demo.ts` — Demo interativa
2. `apps/intelligence-layer/bmi-demo.ts` — Demo do BMI
3. `libs/intelligence-types/src/` — Interfaces principais

---

## ▶️ Executar Demos

Veja Phase 2 em ação:

```bash
# Demo Phase 2B: Digital Twin
cd apps/intelligence-layer
npx ts-node demo.ts

# Demo Phase 2C: BMI Calculator
npx ts-node bmi-demo.ts
```

---

## 🔄 Ciclo de Trabalho (Para Agentes)

```
1. Ler STATUS.md
   └─ Entender o que precisa fazer

2. Clonar repositório
   └─ git clone [REPO_URL]

3. Checkout sua branch
   └─ git checkout chatgpt/* ou gemini/*

4. Fazer seu trabalho
   └─ Revisar código, desenhar arquitetura, etc

5. Commit + Push
   └─ git commit -m "descrição clara"
   └─ git push origin sua-branch

6. Abrir PR
   └─ gh pr create --base master

7. GitHub Actions notifica automaticamente
   └─ Outros agentes veem e respondem

8. Esperar integração
   └─ Claude revisa e faz merge

9. Voltar a STATUS.md
   └─ Ver próximas tarefas
```

---

## 🚦 Como o Sistema Funciona

```
Agente faz COMMIT
    ↓
GitHub Action DISPARA
    ↓
STATUS.md é ATUALIZADO
    ↓
Outros agentes NOTIFICADOS via PR comment
    ↓
Agentes LEEM STATUS.md
    ↓
Agentes TRABALHAM em suas branches
    ↓
Agentes ABREM PRs
    ↓
GitHub Actions VALIDA código
    ↓
Claude INTEGRA tudo
    ↓
Master fica SINCRONIZADO
    ↓
🔄 LOOP CONTINUA (sem você fazer nada)
```

---

## ❓ Perguntas Frequentes

**P: Onde vejo o progresso?**  
R: Abra `docs/STATUS.md` — atualizado automaticamente a cada commit.

**P: Como dou tarefas para os agentes?**  
R: Abra uma Issue no GitHub com labels `[claude]`, `[chatgpt]`, ou `[gemini]`.

**P: Como vejo o que cada agente está fazendo?**  
R: Veja `docs/AGENTES.md` para papéis, ou `docs/STATUS.md` para status atual.

**P: E se houver conflito entre sugestões?**  
R: Claude (System Integrator) toma a decisão final.

**P: Quando estaremos prontos para produção?**  
R: Veja `docs/ROADMAP.md` — fases e datas.

**P: Posso fazer alterações eu mesmo?**  
R: Sim, mas sempre abra PRs. Nunca commit direto em master.

---

## 🎯 Checklist Rápido

### Se Você É Um Gestor/Investidor
- [ ] Ler STATUS.md
- [ ] Ler ROADMAP.md
- [ ] Bookmarkar este repo
- [ ] Voltar a cada semana
- [ ] **Pronto!**

### Se Você É ChatGPT
- [ ] Ler COLABORADORES-SETUP.md
- [ ] Clone o repo
- [ ] Checkout chatgpt/validacao-graph
- [ ] Revisar código em libs/ e apps/
- [ ] Criar docs/architecture-review-chatgpt.md
- [ ] Commit + Push + PR
- [ ] Monitorar comentários

### Se Você É Gemini
- [ ] Ler COLABORADORES-SETUP.md
- [ ] Clone o repo
- [ ] Checkout gemini/design-recommendation
- [ ] Desenhar Phase 3 em docs/
- [ ] Commit + Push + PR
- [ ] Monitorar comentários
- [ ] Responder feedback

### Se Você É Claude
- [ ] Monitorar PRs
- [ ] Integrar feedback
- [ ] Manter master funcional
- [ ] Atualizar STATUS.md
- [ ] Abrir issues para próximas tarefas

---

## 📞 Suporte

- **Dúvida técnica?** → Veja `ARCHITECTURE_HANDBOOK.md`
- **Dúvida de padrão de código?** → Veja `CLAUDE.md`
- **Dúvida do seu papel?** → Veja `AGENTES.md`
- **Bloqueador?** → Abra Issue com label `[bloqueador]`

---

## 🎉 Bem-Vindo!

O Buildly Premium está pronto para colaboração autônoma entre agentes de IA.

**Sua única responsabilidade agora é observar o STATUS.md e ver a mágica acontecer.**

🚀 **Vamos construir o futuro da infraestrutura pesada!**

---

**Última atualização:** 2026-07-19  
**Versão:** 1.0  
**Status:** Pronto para Produção (Phase 1-2)
