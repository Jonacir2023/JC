---
titulo: "Buildly — Graph Intelligence (Neo4j)"
tipo: "Nota Técnica"
tags: [buildly, neo4j, graph, pathfinding, relacionamentos]
criado_em: "2026-07-19"
---

# 🧠 Buildly — Graph Intelligence (Neo4j)

## O Problema

Quando um evento acontece (ex: material atrasado), seus impactos cascateiam pela obra:
- Ameaça um objetivo (Bloco A no prazo)
- Afeta atividades dependentes (assentar blocos)
- Impacta recursos (equipe ociosa)
- Força uma decisão (reordenar)
- Que afeta outro objetivo (Bloco B em sequência)
- Que impacta outro recurso...

**Como rastrear tudo isso?** Banco de dados relacional não consegue. **Precisamos de um Grafo.**

---

## Solução: Neo4j

Neo4j é um banco de dados de grafos que armazena:
- **Nós:** Eventos, Objetivos, Decisões, Colaboradores, Atividades
- **Relacionamentos:** AMEACA, AFETA, MITIGADA_POR, CAUSADA_POR
- **Propriedades:** Scores, timestamps, contextos

### Vantagem #1: Queries Rápidas de Relacionamento

```cypher
// "Mostre-me todos os impactos cascata de um evento"
MATCH (evento:EVENTO {id: 'evt_material_delay'})
-[rel:AMEACA|AFETA|CAUSADA_POR*1..5]->(impactados)
RETURN evento, rel, impactados
```

**Banco relacional:** JOIN em 5+ tabelas = LENTO  
**Neo4j:** Caminha pelo grafo = RÁPIDO

### Vantagem #2: Pathfinding Automático

```cypher
// "Qual é o caminho causal mais curto entre evento e objetivo ameaçado?"
MATCH caminho = shortestPath(
  (evento:EVENTO {id: 'evt_material_delay'})
  -[*1..10]->(objetivo:OBJETIVO {id: 'obj_bloco_a'})
)
RETURN caminho, length(caminho) AS profundidade
```

**Resultado:**
```
EVENTO (Material Delay)
    ↓ [AMEACA]
OBJETIVO (Bloco A)
    ↓ [MITIGADA_POR]
DECISAO (Reordenar)
    ↓ [AFETA_DIMENSAO]
BMI (Execução)

Profundidade: 3 graus de separação
Relevância: 0.87
```

### Vantagem #3: Detecção de Cascatas

```cypher
// "Mostre-me como este evento propagou pelos próximos 30 dias"
MATCH cascata = (evento:EVENTO {id: 'evt_material_delay'})
-[*1..]->(nodos)
WHERE evento.timestamp > datetime.now() - duration('P30D')
RETURN count(nodos) AS impactos_totais,
       collect(distinct nodos.tipo) AS tipos_afetados,
       max(length(cascata)) AS profundidade_maxima
```

**Resultado:**
```
Impactos totais: 12 nós atingidos
Tipos afetados: [OBJETIVO, ATIVIDADE, RECURSO, BMI]
Profundidade máxima: 5 graus
```

---

## Estrutura do Grafo: Cenário Material Delay

```
┌─────────────────────────────────────────────────────────┐
│                  NEO4J GRAFO MATERIALIZADO              │
└─────────────────────────────────────────────────────────┘

        ┌─────────────────────────────┐
        │  EVENTO: Material Delay     │
        │  ├─ tipo: MATERIAL_DELAY    │
        │  ├─ timestamp: 2026-07-19   │
        │  ├─ atraso_dias: 15         │
        │  └─ score_relevancia: 1.0   │
        └──────────┬──────────────────┘
                   │
        ┌──────────┴──────────────────────────┐
        │ [AMEACA]                [AFETA]     │
        ↓                                     ↓
    ┌─────────────┐                  ┌──────────────────┐
    │  OBJETIVO:  │                  │    ATIVIDADE:    │
    │  Bloco A    │                  │  Assentar Blocos │
    │  status:    │                  │  status: PARADA  │
    │  EM_RISCO   │                  │  impacto: +15d   │
    └─────┬───────┘                  └──────────────────┘
          │
          │ [MITIGADA_POR]
          ↓
    ┌──────────────────┐
    │    DECISAO:      │
    │  Reordenar       │
    │  feedback: +0.95 │
    │  decisor: Eng.   │
    └────────┬─────────┘
             │
    ┌────────┴──────────┐
    │ [AFETA_DIMENSAO]  │ [PARTICIPA]
    ↓                   ↓
┌─────────────┐    ┌──────────────┐
│  BMI:       │    │ COLABORADOR: │
│ Execução    │    │ Eng. Chefe   │
│ +5%         │    │ score: 0.92  │
└─────────────┘    └──────────────┘
```

### Nós Criados
1. **Evento** (id: evt_material_delay) — O material que atrasou
2. **Objetivo** (id: obj_bloco_a) — Concluir Bloco A (foi ameaçado)
3. **Atividade** (id: atv_assentar_blocos) — Assentar blocos (foi afetada)
4. **Decisão** (id: dec_reordenar) — Reordenação (mitigou o objetivo)
5. **BMI** (id: bmi_20260719) — Índice de maturidade (foi impactado)
6. **Colaborador** (id: usr_eng_chefe) — Engenheiro responsável (participou)

