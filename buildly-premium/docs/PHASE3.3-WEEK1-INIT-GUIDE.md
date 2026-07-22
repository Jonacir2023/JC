# Phase 3.3 Week 1 — Inicialização da Busca Semântica

**Duration:** 5-7 dias (3-9 outubro)  
**Status:** Scripts pronto, pronto para deploy  
**Esforço:** ~30 horas (1 engineer)

---

## 📋 Pré-Requisitos

Antes de começar Week 1, verificar:

- [ ] Phase 3.2 Week 2 completo (50+ RDOs em Neo4j)
- [ ] Qdrant instalado e rodando
- [ ] Python 3.9+ com dependencies: `pip install -r buildly-premium/scripts/requirements-phase3.3.txt`
- [ ] Claude API key com quota suficiente (embeddings + responses)
- [ ] Redis rodando (para cache)
- [ ] PostgreSQL com brain_search_queries table criada

---

## 🚀 Execução Step-by-Step

### Day 1-2: Qdrant Setup + Embedding Pipeline (8h)

#### Step 1.1: Setup Qdrant

**Adicionar ao docker-compose.yml:**

```yaml
qdrant:
  image: qdrant/qdrant:latest
  container_name: buildly-qdrant
  ports:
    - "6333:6333"
  volumes:
    - qdrant_data:/qdrant/storage
  environment:
    QDRANT_API_KEY: ${QDRANT_API_KEY:-your-api-key}
  command: ./qdrant --config-path ./config/production.yaml

volumes:
  qdrant_data:
```

**Deploy:**
```bash
docker-compose up -d qdrant
```

**Verificação:**
```bash
# Check if running
docker ps | grep qdrant

# Test connection
curl http://localhost:6333/health
# Expected: {"status":"ok"}

# Create test collection
curl -X PUT http://localhost:6333/collections/test \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {"size": 1536, "distance": "Cosine"}
  }'
```

#### Step 1.2: Test Embedding Pipeline

```bash
cd buildly-premium/scripts

# Set environment variables
export NEO4J_URI=neo4j://localhost:7687
export QDRANT_URL=http://localhost:6333
export CLAUDE_API_KEY=<your-key>

# Test with single obra (mock mode)
python brain_embeddings.py --embed-obra STAGING-001

# Expected output:
# ✓ Embedding lesson: RDO-20260801-001
# ✓ Lesson RDO-20260801-001 embedded successfully
# ✓ Stored embedding in Qdrant: brain_STAGING-001
```

#### Step 1.3: Embed All Historical Lessons

```bash
# Embed todas as lições em Neo4j
python brain_embeddings.py --embed-all

# Monitor progress (em outro terminal)
watch "echo 'SELECT COUNT(*) FROM neo4j WHERE embedding_created_at IS NOT NULL'"

# Expected: Embedding ~50+ lessons over 2-3 hours
# Rate: ~1 embedding per 2-3 seconds (limited by Claude API)
```

**Validação:**
```bash
# Check Qdrant collections
python brain_embeddings.py --validate

# Expected output:
# ✓ Neo4j: 50 embedded lessons
# ✓ Qdrant: 1 collections
#   - brain_STAGING-001: 50 points
```

---

### Day 3-4: Semantic Search Implementation (10h)

#### Step 2.1: Test Query Translator

```bash
# Test entity extraction
python brain_query_translator.py "Quando tivemos atraso por chuva?"

# Expected output:
# {
#   "tipo_evento": ["ATRASO_MATERIAL"],
#   "tags": ["chuva"],
#   "resultado": null,
#   "buscar_por": null
# }

# Test with more complex query
python brain_query_translator.py "Maiores economias nos últimos 60 dias com sucesso"

# Expected:
# {
#   "tipo_evento": null,
#   "tags": null,
#   "resultado": "sucesso",
#   "buscar_por": "impacto",
#   "periodo_dias": 60,
#   "impacto_min": 100000
# }
```

#### Step 2.2: Test Semantic Search

```bash
# Test mock mode first
python brain_semantic_search.py "Quando tivemos atraso por chuva?" --test-mock

# Expected: Mock JSON response with sample result

# Now test against real data
python brain_semantic_search.py "Quando tivemos atraso por material?" --obra STAGING-001 --top-k 5

# Expected output:
# {
#   "query": "Quando tivemos atraso por material?",
#   "total_results": 5,
#   "search_time_ms": 234.5,
#   "results": [
#     {
#       "rank": 1,
#       "similarity_score": 0.92,
#       "tipo_evento": "ATRASO_MATERIAL",
#       "resultado": "sucesso",
#       "confiabilidade": 0.87
#     }
#   ]
# }
```

#### Step 2.3: Performance Benchmark

