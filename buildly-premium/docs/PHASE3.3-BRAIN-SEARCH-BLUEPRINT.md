# Phase 3.3: Brain Intelligence — Busca em Linguagem Natural

**Status:** Design & Planning  
**Duração:** 2 semanas (3-16 outubro)  
**Caminho Crítico:** SIM (depende 100% de Phase 3.2)  
**Esforço:** 60-80 horas

---

## 🧠 Resumo Executivo

Transformar o Buildly Brain numa interface conversacional onde engenheiros fazem perguntas em linguagem natural e recebem respostas com contexto histórico.

```
Antes (Phase 3.2):
  Brain armazena 100+ lições extraídas de RDOs
  
Agora (Phase 3.3):
  Engenheiro: "Quando tivemos atraso por chuva?"
  Brain: "8 casos similares encontrados:
    - Ago/2024: Atraso de 15 dias → Solução: reordenação (sucesso 82%)
    - Jul/2024: Atraso de 8 dias → Solução: equipe extra (sucesso 75%)
    - ...com detalhes de cada caso"
```

**End Result:** Um sistema de Q&A que funciona como "Google do conhecimento operacional".

---

## 📋 Deliverables Phase 3.3

### Week 1 (3-9 outubro): Infraestrutura Semântica

#### 1. Vector Database Setup (Qdrant)
**Arquivo:** `docker/docker-compose.yml` (adicionar Qdrant)

```yaml
qdrant:
  image: qdrant/qdrant:latest
  ports:
    - "6333:6333"
  volumes:
    - qdrant_data:/qdrant/storage
  environment:
    QDRANT_API_KEY: ${QDRANT_API_KEY}
```

**O que faz:**
- Armazena embeddings de todas as 100+ lições
- Busca semântica por similaridade (< 100ms)
- Indexação automática por tipo_evento, tags, confiabilidade

#### 2. Embedding Pipeline
**Arquivo:** `scripts/brain_embeddings.py` (250 linhas)

```python
class BrainEmbeddingPipeline:
    """Converte lições em embeddings vetoriais"""
    
    def embed_lesson(self, lesson: BrainLesson) -> np.ndarray:
        """
        Entrada: Lesson com resumo, decisoes, causas, solucoes
        Saída: Embedding 1536-dim (Claude embeddings)
        """
        text = f"{lesson.resumo} {' '.join(lesson.decisoes)} {' '.join(lesson.causas)}"
        embedding = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return np.array(embedding.data[0].embedding)
    
    def store_in_qdrant(self, lesson: BrainLesson, embedding: np.ndarray):
        """Armazena em Qdrant com metadata (tipo_evento, confiabilidade, etc)"""
        pass
    
    def refresh_all_embeddings(self, obra_id: str):
        """Atualiza embeddings de todas as lições da obra"""
        pass
```

**Integração:**
- Executa após cada nova lição ser armazenada em Neo4j
- Re-faz embeddings de lições atualizadas
- Batch refresh diário (baixo uso de API)

#### 3. Semantic Search Engine
**Arquivo:** `scripts/brain_semantic_search.py` (300 linhas)

```python
class BrainSemanticSearch:
    """Busca em linguagem natural contra o Brain"""
    
    def search(self, query: str, obra_id: str, top_k: int = 5) -> List[SearchResult]:
        """
        Entrada: "Quando tivemos atraso por chuva?"
        
        Processo:
          1. Embed a query → 1536-dim vector
          2. Buscar em Qdrant (cosine similarity)
          3. Rerank por confiabilidade + recency
          4. Fetch full lesson context do Neo4j
          5. Gerar resposta com CLI prompt
        
        Saída: List[SearchResult] com top 5 matches ordenados por relevância
        """
        
        # 1. Embed query
        query_embedding = self.embed_text(query)
        
        # 2. Search Qdrant
        qdrant_results = self.qdrant_client.search(
            collection_name=f"brain_{obra_id}",
            query_vector=query_embedding,
            limit=top_k * 2,  # Pega 2x para reranking
            query_filter=None  # Pode adicionar filtros por tipo_evento, data, etc
        )
        
        # 3. Rerank (confidence + recency)
        ranked = self.rerank_results(qdrant_results)
        
        # 4. Fetch full context
        search_results = []
        for match in ranked[:top_k]:
            lesson = self.fetch_lesson_from_neo4j(match.payload['rdo_id'])
            search_results.append(SearchResult(
                lesson=lesson,
                similarity_score=match.score,
                rank=len(search_results) + 1
            ))
        
        return search_results
    
    def rerank_results(self, results) -> List:
        """Rerank por: similarity_score * confidence * recency_factor"""
        scored = []
        for r in results:
            confidence = r.payload.get('confiabilidade', 0.5)
            days_old = (datetime.now() - r.payload['criado_em']).days
            recency = 1.0 / (1.0 + days_old / 180)  # Decay over 6 months
            
            final_score = r.score * confidence * recency
            scored.append((r, final_score))
        
        return sorted(scored, key=lambda x: x[1], reverse=True)
```

