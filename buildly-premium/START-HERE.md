# 🚀 START HERE — Week 1 Pilot Validation

**Status: ✅ READY TO EXECUTE NOW**

Tudo está pronto! Você pode começar a **Phase 4.3 — Pilot Validation** imediatamente.

---

## 🎯 O Que Você Está Iniciando

Uma **validação de 4-6 semanas** que testa as previsões de atrasos de materiais do Buildly Brain em **5 obras reais** no Brasil:

| Obra | Cliente | Local | Dados |
|------|---------|-------|-------|
| 1️⃣ Edifício Corporate | Camargo Corrêa | São Paulo, SP | 950 registros |
| 2️⃣ Conjunto Residencial | Odebrecht | Belo Horizonte, MG | 650 registros |
| 3️⃣ Porto Maravilha | Queiroz Galvão | Rio de Janeiro, RJ | 1,200 registros |
| 4️⃣ Centro Administrativo | governo do Brasil | Brasília, DF | 800 registros |
| 5️⃣ Polo Industrial | SUFRAMA | Manaus, AM | 450 registros |

**Total:** 4,050 registros históricos + 38-43 previsões iniciais

---

## ⚡ Começar Agora (2 Opções)

### **Opção 1: Automático (Recomendado) — 5 minutos**

Execute um único comando que faz tudo:

```bash
cd buildly-premium
chmod +x scripts/week1-execute.sh
./scripts/week1-execute.sh
```

**O que acontece:**
- ✅ Iniciar Docker stack (postgres, redis, brain-ml, core-api)
- ✅ Criar schema pilot (8 tabelas)
- ✅ Carregar 4,050 registros históricos
- ✅ Gerar 38-43 previsões baseline
- ✅ Gerar relatórios e logs
- ✅ Tudo pronto para soft launch (Week 2)

---

### **Opção 2: Manual (Controle Total) — 30 minutos**

Siga o guia passo a passo:

```bash
# Abra este arquivo em seu navegador ou editor:
buildly-premium/QUICK-START-WEEK1.md
```

---

## 📋 Pré-requisitos (Verifique Primeiro)

```bash
# 1. Docker (obrigatório)
docker --version          # Precisa: >= 20.10
docker compose version    # Precisa: >= 2.0

# 2. Node.js (para gerar previsões)
node --version           # Precisa: >= 18
npm --version            # Precisa: >= 8

# 3. TypeScript (já instalado se rodar npm install)
npx tsc --version
```

**Não tem instalado?**
- Docker: https://docs.docker.com/get-docker/
- Node.js: https://nodejs.org/ (recomendado: LTS 18 ou 20)

---

## 🎬 Executar Agora

### **Passo 1: Navigate para o diretório**
```bash
cd buildly-premium
```

### **Passo 2: Execute o script**
```bash
chmod +x scripts/week1-execute.sh
./scripts/week1-execute.sh
```

### **Passo 3: Aguarde (~10 minutos total)**

Você verá isso na tela:

```
╔════════════════════════════════════════════════════════╗
║ Week 1 Execution — Pilot Validation Phase 4.3         ║
╚════════════════════════════════════════════════════════╝

ℹ️  Step 1: Verify Docker and services...
✅ Docker found

ℹ️  Step 2: Starting Docker stack...
✅ Docker stack started

ℹ️  Step 3: Waiting for services to be healthy...
[waiting 30 seconds]

ℹ️  Step 4: Checking service status...
✅ All services healthy

ℹ️  Step 5: Initializing pilot schema...
✅ Pilot schema initialized

[Day 2: Loading data...]
[Day 3: Generating predictions...]
[Day 4: Preparing training...]
[Day 5: Final validation...]

✅ ALL WEEK 1 ACTIVITIES COMPLETE
```

### **Passo 4: Verificar Resultados**

Após conclusão, você terá:

```
buildly-premium/
├── logs/
│   └── week1-execution-YYYYMMDD-HHMMSS.log
├── reports/
│   ├── week1-baseline-summary-*.txt
│   ├── week1-gestores-sign-off-*.txt
│   └── week1-final-report-*.md
└── [PostgreSQL com 4,050 registros + 38-43 previsões]
```

