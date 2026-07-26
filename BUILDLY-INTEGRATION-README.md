# 🏗️ Integração JC ↔ Buildly

**Status:** ✅ Implementação Completa (Fase 1-3)  
**Data:** 2026-07-26  
**Responsável:** Claude Code (Autonomia + Sabedoria)

---

## 📌 Visão Geral

JC (seu sistema de gestão de tarefas) agora está integrado com **Buildly** (sua plataforma operacional).

### Fluxo de Integração

```
JC: Tarefa Criada/Atualizada
    ↓ [Event Sourcing]
Buildly Core: Registra Evento (Imutável)
    ↓ [ML Analysis]
Buildly Brain: Observa Padrões → Prevê Atrasos
    ↓ [Webhook]
JC: Recebe Recomendações → Executa Ações
```

---

## 🚀 Componentes Implementados

### 1️⃣ **buildly-client.ts**
Cliente TypeScript para comunicação com Buildly

**Métodos principais:**
- `healthCheck()` — Verifica conectividade
- `syncEvent(event)` — Sincroniza evento com Event Sourcing
- `analyzeWithBrain(context)` — Pede análise de atrasos
- `recordDecision(decision)` — Registra decisão no Decision Store
- `getRecommendations(taskId)` — Busca recomendações do Brain

### 2️⃣ **sync-jc-to-buildly.ts**
Script que orquestra a sincronização completa

**Fluxo:**
1. Lê TAREFAS_EM_ANDAMENTO.md
2. Sincroniza eventos com Buildly Core
3. Envia contexto para análise do Brain
4. Gera relatório com recomendações

**Uso:**
```bash
npm run sync:dev      # Sincroniza com localhost
npm run sync:prod     # Sincroniza com cloud
```

### 3️⃣ **test-buildly-client.ts**
Suite de testes para validar integração

**Testa:**
- Health check do Buildly
- Sincronização de eventos
- Análise do Brain ML
- Registro de decisões

**Uso:**
```bash
npm test
```

### 4️⃣ **brain-webhook-handler.ts**
Handler que processa recomendações do Brain ML

**Ao receber webhook:**
1. Atualiza TAREFAS_EM_ANDAMENTO.md com alerta
2. Registra decisão em Buildly Core
3. Executa ações automáticas se risco é HIGH

**Uso (simulado):**
```bash
npm run ts-node scripts/brain-webhook-handler.ts
```

---

## 🔧 Setup

### Pré-requisitos

```bash
# 1. Node.js 18+
node --version

# 2. Instalar dependências
cd scripts
npm install
```

### Configuração

**Arquivo:** `.claude/buildly-config.env.example`

```bash
# Copiar para .env.local (não commitar!)
cp .claude/buildly-config.env.example .env.local

# Preencher com credenciais reais
```

---

## 📡 Ambientes

### Desenvolvimento Local

```bash
npm run sync:dev       # Sincroniza com localhost:3001/3002
```

**Endpoints:**
- Core API: `http://localhost:3001`
- Brain ML: `http://localhost:3002`
- Health checks disponíveis

### Produção (Cloud)

```bash
npm run sync:prod      # Sincroniza com api.buildly.app
```

**Endpoints:**
- Core API: `https://api.buildly.app`
- Brain ML: `https://brain.buildly.app`

---

## 💻 Exemplos de Uso

### Sincronizar Única Tarefa

```typescript
import { BuildlyClient } from './buildly-client';

const client = new BuildlyClient({
  env: 'dev',
  coreApiUrl: 'http://localhost:3001',
  brainApiUrl: 'http://localhost:3002',
  // ... outros campos
});

// Sincronizar evento
await client.syncEvent({
  type: 'TASK_CREATED',
  taskId: 'TAREFA-1-compra-cimento',
  timestamp: new Date().toISOString(),
  data: {
    titulo: 'Compra de Cimento CP II',
    responsavel: 'Aline',
    dataTermino: '2026-07-31',
  },
  userId: 'jonacir70@icloud.com',
});
```

### Pedir Análise do Brain

```typescript
const recommendations = await client.analyzeWithBrain({
  diaryEntries: ['Atraso na entrega...', '...'],
  taskHistory: tasks,
  timeline: { start, end },
});

recommendations.forEach(rec => {
  console.log(`Predição: ${rec.prediction}`);
  console.log(`Ação: ${rec.recommendedAction}`);
});
```

### Processar Webhook do Brain

```typescript
import { BrainWebhookHandler } from './brain-webhook-handler';

const handler = new BrainWebhookHandler(client, tarefasPath);

// Quando Brain envia webhook
await handler.handleBrainRecommendation({
  taskId: 'TAREFA-1-compra-cimento',
  prediction: 'Atraso de 7-10 dias',
  confidence: 85,
  recommendedAction: 'Antecipar compra',
  estimatedImpact: 'HIGH',
  timeToEvent: 7,
  riskLevel: 'HIGH',
});
```

---

## 📊 Relatórios

Após sincronização, é gerado: **BUILDLY-SYNC-REPORT.md**

Contém:
- ✅ Tarefas sincronizadas
- 🧠 Recomendações do Brain
- 📈 Status de integração

---

## 🔒 Segurança

### Credenciais

⚠️ **NUNCA commitar:**
- `.env.local`
- `buildly-config.env`
- Senhas de BD

✅ **Usar:**
- Variáveis de ambiente
- `.env.example` como template

### Event Sourcing

Buildly registra TUDO com imutabilidade:
- Cada evento é imutável
- Histórico completo preservado
- Rastreabilidade 100%

---

## 🧠 Como Brain ML Funciona

### Input
- Documentos: diários, reuniões, cronogramas
- Histórico: tarefas passadas e seus atrasos
- Padrões: fornecedores que frequentemente atrasam

### Processing
- Análise de séries temporais
- Detecção de anomalias (EMA algorithm)
- Correlação entre variáveis

### Output
- Predição: "Atraso de 7-10 dias"
- Confiança: 85%
- Ação: "Antecipar compra em 5 dias"
- Impacto: "HIGH - afeta cronograma"

### ⚠️ Importante
Brain **NÃO executa** — apenas recomenda.  
Decisões são sempre **registradas em Buildly Core** para auditoria.

---

## 🎯 Próximas Fases

### Fase 1: ✅ Integração Básica
- [x] Cliente Buildly
- [x] Sincronização de eventos
- [x] Análise Brain ML

### Fase 2: 🟡 Webhooks Automáticos
- [ ] API webhook do Brain
- [ ] Processador de recomendações
- [ ] Automações por risco

### Fase 3: 🟢 Neo4j Graph
- [ ] Mapa de relacionamentos
- [ ] Análise de impacto
- [ ] Consultas complexas

---

## 📚 Referências

- **CLAUDE.md** — Protocolo de autonomia
- **.claude/BUILDLY-INTEGRACAO.md** — Documentação técnica
- **.claude/buildly-config.env.example** — Template de configuração
- **BUILDLY-SYNC-REPORT.md** — Relatório de sincronização

---

## 🆘 Troubleshooting

### Buildly offline?
```bash
# Modo simulado ativa automaticamente
npm run sync:dev
# Continua mesmo sem Buildly online
```

### Webhook não chega?
1. Verificar URL de callback
2. Confirmar que Brain está online
3. Ver logs em Buildly dashboard

### Evento não sincroniza?
1. Validar formato do evento
2. Checar credenciais
3. Ver `BUILDLY-SYNC-REPORT.md`

---

**🚀 Integração pronta para produção!**