#### 4. Query-to-Neo4j Translator
**Arquivo:** `scripts/brain_query_translator.py` (200 linhas)

```python
class QueryTranslator:
    """Converte queries em linguagem natural para filtros estruturados"""
    
    def parse_query(self, query: str) -> QueryFilters:
        """
        "Quando tivemos atraso por chuva?" 
        → {
            tipo_evento: "ATRASO_MATERIAL",
            tags: ["chuva"],
            resultado: ["sucesso"],
            min_confiabilidade: 0.7
        }
        
        Usa Claude para entity extraction com few-shot examples
        """
        prompt = f"""
        Query de usuário: "{query}"
        
        Extraia:
        - tipo_evento (ATRASO_MATERIAL, ATRASO_MÃO_OBRA, QUALIDADE, CUSTO, etc)
        - tags relevantes (chuva, fornecedor, segurança, etc)
        - resultado desejado (sucesso, parcial, falha)
        - confiabilidade mínima (0.0-1.0)
        - período (últimos X dias)
        
        Retorne JSON com filtros estruturados.
        """
        
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return self.parse_filter_response(response.content[0].text)
```

---

### Week 2 (10-16 outubro): API & Resposta Inteligente

#### 5. Brain Query API Endpoints
**Arquivo:** `apps/intelligence-layer/src/brain/brain.controller.ts` (400 linhas)

```typescript
@Controller('brain')
export class BrainController {
  constructor(private brainService: BrainService) {}

  // Endpoint 1: Busca semântica por query
  @Post('search')
  async search(@Body() dto: SearchQueryDto): Promise<SearchResultsDto> {
    /**
     * POST /brain/search
     * Body: { query: "Quando tivemos atraso por chuva?", obra_id: "...", top_k: 5 }
     * Response: {
     *   query: "...",
     *   total_results: 8,
     *   results: [
     *     {
     *       rank: 1,
     *       similarity: 0.92,
     *       lesson: { resumo, tipo_evento, resultado, solucoes, ... },
     *       confidence: 0.82,
     *       excerpt: "..."
     *     }
     *   ],
     *   response_time_ms: 234
     * }
     */
    return this.brainService.semanticSearch(dto);
  }

  // Endpoint 2: Busca estruturada (com filtros)
  @Post('search-advanced')
  async searchAdvanced(@Body() dto: AdvancedSearchDto): Promise<SearchResultsDto> {
    /**
     * POST /brain/search-advanced
     * Body: {
     *   tipo_evento: "ATRASO_MATERIAL",
     *   tags: ["chuva", "fornecedor"],
     *   resultado: "sucesso",
     *   min_confiabilidade: 0.7,
     *   dias_ultimos: 180
     * }
     */
    return this.brainService.structuredSearch(dto);
  }

  // Endpoint 3: Lições por obra
  @Get('lessons/:obra_id')
  async getLessons(@Param('obra_id') obra_id: string): Promise<LessonListDto> {
    /**
     * GET /brain/lessons/obra-123
     * Response: { total: 42, lessons: [...], avg_confidence: 0.78 }
     */
    return this.brainService.getLessonsByObra(obra_id);
  }

  // Endpoint 4: Estatísticas do Brain
  @Get('stats/:obra_id')
  async getStats(@Param('obra_id') obra_id: string): Promise<BrainStatsDto> {
    /**
     * GET /brain/stats/obra-123
     * Response: {
     *   total_lessons: 42,
     *   avg_confidence: 0.78,
     *   successful_lessons: 35,
     *   event_types: { ATRASO_MATERIAL: 12, QUALIDADE: 8, ... },
     *   last_lesson_date: "2026-10-15"
     * }
     */
    return this.brainService.getStats(obra_id);
  }

  // Endpoint 5: Busca similar por tipo_evento
  @Get('similar/:tipo_evento')
  async getSimilarByEventType(@Param('tipo_evento') tipo_evento: string): Promise<SearchResultsDto> {
    /**
     * GET /brain/similar/ATRASO_MATERIAL?top_k=10&min_confidence=0.7
     */
    return this.brainService.findSimilarByEventType(tipo_evento);
  }
}
```

