# Integração Phase 3.2 → Phase 3.3: Do Armazenamento à Busca

**Visão Geral:** Como o Brain evolved de um storage de lições para um sistema de Q&A inteligente.

---

## 📊 Fluxo de Dados Completo

```
                    PHASE 3.2                          PHASE 3.3
                  (Fundação)                      (Busca Inteligente)

RDO Diário                                       
  ↓
[PostgreSQL]
diario_obras
  ├─ id, obra_id
  ├─ atividades, materiais
  ├─ ocorrencias, observacoes
  └─ brain_processado (false → true)
  
  ↓ (N8N 02:00 UTC)
  
[Claude API]
brain_extraction_pipeline.py
  ├─ Extract RDO → JSON estruturado
  ├─ Validação de campos
  └─ Confidence scoring
  
  ↓ (armazenar)
  
[Neo4j] Brain Graph
  ├─ :Brain node (per obra)
  │  └─ statistics updated
  │
  ├─ :Lesson node (novo)
  │  ├─ rdo_id, tipo_evento, resultado
  │  ├─ resumo, decisoes, causas, solucoes
  │  ├─ impacto_economia, impacto_prazo
  │  ├─ confiabilidade (0-1)
  │  └─ criado_em
  │
  ├─ :EventType (linked)
  ├─ :Causa (linked)
  ├─ :Solucao (linked)
  └─ :Period (linked)
  
  ↓ (+ [PostgreSQL] audit trail)
  brain_extraction_audit
    ├─ extraction_timestamp
    ├─ status (success|error)
    └─ claude_tokens_used
  
  ↓ (+ [PostgreSQL] views)
  v_brain_stats (real-time)
  v_top_lessons
  v_recurring_risks
  
[PHASE 3.2 COMPLETO] ← 100+ lições armazenadas, auditadas, versionadas

================================================================================

                          [AQUI INICIA 3.3]

================================================================================

[Qdrant] Vector Database       ← [Trigger: nova lição] 
  ├─ brain_embeddings.py
  │  └─ Text → Claude embeddings-3-small (1536-dim)
  │
  ├─ Collections (per obra)
  │  ├─ lesson_id
  │  ├─ embedding vector
  │  └─ metadata (tipo_evento, confiabilidade, data, etc)
  │
  └─ Indexes por
     ├─ cosine similarity (search)
     ├─ tipo_evento (filter)
     └─ confiabilidade (rerank)


         ↓ [Engenheiro faz pergunta]
    "Quando tivemos atraso por chuva?"
         ↓


[API Endpoint] POST /brain/search
  ├─ brain_query_translator.py
  │  └─ Claude entity extraction
  │     (query → tipo_evento, tags, filtros)
  │
  ├─ brain_semantic_search.py
  │  ├─ Embed query (1536-dim)
  │  ├─ Qdrant similarity search
  │  ├─ Rerank por:
  │  │  ├─ confiabilidade (confidence boost)
  │  │  ├─ recency (decay over 6 months)
  │  │  └─ tipo_evento match
  │  └─ Retorna top-5 with scores
  │
  ├─ Neo4j fetch full context
  │  └─ For each match:
  │     ├─ Full :Lesson properties
  │     ├─ Related :Solucao (success %)
  │     ├─ Related :Causa (root cause)
  │     └─ :Period (seasonal context)
  │
  ├─ brain_response_generator.py
  │  └─ Claude format results → conversational response
  │
  ├─ brain_cache_service.ts
  │  └─ Redis cache (24h TTL)
  │
  └─ brain_search_feedback.ts
     └─ Log query + results to PostgreSQL


[RESPONSE] JSON
{
  "query": "Quando tivemos atraso por chuva?",
  "total_results": 8,
  "search_time_ms": 234,
  "cache_hit": false,
  "results": [
    {
      "rank": 1,
      "similarity_score": 0.92,
      "lesson": {
        "rdo_id": "RDO-20260814-001",
        "data": "2026-08-14",
        "tipo_evento": "ATRASO_MATERIAL",
        "resultado": "sucesso",
        "confiabilidade": 0.87,
        "resumo": "Cimento chegou 15 dias atrasado...",
        "solucoes": ["reordenacao_tarefas", "equipe_extra"],
        "impacto_economia": 150000,
        "impacto_prazo_dias": 8
      },
      "reasons_matched": ["tipo_evento", "tags: chuva", "sucesso outcome"]
    },
    ...
  ],
  "summary": "8 casos similares encontrados. Padrão: reordenação funciona em 85% dos casos...",
  "recommendations": "Em atrasos futuros por chuva..."
}

[PHASE 3.3 COMPLETO] ← Brain conversacional, busca rápida, respostas contextuais

================================================================================

[PostgreSQL Tracking]
brain_search_queries
  ├─ query_text: "Quando tivemos atraso por chuva?"
  ├─ tipo_evento extracted: "ATRASO_MATERIAL"
  ├─ executed_at: 2026-10-15 14:23:45
  ├─ result_count: 8
  └─ response_time_ms: 234

brain_search_feedback
  ├─ search_id: FK
  ├─ result_rank: 1, 2, 3, ...
  └─ feedback: thumbs_up | thumbs_down | not_relevant
     (usuário clica depois de ler)
```