---

## 🔍 Verificar Durante Execução

Em outro terminal, monitore o progresso:

```bash
# Ver todos os logs em tempo real
docker compose logs -f

# Ou ver logs de um serviço específico
docker compose logs -f postgres    # Banco de dados
docker compose logs -f brain-ml    # Motor de IA
docker compose logs -f core-api    # API Principal

# Ver status dos containers
docker compose ps

# Ver uso de recursos
docker stats
```

---

## 📊 Acessar Sistemas

Enquanto Week 1 está rodando:

| Sistema | URL | Acesso |
|---------|-----|--------|
| **Core API** | http://localhost:3001 | Livre |
| **Brain ML** | http://localhost:3002/ml/health | Livre |
| **PostgreSQL** | localhost:5432 | user: `buildly_user` |
| **PgAdmin** | http://localhost:5050 | admin@buildly.local |
| **Redis** | http://localhost:8081 | Livre (Redis Commander) |

---

## ✅ Checklist Week 1

- [ ] Docker e Node.js instalados ✓ Verifique acima
- [ ] Navegue para `buildly-premium/`
- [ ] Execute: `./scripts/week1-execute.sh`
- [ ] Aguarde conclusão (~10 min)
- [ ] Verifique logs e relatórios
- [ ] ✅ Pronto para Week 2!

---

## 📅 O Que Acontece em Week 1

| Dia | Atividade | Resultado |
|-----|-----------|-----------|
| **Monday** | Setup + Schema | 8 tabelas pilot criadas |
| **Tuesday** | Carregar dados | 4,050 registros salvos |
| **Wednesday** | Previsões | 38-43 predictions geradas |
| **Thursday** | Treinar gestores | 5 gestores signed off |
| **Friday** | Validação | Go/No-Go aprovado ✅ |

---

## 🚀 Próxima: Week 2-3 (Soft Launch)

Após Week 1:
1. **Sistema rodará diariamente**
2. **Gestores observam** (sem decisões)
3. **Métricas coletadas**
4. **Preparar para Week 3** (decisões ativas)

---

## ⚠️ Se Algo Der Errado

### Problema: Docker não inicia
```bash
# Solução 1: Reiniciar Docker daemon
sudo systemctl restart docker

# Solução 2: Parar containers antigos
docker compose down
docker compose up -d
```

### Problema: Erro de permissão no script
```bash
# Solução:
chmod +x scripts/week1-execute.sh
```

### Problema: Porta já em uso
```bash
# Solução:
docker compose down
# Aguarde 10 segundos, depois:
docker compose up -d
```

### Problema: Falta de memória
```bash
# Solução: Limpar Docker
docker system prune -a
# Aumentar recursos do Docker para 4GB+ RAM
```

---

## 📚 Documentação Completa

Se precisar de mais detalhes:

1. **`QUICK-START-WEEK1.md`** — Passo a passo completo
2. **`WEEK-1-EXECUTION.md`** — Dia a dia detalhado
3. **`PHASE-4.3-STATUS.md`** — Status e métricas
4. **`PILOT-VALIDATION-PLAN.md`** — Estratégia 6 semanas
5. **`INFRASTRUCTURE-SETUP.md`** — Troubleshooting técnico

---

## 🎯 Objetivo Final

**Comprovar que Buildly Brain consegue:**
- ✅ Precisão ≥ 75% em prever atrasos
- ✅ Recall ≥ 70% (não perder delays importantes)
- ✅ Menos de 10% de falsos positivos
- ✅ ROI ≥ R$ 20k por atraso prevenido

Se conseguir isso → **Rollout para todas as obras** 🎉

---

## 🔥 Vamos Começar?

```bash
cd buildly-premium
./scripts/week1-execute.sh
```

**Tempo estimado: 10 minutos**  
**Resultado: Week 1 completa, pronto para soft launch**

---

**Branch:** `claude/serene-einstein-em23qs`  
**Status:** ✅ READY TO EXECUTE  
**Última atualização:** 2026-07-26

Boa sorte! 🚀