#### 6. Natural Language Response Generator
**Arquivo:** `scripts/brain_response_generator.py` (250 linhas)

```python
class BrainResponseGenerator:
    """Gera respostas em linguagem natural usando Claude"""
    
    def generate_response(self, query: str, search_results: List[SearchResult]) -> str:
        """
        Entrada: 
          - Query original: "Quando tivemos atraso por chuva?"
          - Top 5 search results com lições + soluções
        
        Saída: Resposta formatada com contexto histórico
        """
        
        # Build context do search results
        context = self._format_search_results(search_results)
        
        prompt = f"""
        Usuário perguntou: "{query}"
        
        Encontramos {len(search_results)} casos similares no histórico:
        
        {context}
        
        Gere uma resposta em português que:
        1. Resuma os casos encontrados (2-3 linhas)
        2. Extraia padrões comuns (o que funcionou, o que não funcionou)
        3. Recomende ações baseadas no histórico de sucesso
        4. Inclua confidence scores (média das lições)
        
        Tome um tom de especialista, não robô.
        """
        
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content[0].text
    
    def _format_search_results(self, results: List[SearchResult]) -> str:
        """Formata resultados em markdown legível"""
        formatted = []
        for i, result in enumerate(results, 1):
            lesson = result.lesson
            formatted.append(f"""
### Caso {i} (Similaridade: {result.similarity_score:.1%})
**Data:** {lesson.data}  
**Tipo:** {lesson.tipo_evento}  
**Resultado:** {lesson.resultado} ({lesson.confiabilidade:.0%} confiabilidade)

**O que aconteceu:** {lesson.resumo}

**Soluções usadas:**
{chr(10).join(f"- {s}" for s in lesson.solucoes)}

**Impacto:**
- Economia: R$ {lesson.impacto_economia:,.0f}
- Ganho de prazo: {lesson.impacto_prazo_dias:.0f} dias
""")
        return '\n'.join(formatted)
```

#### 7. Caching & Performance Optimization
**Arquivo:** `apps/intelligence-layer/src/brain/brain.cache.ts` (150 linhas)

```typescript
@Injectable()
export class BrainCacheService {
  constructor(private redis: RedisService) {}

  // Cache query results por 24h
  async cacheSearchResult(key: string, result: SearchResultsDto): Promise<void> {
    await this.redis.set(
      `brain:search:${key}`,
      JSON.stringify(result),
      { ttl: 86400 } // 24 horas
    );
  }

  // Cache estatísticas por 6h (refrescam com nova lição)
  async cacheStats(obra_id: string, stats: BrainStatsDto): Promise<void> {
    await this.redis.set(
      `brain:stats:${obra_id}`,
      JSON.stringify(stats),
      { ttl: 21600 } // 6 horas
    );
  }

  // Invalidar cache quando nova lição é armazenada
  async invalidateCache(obra_id: string): Promise<void> {
    const pattern = `brain:*:${obra_id}`;
    await this.redis.deletePattern(pattern);
  }
}
```

---

## 🗄️ Mudanças de Schema

### PostgreSQL (novas tabelas)
```sql
-- Tracking de queries
CREATE TABLE brain_search_queries (
  id BIGSERIAL PRIMARY KEY,
  obra_id VARCHAR(50) NOT NULL,
  query_text TEXT NOT NULL,
  tipo_evento VARCHAR(50),
  tags TEXT[],
  executed_at TIMESTAMP DEFAULT NOW(),
  result_count INT,
  response_time_ms INT,
  user_id VARCHAR(50)
);

-- Feedback de resultados
CREATE TABLE brain_search_feedback (
  id BIGSERIAL PRIMARY KEY,
  search_id BIGINT REFERENCES brain_search_queries(id),
  result_rank INT,
  feedback VARCHAR(20), -- thumbs_up, thumbs_down, not_relevant
  user_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_queries_obra ON brain_search_queries(obra_id, executed_at DESC);
CREATE INDEX idx_search_feedback ON brain_search_feedback(search_id);
```