```bash
# Test 10 different queries
python << 'PYTHON'
from brain_semantic_search import BrainSemanticSearch
import time

search = BrainSemanticSearch()
queries = [
    "Quando tivemos atraso por chuva?",
    "Soluções que funcionaram",
    "Maiores economias",
    "Casos de qualidade",
    "Atrasos de fornecedor",
    "Segurança problemas",
    "Sucesso equipe",
    "Custo impacto",
    "Acidente casos",
    "Equipamento falhas"
]

times = []
for q in queries:
    start = time.time()
    response = search.search(q, "STAGING-001", top_k=5)
    elapsed = time.time() - start
    times.append(elapsed)
    print(f"{q}: {elapsed*1000:.0f}ms, {response.total_results} results")

print(f"\nAverage: {sum(times)/len(times)*1000:.0f}ms")
print(f"P95: {sorted(times)[int(len(times)*0.95)]*1000:.0f}ms")
PYTHON

# Expected: Average < 500ms, P95 < 1000ms
```

---

### Day 5-6: Caching + API Integration (8h)

#### Step 3.1: Setup Redis Cache

```bash
# Test Redis connection
python << 'PYTHON'
import redis

cache = redis.Redis(host='localhost', port=6379, db=0)
cache.set('test', 'value')
print(cache.get('test'))  # Should print: b'value'
PYTHON

# Create cache wrapper
cat > buildly-premium/scripts/brain_cache.py << 'EOF'
import redis
import json
from datetime import timedelta

class BrainCache:
    def __init__(self, redis_url='redis://localhost:6379'):
        self.redis = redis.from_url(redis_url)
    
    def cache_search_result(self, query: str, obra_id: str, result: dict):
        """Cache search result para 24h"""
        key = f"brain:search:{obra_id}:{query}"
        self.redis.setex(
            key,
            timedelta(hours=24),
            json.dumps(result)
        )
    
    def get_cached_result(self, query: str, obra_id: str):
        """Retrieve cached result"""
        key = f"brain:search:{obra_id}:{query}"
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    def invalidate_obra_cache(self, obra_id: str):
        """Invalidate all cache for obra (when new lesson added)"""
        pattern = f"brain:*:{obra_id}:*"
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)
EOF
```

#### Step 3.2: Add Search Logging to PostgreSQL

```sql
-- Create search tracking table
CREATE TABLE brain_search_log (
  id BIGSERIAL PRIMARY KEY,
  obra_id VARCHAR(50) NOT NULL,
  query TEXT NOT NULL,
  query_hash VARCHAR(64),  -- For deduplication
  search_time_ms INT,
  result_count INT,
  cache_hit BOOLEAN DEFAULT false,
  user_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_log_obra ON brain_search_log(obra_id, created_at DESC);
CREATE INDEX idx_search_log_hash ON brain_search_log(query_hash);

-- Create feedback table
CREATE TABLE brain_search_feedback (
  id BIGSERIAL PRIMARY KEY,
  search_log_id BIGINT REFERENCES brain_search_log(id),
  result_rank INT,
  feedback VARCHAR(20),  -- thumbs_up, thumbs_down, not_relevant
  user_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_search ON brain_search_feedback(search_log_id);
```

#### Step 3.3: Integrate with API (TypeScript)

```bash
# Generate TypeScript DTOs for search
cat > apps/intelligence-layer/src/brain/dto/search.dto.ts << 'EOF'
export class SearchQueryDto {
  query: string;
  obra_id: string;
  top_k?: number = 5;
  min_similarity?: number = 0.5;
}

export class SearchResultDto {
  rank: number;
  rdo_id: string;
  similarity_score: number;
  tipo_evento: string;
  resultado: string;
  resumo: string;
  confiabilidade: number;
  solucoes: string[];
  impacto_economia: number;
  data: string;
}

export class SearchResponseDto {
  query: string;
  obra_id: string;
  total_results: number;
  search_time_ms: number;
  cache_hit?: boolean;
  summary: string;
  results: SearchResultDto[];
}
EOF
```

---

### Day 7: Testing + Performance Tuning (6h)

#### Step 4.1: Performance Testing

```bash
# Load test: 100 concurrent searches
python << 'PYTHON'
import concurrent.futures
import time
from brain_semantic_search import BrainSemanticSearch

search = BrainSemanticSearch()
queries = [
    "Atraso material",
    "Qualidade issues",
    "Custo impacto",
    # Repeat for load
] * 25

def run_search(query):
    start = time.time()
    try:
        response = search.search(query, "STAGING-001", top_k=5)
        return time.time() - start, True
    except Exception as e:
        return time.time() - start, False

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(run_search, queries))

times = [r[0] for r in results]
successes = sum(1 for r in results if r[1])

print(f"Succeeded: {successes}/{len(queries)}")
print(f"Average: {sum(times)/len(times)*1000:.0f}ms")
print(f"P50: {sorted(times)[int(len(times)*0.50)]*1000:.0f}ms")
print(f"P95: {sorted(times)[int(len(times)*0.95)]*1000:.0f}ms")
print(f"P99: {sorted(times)[int(len(times)*0.99)]*1000:.0f}ms")
PYTHON

# Expected:
# Succeeded: 100/100
# Average: 300ms
# P95: 800ms
# P99: 1200ms
```

#### Step 4.2: Relevance Validation

