# 🏗️ Buildly × JC: Integração Operacional

**Data:** 2026-07-26  
**Status:** 🟡 PLANEJAMENTO

---

## 📋 O Que é Buildly

**Buildly** = Sistema Operacional Integrado para Infraestrutura Pesada

### Componentes Principais

#### 🏗️ **Buildly Core** (Orquestrador Central)
- **Event Sourcing**: Registra TUDO com imutabilidade
- **Neo4j**: Grafo de relacionamentos (entidades, dependências)
- **Workflows**: Orquestração de processos
- **Decision Store**: Histórico de decisões
- **Porta Local:** `http://localhost:3001`

#### 🧠 **Buildly Brain** (ML — Não-Orquestrante)
- **Previsão de Atrasos**: 7-30 dias de antecedência
- **Análise de Documentos**: Diários, reuniões, contratos, cronogramas
- **Detecção de Padrões**: Histórico de entregas
- **Recomendações**: Otimização de custo/recursos
- **Aprende via Feedback**: EMA algorithm
- **Porta Local:** `http://localhost:3002`
- ⚠️ **Importante:** Brain NÃO executa — apenas pensa e recomenda

---

## 🌐 Ambientes

### 🖥️ Desenvolvimento (Local)

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Core API** | `http://localhost:3001` | — |
| **Brain ML** | `http://localhost:3002` | — |
| **PostgreSQL** | `localhost:5432` | `buildly_user` / `buildly_secure_password_2026` |
| **Redis** | `localhost:6379` | `buildly_redis_2026` |
| **Neo4j** (futuro) | `localhost:7687` | — |
| **PgAdmin** | `http://localhost:5050` | `admin@buildly.local` / `admin` |
| **Redis Commander** | `http://localhost:8081` | Sem autenticação |

**Health Checks:**
```bash
curl http://localhost:3001/health      # Core
curl http://localhost:3002/ml/health   # Brain
```

### ☁️ Produção (Cloud)

| Serviço | URL |
|---------|-----|
| **Core API** | `https://api.buildly.app` |
| **Brain ML** | `https://brain.buildly.app` |
| **PostgreSQL** | `postgres-prod.c.buildly.cloud:5432` |
| **Redis** | `redis-prod.c.buildly.cloud:6379` |

---

## 🔗 Como JC Se Integra com Buildly

### Fluxo Proposto

```
JC (Sistema de Gestão de Tarefas)
    ↓
Registra Tarefas/Eventos em Buildly Core
    ↓
Buildly Brain Observa:
  - Diários de Obra (vault/Diário/)
  - Cronogramas (TAREFAS_EM_ANDAMENTO.md)
  - Histórico de Atrasos
    ↓
Brain Detecta Padrões → Prevê Atrasos
    ↓
JC Recebe Recomendações → Ajusta Cronograma/Prioridades
```

### Casos de Uso Imediatos

1. **Sincronizar Tarefas JC → Buildly Core**
   - Cada tarefa em JC → Evento em Buildly
   - Status change → Event Sourcing registra
   - Histórico completo e imutável

2. **Brain Analisa Diário de Obras**
   - Observa atrasos de materiais
   - Detecta padrões (fornecedor X sempre atrasa em Y dias)
   - Previne problema antes que aconteça

3. **Decisões Orquestradas**
   - Brain recomenda: "Antecipe compra de cimento em 5 dias"
   - JC registra decisão no Decision Store
   - Rastreabilidade 100%

---

## 🛠️ Próximos Passos (Minha Autonomia)

### Fase 1: Integração Local (Pronta para Testar)
- [ ] Conectar JC → Buildly Core (POST events)
- [ ] Mapear TAREFAS_EM_ANDAMENTO.md → Buildly Events
- [ ] Testar health checks local
- [ ] Validar fluxo de dados

### Fase 2: Brain Integration
- [ ] Expor diários de obra para Brain (análise)
- [ ] Implementar webhook para recomendações
- [ ] Testar previsão de atrasos

### Fase 3: Neo4j Graph (Futuro)
- [ ] Mapear relacionamentos (tarefas, fornecedores, materiais)
- [ ] Consultas de impacto: "Se atrasar X, afeta Y?"
- [ ] Análise de dependências

---

## 🎯 Pergunta-Chave

**"Como você quer que eu use Buildly para potencializar JC?"**

Opções:

A) **Começar com sincronização de eventos** (JC → Buildly Core)
B) **Focar em Brain: análise de atrasos** (Buildly Brain → recomendações)
C) **Integração completa** (tudo, fases 1-3)
D) **Apenas documentar/investigar** (sem implementar ainda)

---

## 📝 Notas Importantes

- ⚠️ **Buildly Brain NÃO executa**. Apenas recomenda via API
- ✅ **Buildly Core orquestra**. Registra eventos, executa workflows
- 🔒 **Event Sourcing** = histórico completo, imutabilidade
- 📊 **Neo4j** = futuro, mas crítico para análise de dependências
- 🎓 **EMA Algorithm** = Brain aprende com feedback humano

---

**Aguardando sua orientação para agir com sabedoria.**