### Qdrant Collections
```python
# Collection por obra
qdrant_client.recreate_collection(
    collection_name=f"brain_{obra_id}",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    metadata_config={
        'rdo_id': KeywordIndexParams(),
        'tipo_evento': KeywordIndexParams(),
        'resultado': KeywordIndexParams(),
        'confiabilidade': PayloadIndexParams(),
        'criado_em': PayloadIndexParams()
    }
)
```

---

## 📊 Fluxo End-to-End

```
Engenheiro faz pergunta:
  "Quando tivemos atraso por chuva?"
        ↓
Query chega em POST /brain/search
        ↓
Controller valida e faz embedding da query
        ↓
Semantic Search (Qdrant):
  1. Embed query → 1536-dim vector
  2. Buscar por similaridade (cosine)
  3. Rerank por confidence + recency
  4. Retorna top 5 matches
        ↓
Fetch Full Context (Neo4j):
  1. Para cada match, buscar Lesson completa
  2. Fetch related nodes (Causa, Solucao, Period)
  3. Calcular padrões
        ↓
Generate Response (Claude):
  1. Format search results
  2. Claude gera resposta conversacional
  3. Inclui recomendações baseadas em histórico
        ↓
Cache & Log:
  1. Armazenar query em brain_search_queries
  2. Cache resultado por 24h
  3. Preparar para feedback
        ↓
Response retorna para engenheiro:
  {
    "query": "Quando tivemos atraso por chuva?",
    "total_results": 8,
    "summary": "8 casos de atraso relacionados a chuva...",
    "cases": [
      {
        "rank": 1,
        "similarity": 0.92,
        "date": "2026-08-14",
        "outcome": "sucesso",
        "solutions": ["reordenacao_tarefas", "equipe_extra"],
        "impact": { "economia": 100000, "prazo_dias": 8 }
      },
      ...
    ],
    "recommendations": "Com base no histórico, em casos de chuva funciona bem..."
  }
```

---

## 🎯 Métricas de Sucesso

### Week 1
- [ ] Qdrant rodando (< 100ms por query)
- [ ] Embeddings de todas as 100+ lições criados
- [ ] Semantic search retornando resultados relevantes (> 80% accuracy manual)
- [ ] Query translator extraindo filtros corretamente

### Week 2
- [ ] API endpoints funcionando (< 500ms response time)
- [ ] Natural language responses legíveis e úteis
- [ ] Caching reduzindo latência (< 50ms cache hits)
- [ ] Logging de queries para feedback

### Quality Gates
- [ ] Relevância de busca > 80% (validação manual top 10 queries)
- [ ] Response time P95 < 500ms (sem cache)
- [ ] Response time P95 < 50ms (com cache)
- [ ] Zero erros de parsing de query em 100 testes
- [ ] Disponibilidade > 99.9% (Qdrant + Redis uptime)

---

## 💰 Investimento

| Item | Custo |
|------|-------|
| Engineering (60-80h @ R$ 400/hr) | R$ 24,000-32,000 |
| Claude API (embeddings + responses) | R$ 500 |
| Qdrant (cloud managed) | R$ 1,000 |
| Redis cache upgrade | R$ 500 |
| **Total** | **R$ 26k-34k** |

**ROI:** Cada engenheiro economiza ~1h/semana de busca manual = R$ 15k/ano por pessoa

---

## 🚨 Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Embeddings de baixa qualidade | Média | Alto | Validação manual top 20 queries |
| Query parsing incorreto | Média | Médio | Few-shot examples para Claude |
| Qdrant performance em escala | Baixa | Alto | Load testing com 5k embeddings |
| Hallucination em respostas Claude | Média | Médio | Sempre citar fontes (lições) |
| Feedback loop demora (usuários deixam de usar) | Média | Alto | Respostas úteis desde Week 1 |

---

## 📅 Timeline Detalhada

### Week 1: Infraestrutura Semântica (3-9 outubro)