---

## 🔄 Ciclo Contínuo: Aprendizado do Brain

```
1. RDO criado (Dia X)
   └─ Engenheiro escreve ocorrências: "Chuva forte, atraso de material"

2. Pipeline extrai (02:00 UTC, Dia X+1)
   └─ Lição armazenada em Neo4j com confiabilidade 0.82

3. Embeddings criados (02:30 UTC, Dia X+1)
   └─ Qdrant pronto para buscas semânticas

4. Próxima chuva (Dia Y, semanas depois)
   └─ Engenheiro faz pergunta: "Já tivemos atraso por chuva antes?"

5. Busca encontra (< 500ms)
   └─ 8 casos similares do histórico

6. Engenheiro aplica solução do histórico
   └─ Economia: 2-6h de análise, decisão mais rápida

7. Resultado registrado em novo RDO (Dia Y+1)
   └─ Feedback implícito: "essa solução funcionou"

8. Próxima iteração (Dia Y+n)
   └─ Brain agora sabe: solução X funciona em 85% dos casos de chuva


[NETWORK EFFECT]
Quanto mais RDOs → mais lições → mais embeddings → buscas mais precisas
                 → usuários usam mais → mais feedback → scores melhores
```

---

## 🔌 Integração Técnica: Pontos de Conexão

### 1. Trigger: Nova Lição → Embeddings

**Em Phase 3.2 `brain_extraction_pipeline.py`:**
```python
def _store_lesson_in_brain(self, lesson: BrainLesson):
    # ... armazenar em Neo4j ...
    
    # NEW: Trigger Phase 3.3 embedding
    self._queue_embedding_job(lesson)  # Adiciona à fila
    
    # Ficar não-bloqueante (async)
```

**Em Phase 3.3 `brain_embeddings.py`:**
```python
def embedding_worker():
    while True:
        lesson = self.job_queue.get()  # Pega lição da fila
        embedding = self.embed_lesson(lesson)
        self.store_in_qdrant(lesson, embedding)
        self.mark_as_embedded(lesson.id)
```

### 2. Neo4j + Qdrant Sync

**Consistência:**
- Neo4j é SOURCE OF TRUTH (estrutura completa)
- Qdrant é INDEX (apenas para busca rápida)
- Se Qdrant fica out-of-sync: regenera embeddings

**Validação:**
```cypher
// Phase 3.3 query
MATCH (l:Lesson) 
WHERE NOT l.embedding_created_at 
RETURN COUNT(l) AS missing_embeddings;
// Se > 0, trigger re-indexing

MATCH (l:Lesson)
WHERE l.embedding_created_at < NOW() - INTERVAL P30D
RETURN COUNT(l) AS stale_embeddings;
// Se > 0, refresh embeddings (confiabilidade pode mudar)
```

### 3. PostgreSQL Views: Phase 3.2 + 3.3

**Phase 3.2 cria:**
```sql
v_brain_stats           -- extraction volume + success rate
v_top_lessons           -- highest confidence
v_recurring_risks       -- pattern frequency
```

**Phase 3.3 adiciona views:**
```sql
v_search_performance    -- query latency, cache hit rate
v_search_popularity     -- queries mais comuns
v_feedback_accuracy     -- % de thumbs_up vs thumbs_down
```

---

## 📈 Métricas Compartilhadas

| Métrica | Alimentada por | Usada por |
|---------|---|---|
| `confiabilidade` (0-1) | Phase 3.2 (Claude) | Phase 3.3 (reranking) |
| `tipo_evento` | Phase 3.2 (extraction) | Phase 3.3 (entity extraction) |
| `tags` | Phase 3.2 (extraction) | Phase 3.3 (similarity) |
| `resultado` (sucesso/falha) | Phase 3.2 (RDO) | Phase 3.3 (filter + recommendations) |
| `criado_em` | Phase 3.2 (audit) | Phase 3.3 (recency ranking) |
| `impacto_economia` | Phase 3.2 (Claude) | Phase 3.3 (ranking by impact) |

---

## 🎯 Dependências de Dados

### Phase 3.3 PRECISA de Phase 3.2:

- [x] Neo4j com 50+ Lessons (buscas significativas)
- [x] Cada Lesson com `confiabilidade` score (reranking)
- [x] Cada Lesson com `tipo_evento` (entity extraction)
- [x] Cada Lesson com `tags[]` (semantic similarity)
- [x] brain_extraction_audit (performance tracking)

### Se Phase 3.2 falhar:
- Phase 3.3 não pode launch (sem dados para buscar)
- Por isso 3.2 é CRITICAL PATH

---

## 🚀 Cronograma de Execução

### Phase 3.2: 13 set - 2 out (3 semanas)
- Week 1: Schema Neo4j + extraction pipeline live
- Week 2: 50+ RDOs carregados, quality validated
- Week 3: Brain integrado com RecommendationEngine v1.5

### Phase 3.3: 3 out - 16 out (2 semanas)
- Week 1: Qdrant + embeddings + semantic search
- Week 2: API endpoints + response generation

### Sobreposição possível:
- Phase 3.2 Week 3: Integração com Recommendation (independente)
- Phase 3.3 Week 1 pode começar quando Phase 3.2 Week 2 termina (50+ lições pronto)

---

## 💾 Storage Requirements

| Sistema | Dado | Capacidade | Phase |
|---------|------|-----------|-------|
| PostgreSQL | brain_extraction_audit | 1,000 RDOs = ~500 KB | 3.2 |
| PostgreSQL | brain_search_queries | 10,000 queries = ~2 MB | 3.3 |
| Neo4j | Lesson nodes + relationships | 100 lições = ~10 MB | 3.2 |
| Qdrant | Embeddings (1536-dim) | 100 lições × 1536 floats = ~600 KB | 3.3 |
| Redis | Query cache (24h) | ~10 MB | 3.3 |
| **Total para 100 RDOs** | — | **~30 MB** | — |

Escalada: 1,000 RDOs = ~300 MB (ainda em 1 máquina)

---

## 🔐 Segurança: Phase 3.2 → 3.3

### Data Leak Risk
- Phase 3.2 armazena dados sensíveis (decisões operacionais)
- Phase 3.3 expõe via search (controlar acesso por obra_id)

**Mitigação:**
```typescript
// Em brain.controller.ts
@UseGuards(JwtAuthGuard)
async search(@Body() dto: SearchQueryDto, @User() user): Promise<...> {
  // Validar que user.obra_ids include dto.obra_id
  if (!user.obra_ids.includes(dto.obra_id)) {
    throw new ForbiddenException('Access denied');
  }
  return this.brainService.semanticSearch(dto);
}
```

### Query Injection Risk
- Phase 3.3 aceita input de usuário (queries em português)
- Claude entity extraction pode ser confundido

**Mitigação:**
```python
# brain_query_translator.py
def parse_query(self, query: str) -> QueryFilters:
    # Limit query length
    if len(query) > 500:
        raise ValueError("Query too long")
    
    # Sanitize special characters
    query = self.sanitize_input(query)
    
    # Claude extraction com prompt injection prevention
    prompt = self._build_safe_prompt(query)
    # ...
```

---

## 📚 Referência Cruzada de Arquivos

### Criados em Phase 3.2
- `migrations/V004__brain_views.sql`
- `scripts/brain_extraction_pipeline.py`
- `schemas/brain_schema.cypher`
- `n8n/workflows/brain_daily_extraction.json`

### Usados em Phase 3.3
- ✅ PostgreSQL (views para monitoramento)
- ✅ Neo4j (Lesson nodes para fetch de contexto)
- ✅ brain_extraction_audit (para performance tracking)

### Criados em Phase 3.3
- `docker/docker-compose.yml` (adicionar Qdrant)
- `scripts/brain_embeddings.py`
- `scripts/brain_semantic_search.py`
- `scripts/brain_query_translator.py`
- `apps/intelligence-layer/src/brain/brain.controller.ts`
- `apps/intelligence-layer/src/brain/brain.service.ts`
- `scripts/brain_response_generator.py`

---

## 🎬 Next: Phase 3.4

Quando Phase 3.3 terminar, Phase 3.4 (Assistente Proativo) usará:
- Brain Search (Phase 3.3) para encontrar lições relevantes
- Proactive Rules para detectar quando aplicar
- Notifications (Slack/UI) para alertar engenheiros

```
RDO criado → Detectar padrão → Buscar Brain → Recomendar solução → Notificar
```

---

**Phase 3.2 + 3.3 = O coração inteligente do Buildly.**

Phase 3.2 armazena conhecimento.  
Phase 3.3 recupera conhecimento.  
Phase 3.4+ utiliza proativamente.