```bash
# Manual validation: 20 test queries
python << 'PYTHON'
test_queries = [
    ("Quando tivemos atraso por chuva?", "ATRASO_MATERIAL", "Deve retornar atrasos relacionados a chuva"),
    ("Soluções que funcionaram", "sucesso", "Deve retornar apenas lições com resultado=sucesso"),
    ("Maiores economias", "impacto", "Deve rankear por impacto_economia DESC"),
    # ... adicionar 17 mais
]

from brain_semantic_search import BrainSemanticSearch
search = BrainSemanticSearch()

passed = 0
for query, expected_filter, description in test_queries:
    response = search.search(query, "STAGING-001", top_k=3)
    
    if response.total_results > 0:
        # Check if top result matches expectation
        top_result = response.results[0]
        if expected_filter.lower() in str(top_result).lower():
            print(f"✓ {query}")
            passed += 1
        else:
            print(f"✗ {query} - Got {top_result.tipo_evento}")
    else:
        print(f"✗ {query} - No results")

print(f"\nRelevance: {passed}/{len(test_queries)} ({passed*100//len(test_queries)}%)")
# Target: > 80% relevance
PYTHON
```

---

## ✅ Week 1 Validation Checklist

Após completar todos os steps, verificar:

### Infrastructure
- [ ] Qdrant rodando (`docker ps | grep qdrant`)
- [ ] Qdrant health check: `curl http://localhost:6333/health`
- [ ] Collections criadas para cada obra
- [ ] Redis cache funcionando

### Data
- [ ] 50+ embeddings criados (`python brain_embeddings.py --validate`)
- [ ] Neo4j atualizado com embedding_created_at
- [ ] Qdrant contém todos os embeddings

### Queries
- [ ] Query translator extrai entidades corretamente (5+ test cases)
- [ ] Semantic search retorna resultados (< 500ms P95)
- [ ] Search results rankqueados por similaridade
- [ ] Cache funciona (2ª busca idêntica < 50ms)

### API
- [ ] DTOs criadas
- [ ] Controller skeleton criado
- [ ] Health endpoint respondendo

### Performance
- [ ] Load test: 100 concurrent searches, 100% success
- [ ] Average latency: < 500ms
- [ ] P95 latency: < 1000ms
- [ ] Cache hit: > 60%

### Quality
- [ ] Relevance score: > 80% (manual validation 20 queries)
- [ ] No errors in logs
- [ ] Search logging working (PostgreSQL)

---

## 🧪 Testes Manuais

### Test 1: Query Translator
```bash
python brain_query_translator.py "Quando tivemos atraso por chuva?"
# Verify: tipo_evento includes "ATRASO_MATERIAL", tags includes "chuva"
```

### Test 2: Semantic Search
```bash
python brain_semantic_search.py "Sucessos em estrutura" --obra STAGING-001
# Verify: results ordenados por similarity_score DESC
```

### Test 3: Cache
```bash
time python brain_semantic_search.py "Teste cache" --obra STAGING-001
# 1st run: ~300-500ms
time python brain_semantic_search.py "Teste cache" --obra STAGING-001
# 2nd run: ~50ms (cache hit)
```

---

## 📊 Expected State After Week 1

| Component | Status | Expected Value |
|-----------|--------|-----------------|
| Qdrant | ✓ | Running, 1+ collections |
| Embeddings | ✓ | 50+ vectors stored |
| Query Translator | ✓ | Entity extraction working |
| Semantic Search | ✓ | < 500ms P95 latency |
| Cache | ✓ | Redis working, 60%+ hit rate |
| PostgreSQL Logging | ✓ | Searches logged |
| Relevance | ✓ | > 80% accuracy (manual validation) |

---

## 🚀 Next: Week 2 (10-16 outubro)

Quando Week 1 estiver completo:

1. **API Endpoints** — Criar REST endpoints
2. **Response Generation** — Claude generates conversational responses
3. **Advanced Filters** — Nested queries (AND/OR logic)
4. **Feedback Loop** — Users rate results, improves ranking

---

## 🆘 Troubleshooting

### Qdrant não conecta
```bash
# Check logs
docker logs buildly-qdrant

# Restart
docker-compose restart qdrant

# Verify health
curl http://localhost:6333/health
```

### Embeddings lentos
```bash
# Claude API rate limit?
# Check: https://platform.openai.com/account/rate-limits

# Solution: Add batch processing
# Split 50 lessons into 10 batches, 5 min delays
```

### Query translator retorna JSON inválido
```bash
# Check Claude response
# Add logging: logger.info(f"Claude response: {response_text}")
# Verify prompt sintaxe
```

### Relevance baixa (< 70%)
```bash
# Problem: Embeddings não capturando semântica
# Solution: Ajustar prompt para melhor extração de contexto
# Check: _prepare_text() em brain_embeddings.py
```

---

**Week 1 Status:** Pronto para começar (3 outubro)  
**Estimated Completion:** 9 outubro  
**Next Milestone:** Week 2 API integration (10 outubro)