**Day 1-2:**
- Setup Qdrant (Docker + credenciais)
- Implementar embedding pipeline
- Testar com mock lições

**Day 3-4:**
- Implementar semantic search
- Integrar com Neo4j para fetch de contexto
- Testes de relevância

**Day 5-6:**
- Query translator (entity extraction)
- Filtros estruturados
- Testes com 20+ queries

**Day 7:**
- Performance baseline (< 500ms queries)
- Documentação
- Handoff para Week 2

### Week 2: API & Inteligência (10-16 outubro)

**Day 1-2:**
- Endpoints REST
- Request/response DTOs
- Documentação OpenAPI

**Day 3-4:**
- Response generator (Claude prompt)
- Teste de qualidade de resposta
- Few-shot examples

**Day 5-6:**
- Caching (Redis)
- Logging de queries
- Feedback table

**Day 7:**
- Integration tests
- Performance profiling
- Production deployment

---

## 📚 Arquivos a Criar

### Core (Semana 1)
- `docker/docker-compose.yml` (adicionar Qdrant)
- `scripts/brain_embeddings.py` (250 linhas)
- `scripts/brain_semantic_search.py` (300 linhas)
- `scripts/brain_query_translator.py` (200 linhas)

### API (Semana 2)
- `apps/intelligence-layer/src/brain/brain.controller.ts` (400 linhas)
- `apps/intelligence-layer/src/brain/brain.service.ts` (350 linhas)
- `apps/intelligence-layer/src/brain/brain.cache.ts` (150 linhas)
- `apps/intelligence-layer/src/brain/dto/search.dto.ts` (200 linhas)
- `scripts/brain_response_generator.py` (250 linhas)

### Testes & Docs
- `tests/brain_search.spec.ts` (300 linhas)
- `docs/PHASE3.3-WEEK1-GUIDE.md` (400 linhas)
- `docs/PHASE3.3-API-REFERENCE.md` (500 linhas)

---

## 🔗 Dependências

**Deve ter completo:**
- ✅ Phase 3.1: RecommendationEngine v1.0 (base infrastructure)
- ✅ Phase 3.2 Week 1: Neo4j schema + extraction pipeline (lições no grafo)
- ✅ Phase 3.2 Week 2: 50+ lições validadas (dados para busca)

**Paralelo:**
- Phase 3.2 Week 3: Integração com Recommendation (não bloqueia 3.3)

---

## 🚀 Por Que Phase 3.3 Importa

1. **Diferencial:** Nenhum concorrente tem busca em linguagem natural sobre histórico operacional
2. **Adoção:** Engenheiros usam diariamente ("Já tivemos um caso assim?")
3. **Conhecimento:** Sedimenta aprendizado coletivo (não fica só na cabeça de uma pessoa)
4. **Moat:** Quanto mais se usa, mais dados para treinar modelos (Phase 3.5)

---

## 📊 Expected Output (Exemplo Real)

**Query:** "Quais foram as maiores economias que conseguimos com reordenação de atividades?"

**Response:**
```
Encontramos 12 casos onde reordenação de atividades foi utilizada.

Casos mais impactantes:
1. Ago/2024 (Atraso Material) — Economia: R$ 150.000 (confiabilidade 87%)
   - Problema: Cimento atrasou 15 dias por fornecedor
   - Solução: Reordenação de tarefas não-críticas
   - Resultado: Sucesso — apenas 8 dias de impacto vs 15 dias esperados

2. Jul/2024 (Atraso Mão de Obra) — Economia: R$ 120.000 (confiabilidade 82%)
   - Problema: Equipe especializada não disponível por 10 dias
   - Solução: Adiantamento de tarefas preparatórias
   - Resultado: Sucesso — cronograma recuperado

Padrão identificado:
✓ Reordenação funciona melhor em atrasos de MATERIAL (85% sucesso)
✓ Economia média: R$ 95.000 por aplicação
✓ Tempo implementação: 4-6 horas

Recomendação:
Em atrasos futuros de fornecedor, tente reordenação ANTES de outras opções mais caras.
```

---

**Phase 3.3 torna o Brain conversacional e prático para uso diário.**

**Status:** Pronto para começar Week 1 (3 outubro 2026)  
**Próxima Milestone:** Phase 3.4 (Assistente Proativo)
