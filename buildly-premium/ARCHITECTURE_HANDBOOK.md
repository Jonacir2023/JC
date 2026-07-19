# 🏛️ Buildly Architecture Handbook — Constituição Técnica & Produto

**Versão:** 1.0.0 | **Data:** 2026-07-19 | **Status:** 🟢 Operative

---

## 📖 Índice Mestre

1. [Visão de Produto e Filosofia](#1-visão-de-produto-e-filosofia)
2. [Domínios de Inteligência (Buildly Intelligence Layer)](#2-domínios-de-inteligência)
3. [Modelo de Dados e Entidades Fundamentais](#3-modelo-de-dados-e-entidades-fundamentais)
4. [Arquitetura Técnica e Infraestrutura](#4-arquitetura-técnica-e-infraestrutura)
5. [Catálogos e Glossário](#5-catálogos-e-glossário)
6. [Roadmap de Evolução](#6-roadmap-de-evolução)

---

# 1. Visão de Produto e Filosofia

## 1.1 O Buildly como Sistema Operacional de Empreendimentos

**Premissa Fundamental:**
O Buildly não é um ERP. É um **Sistema Operacional** que funciona como o "cérebro digital" de empreendimentos de infraestrutura pesada (construção, obras hídricas, energia, mobilidade).

**Analogia:**
- Windows/macOS = **Sistema Operacional** de computadores
- Buildly = **Sistema Operacional** de obras

### Características do SO Buildly:

1. **Imutabilidade** (como blockchain, mas para compliance)
   - Todo evento é registrado (append-only)
   - Histórico completo para auditoria
   - Versioning temporal (ValidFrom, ValidTo)

2. **Contexto Dinâmico** (como workspaces)
   - Cada obra = um "Workspace" com seu próprio estado
   - Agregação de contexto em tempo real
   - Múltiplas perspectivas de uma mesma obra (financeira, operacional, técnica)

3. **Inteligência Prescritiva** (não apenas descritiva)
   - Não só mostra o que aconteceu
   - Recomenda o que fazer
   - Aprende com cada decisão tomada

---

## 1.2 A Transição de ERP para Inteligência Contextual

### ERP Tradicional (Sap, Oracle):
```
Entrada de Dados → Processamento → Relatório
(Passivo)                          (Reativo)
```

### Buildly (SO Inteligente):
```
Evento → Contexto → Análise → Recomendação → Ação
(Ativo)            (Inteligente)             (Proativo)
```

**Exemplo Prático:**

| Situação | ERP Tradicional | Buildly |
|----------|-----------------|---------|
| **Material chega atrasado** | Nota fiscal registrada. Gerente consulta relatório. | Sistema detecta atraso, analisa cascata (5 atividades bloqueadas), calcula impacto financeiro (R$ 150k), recomenda rescheduling automático |
| **Equipamento quebra** | Ticket aberto manualmente. Mecânico chamado. | Sistema registra falha, verifica histórico (3ª vez em 6 meses), recomenda manutenção preventiva, aloca equipamento backup, reclassifica risco |
| **Contratado não comparece** | RH registra falta. Folha de pagamento ajustada. | Sistema calcula impacto na produção, identifica atividades críticas afetadas, propõe realocação de recursos, registra precedente para scoring do fornecedor |

---

## 1.3 Princípios Inegociáveis

### 🔒 Imutabilidade
- **Regra:** Nenhum registro pode ser deletado ou alterado após criação
- **Implementação:** Event Sourcing (PostgreSQL append-only)
- **Compliance:** Lei 8.666 (Licitações), Lei Geral de Proteção de Dados

### 🎯 Contexto
- **Regra:** Todo evento deve incluir seu contexto completo (obra_id, contrato_id, stakeholders)
- **Implementação:** IEvent com context_metadata obrigatório
- **Benefício:** IA consegue fazer correlações + Auditoria fica clara

### 🤖 Proatividade
- **Regra:** Sistema recomenda antes de ser perguntado
- **Implementação:** Decision Store + Regras de Negócio + Machine Learning
- **Exemplo:** "Estimativa de término: 2026-08-15 (+5 dias) com 95% de confiança"

---

# 2. Domínios de Inteligência (Buildly Intelligence Layer)

## 2.1 Buildly Brain: Grafo de Relacionamentos (Neo4j)

**O que é:**
Uma representação gráfica de TUDO que acontece na obra e como se relaciona.

**Nodos do Grafo:**

```cypher
// Entidades
:Obra { id, nome, localizacao, data_inicio, data_fim_prevista }
:Contrato { id, valor, periodo, cláusulas_penalidade }
:Atividade { id, nome, data_inicio, data_fim, responsavel }
:Recurso { id, tipo, quantidade, custo_diario }
:Equipamento { id, modelo, valor_hora, manutencao_proxima }
:Pessoa { id, nome, especialidade, performance_score }

// Eventos (o que acontece)
:Evento { id, tipo, timestamp, origem, impacto }

// Decisões tomadas
:Decisao { id, timestamp, decisor, contexto, resultado_esperado, resultado_real }

// Agentes IA
:AgenteIA { id, nome, especialidade, confiabilidade }
```

**Relacionamentos Críticos:**

```cypher
(Evento)-[:AFETA]->(Atividade)        // Um atraso de material afeta a concretagem
(Atividade)-[:DEPENDE_DE]->(Recurso) // Concretagem depende de cimento
(Recurso)-[:POSSUI]->(Equipamento)   // Cimento vem do equipamento de moagem
(Evento)-[:CAUSADO_POR]->(Evento)    // Atraso de entrega causado por greve
(Decisao)-[:RESOLVE]->(Evento)       // Decisão de relocar equipe resolveu bottleneck
(AgenteIA)-[:ANALISOU]->(Evento)     // IA analisou e recomendou ação
```

**Query Exemplo: "Qual é o caminho crítico de impacto do atraso de cimento?"**

```cypher
MATCH path = (evt:Evento {tipo: 'MATERIAL_DELAY'})-[*]->(bloqueador:Evento)
WHERE evt.obra_id = $obra_id
RETURN path, length(path) as impacto_cascata
ORDER BY impacto_cascata DESC
LIMIT 1
```

---

## 2.2 Buildly Memory & Decisions: O Decision Store

**O que é:**
Um registro de todas as decisões tomadas, seu contexto, previsão vs. realidade, e aprendizado.

### Estrutura de Decisão:

```typescript
interface IDecision {
  // Identificação
  id: UUID;
  timestamp: ISO8601;
  
  // Contexto
  evento_id: UUID;                    // Qual evento disparou?
  contexto_workspace: {
    obra_id: UUID;
    stakeholders: string[];
    prioridade_negocio: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
  };
  
  // A Decisão
  opcoes_avaliadas: {
    opcao_id: string;
    descricao: string;
    custo_estimado: number;
    impacto_prazo: number;    // dias
    risco: 'ALTO' | 'MEDIO' | 'BAIXO';
  }[];
  
  opcao_escolhida: string;
  decisor: 'HUMANO' | 'IA' | 'HIBRIDO';
  
  // Previsão vs. Realidade
  resultado_esperado: {
    economia: number;
    ganho_prazo: number;
    satisfacao_esperada: 0.0 | 1.0;
  };
  
  resultado_real?: {
    economia: number;
    ganho_prazo: number;
    satisfacao_real: 0.0 | 1.0;
    lições_aprendidas: string;
  };
  
  // Aprendizado
  feedback_score: number;     // -1.0 (péssima) até +1.0 (ótima)
}
```

**Exemplo:**

```json
{
  "id": "dec_2026_07_19_001",
  "timestamp": "2026-07-19T14:30:00Z",
  "evento_id": "evt_material_delay_123",
  "contexto_workspace": {
    "obra_id": "obr_suzano_2026",
    "stakeholders": ["engenheiro_chefe", "fornecedor", "financeiro"],
    "prioridade_negocio": "CRITICA"
  },
  "opcoes_avaliadas": [
    {
      "opcao_id": "opt_1",
      "descricao": "Esperar material (15 dias)",
      "custo_estimado": 150000,
      "impacto_prazo": 15,
      "risco": "ALTO"
    },
    {
      "opcao_id": "opt_2",
      "descricao": "Importar de outro fornecedor (+50% custo)",
      "custo_estimado": 225000,
      "impacto_prazo": 3,
      "risco": "MEDIO"
    },
    {
      "opcao_id": "opt_3",
      "descricao": "Pausar atividade B, reordenar sequência",
      "custo_estimado": 50000,
      "impacto_prazo": 7,
      "risco": "BAIXO"
    }
  ],
  "opcao_escolhida": "opt_3",
  "decisor": "HIBRIDO",  // Engenheiro + IA sugeriu opt_3
  "resultado_esperado": {
    "economia": 100000,
    "ganho_prazo": 8,
    "satisfacao_esperada": 0.85
  },
  "resultado_real": {
    "economia": 105000,
    "ganho_prazo": 9,
    "satisfacao_real": 0.92,
    "lições_aprendidas": "Reordenação foi mais eficiente que o modelo previu. Cliente beneficiado com entrega antecipada."
  },
  "feedback_score": 0.95
}
```

**Uso da Decision Store:**

1. **Treinamento de IA:** Cada decisão com feedback é um sample de treinamento
2. **Previsibilidade:** "Esse tipo de cenário teve sucesso 92% das vezes"
3. **Aprendizado Corporativo:** "Decisões similares em obras diferentes — quais as melhores práticas?"

---

## 2.3 Buildly Digital Twin: Comparador de Estados

**O que é:**
Uma simulação paralela da obra que compara:
- **Estado Real** (o que está acontecendo agora)
- **Estado Planejado** (o cronograma original)
- **Estado Previsto** (o modelo preditivo)

### Exemplo Visual:

```
PLANEJADO:    ████████████████░░░░░░  80% (on schedule)
REAL:         ███████░░░░░░░░░░░░░░░  35% (atrasado)
PREVISTO:     ███████░░░░░░░░░░░░░░░  35% → 45% em 15 dias

DESVIO:       -45% do planejado | Confiança: 87%
RECOMENDAÇÃO: Alocar 30% mais mão de obra em atividades críticas
```

### Cálculo do Digital Twin:

```typescript
interface IDigitalTwin {
  obra_id: UUID;
  timestamp: ISO8601;
  
  estado_planejado: {
    percentual_completo: number;
    data_fim_prevista: ISO8601;
    custo_orçado: number;
  };
  
  estado_real: {
    percentual_completo: number;
    atividades_concluidas: UUID[];
    eventos_críticos: IEvent[];
    custo_acumulado: number;
  };
  
  estado_previsto: {
    percentual_completo_60_dias: number;
    data_fim_estimada: ISO8601;
    custo_final_estimado: number;
    confiança: 0.0 | 1.0;
    drivers: string[];  // "Falta de mão de obra", "Atrasos de material", etc
  };
  
  desvios: {
    prazo_dias: number;
    custo_variance: number;
    risco_level: 'VERDE' | 'AMARELO' | 'VERMELHO';
  };
  
  recomendacoes: IRecomendacao[];
}
```

---

## 2.4 Buildly Maturity Index (BMI): Cálculo Multidomínio

**O que é:**
Um score (0-100) que mede a maturidade operacional de uma obra em 8 dimensões.

### Dimensões:

```typescript
interface IBuildlyMaturityIndex {
  obra_id: UUID;
  timestamp: ISO8601;
  
  dimensoes: {
    governanca: {
      score: 75,  // Processos definidos e seguidos
      drivers: ['RUPs claras', 'Reuniões pontuais', 'Escalações rápidas']
    },
    planejamento: {
      score: 62,  // Cronograma realista
      drivers: ['90% das datas cumpridas', 'Margem de segurança adequada']
    },
    execucao: {
      score: 81,  // Atividades no prazo
      drivers: ['Equipes alocadas corretamente', 'Equipamentos disponíveis']
    },
    recursos: {
      score: 58,  // Recursos sempre disponíveis
      drivers: ['Falta de mão de obra especializada', 'Quebras de equipamento']
    },
    financeiro: {
      score: 88,  // Orçamento controlado
      drivers: ['Variância < 5%', 'Pagamentos em dia']
    },
    risco: {
      score: 72,  // Riscos mapeados e mitigados
      drivers: ['Segurança acima da média', 'Seguros vigentes']
    },
    sustentabilidade: {
      score: 45,  // Práticas ESG
      drivers: ['Gestão de resíduos', 'Segurança do trabalho', 'Impacto ambiental']
    },
    stakeholder_satisfaction: {
      score: 91,  // Satisfação de clientes
      drivers: ['NPS = 8.5', 'Zero reclamações críticas']
    }
  };
  
  score_geral: 73;  // Média ponderada
  trending: 'SUBINDO' | 'ESTÁVEL' | 'DESCENDO';
}
```

**Benchmarking:**
```
BMI < 50  = 🔴 CRÍTICO (Intervenção necessária)
BMI 50-70 = 🟡 ATENÇÃO (Plano de melhoria)
BMI 70-85 = 🟢 BOM (Operacional)
BMI > 85  = 🟣 EXCELENTE (Best-in-class)
```

---

# 3. Modelo de Dados e Entidades Fundamentais

## 3.1 O Evento: O Átomo do Sistema

**Definição:** Um Evento é a unidade mínima de mudança no estado de uma obra.

### IEvent Schema (Padrão Universal):

```typescript
interface IEvent {
  // Identificação
  id: UUID;
  type: EventType;  // enum: MATERIAL_DELAY, ACTIVITY_COMPLETED, RESOURCE_ALLOCATED, etc
  version: number;
  
  // Temporal
  timestamp: ISO8601;
  source_timestamp?: ISO8601;  // Quando aconteceu realmente (vs. quando foi registrado)
  
  // Origem
  origin: {
    module: 'governance' | 'engineering' | 'planning' | 'execution' | 'resources' | 'financial';
    user_id: UUID;
    source: 'api' | 'mobile' | 'webhook' | 'sensor' | 'ai_inference';
  };
  
  // Contexto Obrigatório
  context: {
    obra_id: UUID;
    contrato_id?: UUID;
    atividade_id?: UUID;
    recurso_id?: UUID;
    prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
  };
  
  // Dados Específicos
  data: Record<string, any>;
  
  // Relacionamentos
  relationships?: {
    parent_event_id?: UUID;     // Evento que causou este
    related_events?: UUID[];
    cascade_triggers?: EventType[];  // Eventos que podem ser disparados
  };
  
  // Auditoria
  audit: {
    created_at: ISO8601;
    created_by: UUID;
    valid_from: ISO8601;
    valid_to?: ISO8601;
  };
}
```

**Catálogo de Eventos (Primeiros 20):**

```
1. MATERIAL_DELAY        → Material não chegou no prazo
2. ACTIVITY_BLOCKED      → Atividade parada por dependência
3. RESOURCE_UNAVAILABLE  → Recurso (mão de obra, equipamento) indisponível
4. FINANCIAL_VARIANCE    → Custo real diferente do orçado
5. SAFETY_INCIDENT       → Incidente de segurança
6. QUALITY_ISSUE         → Problema de qualidade identificado
7. ENVIRONMENTAL_IMPACT  → Impacto ambiental não planejado
8. DECISION_MADE         → Decisão de gestão registrada
9. FORECAST_UPDATED      → Modelo preditivo atualizado
10. STAKEHOLDER_ALERT    → Alerta para stakeholder
... (será expandido conforme o desenvolvimento)
```

---

## 3.2 O Objetivo: A Unidade de Medida de Progresso

**Definição:** Um Objetivo é uma meta mensurável que a obra persegue.

```typescript
interface IObjective {
  id: UUID;
  obra_id: UUID;
  
  // Descrição
  nome: string;           // "Concretar Bloco A até 15 de agosto"
  descricao: string;
  dominio: 'planejamento' | 'execucao' | 'financeiro' | 'risco' | 'sustentabilidade';
  
  // Métricas
  metrica_principal: {
    nome: string;         // "% de conclusão"
    valor_alvo: number;
    valor_atual: number;
    unidade: string;
  };
  
  // Temporal
  data_inicio: ISO8601;
  data_alvo: ISO8601;
  data_conclusao?: ISO8601;
  
  // Rastreamento
  status: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ATRASADO' | 'CANCELADO';
  progresso_percentual: number;
  
  // Relacionamentos
  atividades_relacionadas: UUID[];
  eventos_relacionados: UUID[];
  decisoes_relacionadas: UUID[];
  
  // Score de Maturidade
  contribuicao_ao_bmi: {
    dimensao: string;
    peso: number;
    score_atual: number;
  };
}
```

**Exemplo:**

```json
{
  "id": "obj_2026_Q3_001",
  "obra_id": "obr_suzano",
  "nome": "Concluir Bloco A com Qualidade Excelente",
  "dominio": "execucao",
  "metrica_principal": {
    "nome": "% de conclusão",
    "valor_alvo": 100,
    "valor_atual": 65,
    "unidade": "%"
  },
  "data_alvo": "2026-08-31",
  "status": "EM_EXECUCAO",
  "progresso_percentual": 65,
  "contribuicao_ao_bmi": {
    "dimensao": "execucao",
    "peso": 0.35,
    "score_atual": 81
  }
}
```

---

## 3.3 O Contexto: Agrupamento Dinâmico para Workspaces

**Definição:** Contexto é o "estado mental" do sistema em um momento específico.

```typescript
interface IContext {
  id: UUID;
  obra_id: UUID;
  timestamp: ISO8601;
  
  // Visão Geral
  status_geral: 'VERDE' | 'AMARELO' | 'VERMELHO';
  
  // Indicadores Críticos
  indicadores: {
    bmi_score: number;
    dias_atraso: number;
    custo_variance_percent: number;
    eventos_criticos_nao_resolvidos: number;
    satisfacao_stakeholder: 0.0 | 1.0;
  };
  
  // Top Issues
  top_risks: {
    descricao: string;
    impacto_potencial: string;
    acao_recomendada: string;
    urgencia: 'CRITICA' | 'ALTA' | 'MEDIA';
  }[];
  
  // Recomendações
  recomendacoes_proativas: IRecomendacao[];
}
```

---

## 3.4 A Decisão: Estrutura de Registro

*[Ver seção 2.2 — Decision Store]*

---

# 4. Arquitetura Técnica e Infraestrutura

## 4.1 Monorepo (DDD) e Microserviços

**Estrutura:**

```
/buildly-premium
├── /apps
│   ├── /core-api          [NestJS]
│   ├── /ia-engine         [Python FastAPI]
│   ├── /worker-events     [Node.js Workers]
│   └── /dashboard         [React + TypeScript]
├── /libs
│   ├── /common-types      [Interfaces compartilhadas]
│   ├── /infrastructure    [DB, Bus, Auth]
│   └── /domain-logic      [Lógica de negócio por módulo]
```

---

## 4.2 Event Bus (NATS/Kafka) e CQRS

**Pattern:**
- **Command Side (Write):** Event Store (PostgreSQL)
- **Query Side (Read):** Neo4j + Cache (Redis)
- **Bus:** NATS (simplicidade) ou Kafka (production-grade)

---

## 4.3 Persistência Híbrida

- **PostgreSQL:** Estado transacional, Event Store
- **Neo4j:** Grafo de relacionamentos, pathfinding
- **Qdrant:** Vector DB para RAG (IA)
- **Redis:** Cache de leitura quente

---

## 4.4 Cache e Processamento Assíncrono

- **Worker Pool:** NATS Jetstream ou Bull.js
- **Cache Strategy:** Write-through + TTL
- **Async Jobs:** Sync PostgreSQL → Neo4j, IA analysis

---

# 5. Catálogos e Glossário

## 5.1 Catálogo de Eventos

[Em desenvolvimento]

## 5.2 Catálogo de Objetivos

[Em desenvolvimento]

## 5.3 Glossário Corporativo

- **Obra:** Projeto de construção/infraestrutura
- **Contrato:** Acordo legal de execução
- **Atividade:** Tarefa operacional (concretagem, escavação, etc)
- **Recurso:** Mão de obra, material, equipamento
- **Evento:** Mudança de estado registrada
- **Decisão:** Escolha com rationale documentada
- **BMI:** Buildly Maturity Index (score 0-100)

---

# 6. Roadmap de Evolução

## Fase 1 (4 semanas): MVP Core
- [ ] Event Store (PostgreSQL)
- [ ] IEvent + IObjective + IDecision interfaces
- [ ] Core API (CRUD)
- [ ] NATS Bus
- [ ] Basic Dashboard

## Fase 2 (6 semanas): Intelligence Layer
- [ ] Neo4j Integration
- [ ] Digital Twin
- [ ] Decision Store
- [ ] BMI Calculation
- [ ] Pathfinding

## Fase 3 (8 semanas): IA & Automation
- [ ] RAG (Qdrant)
- [ ] Recommendation Engine
- [ ] Predictive Analytics
- [ ] Automated Decision Making

## Fase 4 (Ongoing): Enterprise & Scale
- [ ] Multi-tenancy
- [ ] Advanced Security
- [ ] Integrations (SAP, Oracle, etc)
- [ ] Mobile App
- [ ] Marketplace

---

**Última Atualização:** 2026-07-19  
**Responsável:** Claude (Arquiteto de Plataforma)  
**Próxima Revisão:** Após Fase 1