### Relacionamentos
- `EVENTO -[AMEACA]-> OBJETIVO`
- `EVENTO -[AFETA]-> ATIVIDADE`
- `OBJETIVO -[MITIGADA_POR]-> DECISAO`
- `DECISAO -[AFETA_DIMENSAO]-> BMI`
- `DECISAO -[PARTICIPA]-> COLABORADOR`
- `COLABORADOR -[RESPONSAVEL]-> OBJETIVO`

---

## Casos de Uso do Grafo

### 1️⃣ Identificar Todos os Impactos

**Pergunta:** "Se este evento ocorrer, quem vai ser afetado?"

```cypher
MATCH (evento:EVENTO {id: 'evt_material_delay'})
-[*1..5]->(afetados)
RETURN afetados.tipo AS tipo,
       count(*) AS quantidade,
       collect(distinct afetados.id) AS ids
GROUP BY tipo
ORDER BY quantidade DESC
```

**Resultado:**
```
OBJETIVO: 3 objetivos ameaçados
ATIVIDADE: 8 atividades afetadas
RECURSO: 2 recursos impactados
```

### 2️⃣ Encontrar Causalidade

**Pergunta:** "Como chegamos neste problema?"

```cypher
MATCH caminho = (raiz:EVENTO)
-[rel:CAUSADA_POR|RELACIONADA_A*1..]->(evento:EVENTO {id: 'evt_material_delay'})
RETURN [n IN nodes(caminho) | n.id] AS cadeia_causal
```

**Resultado:**
```
Cadeia Causal:
1. Greve de transportadores (raiz)
   ↓ [CAUSADA_POR]
2. Atraso de material (material delay)
   ↓ [AFETA]
3. Bloco A ameaçado
```

### 3️⃣ Recomendar Decisões

**Pergunta:** "Quais decisões funcionaram bem em cenários similares?"

```cypher
MATCH (evento_similar:EVENTO)
-[*1..3]-(decisao_anterior:DECISAO)
WHERE evento_similar.tipo = 'MATERIAL_DELAY'
  AND decisao_anterior.feedback_score > 0.8
RETURN decisao_anterior.opcao_escolhida AS recomendacao,
       decisao_anterior.feedback_score AS confianca,
       count(*) AS frequencia
ORDER BY confianca DESC, frequencia DESC
```

**Resultado:**
```
Recomendação: REORDENAR
Confiança: 0.95
Frequência: 12 vezes com sucesso
```

### 4️⃣ Detectar Padrões de Risco

**Pergunta:** "Há uma cascata de eventos que indica risco?"

```cypher
MATCH (evento1:EVENTO)-[*1..2]->(evento2:EVENTO)
WHERE evento1.timestamp < evento2.timestamp
  AND duration.between(evento1.timestamp, evento2.timestamp).days < 7
RETURN evento1.tipo AS evento_inicial,
       evento2.tipo AS evento_secundario,
       count(*) AS ocorrencias_padrao
```

**Resultado:**
```
Padrão encontrado:
MATERIAL_DELAY → ACTIVITY_BLOCKED → (17% de chance)
Risco: MÉDIO
Recomendação: Implementar buffers maiores
```

---

## Sync: Event Store → Neo4j

O fluxo é:

```
┌────────────────────┐
│  1. EVENTO CRIADO  │
│  (Phase 1)         │
└────────┬───────────┘
         │
         ↓
┌────────────────────────────────┐
│  2. PERSISTIDO NO EVENT STORE  │
│  (PostgreSQL, append-only)     │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│  3. SYNC WORKER (Bull.js)      │
│  - Lê novo evento              │
│  - Cria GraphNode              │
│  - Relaciona com contexto      │
│  - Publica para Neo4j          │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│  4. NEO4J GRAFO ATUALIZADO     │
│  - Nó do evento criado         │
│  - Relacionamentos estabelecidos
│  - Queries já funcionando      │
└────────────────────────────────┘
```

---

## Métricas do Grafo

### Densidade
```
Número de nós: 50
Número de relacionamentos: 120
Densidade: 120 / (50 × 49) = 4.9%
Interpretação: ESPARSO (normal para construção)
```

### Diâmetro
```
Maior caminho mais curto: 7 graus
Interpretação: Máximo 7 passos entre qualquer nó
```

### Centralidade (Betweenness)
```
Qual nó é "ponte" entre mais pares?
1. Objetivo (Bloco A): 0.42 — CRÍTICO
2. Decisão (Reordenar): 0.38 — IMPORTANTE
3. Evento (Material): 0.35 — IMPORTANTE

Interpretação: Bloco A é o ponto central desta obra
```

---

## Visualização

```
Neo4j Browser (http://localhost:7474):

   Evento (red)
      ↓
   Objetivo (blue)
      ↓
   Decisão (green)
      ↓
   BMI (yellow)

Cada nó é clicável → mostra todas as propriedades
Cada aresta mostra o tipo de relacionamento
Cores indicam tipo de nó, tamanho indica importância
```

---

## Próximas Passos

1. **Event Sync Worker** — Bull.js sincroniza eventos para Neo4j
2. **Pathfinding Automático** — Detectar cascatas em tempo real
3. **ML Treinado com Grafo** — Usar padrões para recomendar decisões
4. **Dashboard Interativo** — Visualizar grafo e impactos em tempo real

---

**Status:** Interfaces definidas, implementação em andamento

**Data:** 2026-07-19
