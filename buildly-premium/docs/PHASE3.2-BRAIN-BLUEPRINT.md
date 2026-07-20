# Phase 3.2: Buildly Brain — Complete Blueprint

**Status:** Design & Implementation Ready  
**Duration:** 3 weeks (13-02 setembro)  
**Critical Path:** YES (foundation for 3.3-3.6)  
**Effort:** 100-120 hours

---

## 🧠 Executive Summary

Transform RDOs into institutional knowledge that powers recommendations.

```
Daily Loop:
  RDO Created → Claude AI Extraction → JSON Lesson → Neo4j Brain
                                              ↓
  Next RDO with similar context:  Brain suggests 847 similar cases (73% success)
```

**End Result:** A searchable, learnable memory of everything that happened — accessible to the Recommendation Engine v2 and beyond.

---

## 📋 Phase 3.2 Deliverables

### Week 1 (13-19 setembro): Foundation

#### 1. Brain Extraction Pipeline (DONE ✅)
- **File:** `scripts/brain_extraction_pipeline.py` (590 linhas)
- **What it does:**
  1. Fetch latest unprocessed RDO from PostgreSQL
  2. Send to Claude API with structured extraction prompt
  3. Parse returned JSON into BrainLesson object
  4. Store in Neo4j Brain
  5. Link similar lessons from history
  6. Update Brain statistics

- **Key Components:**
  - `BrainExtractionPipeline` class: orchestrator
  - `BrainLesson` dataclass: structured output
  - `EventoTipo`, `Resultado` enums: type safety
  - DB connections: PostgreSQL + Neo4j

- **Database Changes:**
  - Add column to `diario_obras`: `brain_processado` (bool, default false)
  - Add column: `brain_processado_em` (timestamp)

#### 2. Neo4j Brain Schema (DONE ✅)
- **File:** `schemas/brain_schema.cypher` (380 linhas)
- **What it defines:**
  1. **Brain node**: Root knowledge structure (one per obra)
  2. **Lesson node**: Extracted knowledge with 15+ properties
  3. **EventType node**: Categorized patterns
  4. **Causa node**: Root cause taxonomy
  5. **Solucao node**: Solution effectiveness tracking
  6. **Period node**: Temporal context (seasonal patterns)

- **Relationships:**
  - Brain -[:CONTAINS]-> Lesson (1:N)
  - Lesson -[:SIMILAR_TO]-> Lesson (N:N with similarity_score)
  - Lesson -[:PATTERN_OF]-> EventType
  - Lesson -[:CAUSED_BY]-> Causa
  - Lesson -[:SOLVED_BY]-> Solucao
  - Lesson -[:OCCURRED_DURING]-> Period

- **Indexes:** 5 for fast queries
- **Constraints:** 3 for data integrity

#### 3. RDO Extraction Prompt (DONE ✅)
- **In:** `brain_extraction_pipeline.py` (method `_build_extraction_prompt`)
- **What it does:**
  - Guides Claude through systematic RDO analysis
  - Ensures consistent JSON output
  - Extracts 10+ dimensions of knowledge
  - Includes quality scoring (confiabilidade 0-1)

- **Output JSON:**
  ```json
  {
    "resumo": "string",
    "decisoes": ["array"],
    "problemas": ["array"],
    "causas": ["array"],
    "solucoes": ["array"],
    "pendencias": ["array"],
    "riscos": ["array"],
    "licoes": ["string"],
    "tags": ["array"],
    "tipo_evento": "ATRASO_MATERIAL|...",
    "resultado": "sucesso|parcial|falha",
    "impacto_economia": float,
    "impacto_prazo_dias": float,
    "impacto_qualidade": "string",
    "confiabilidade": 0-1
  }
  ```

#### 4. Daily Scheduler Configuration (N8N)
- **File:** `n8n/workflows/brain_daily_extraction.json` (NEW)
- **Trigger:** Every day at 02:00 UTC (after RDOs typically close at 20:00)
- **Steps:**
  1. Call `brain_extraction_pipeline.py`
  2. Log results to PostgreSQL
  3. Alert if extraction fails > 3 times
  4. Update Brain statistics view

### Week 2 (20-26 setembro): Validation & Enrichment

#### 5. Brain Dashboard (New PostgreSQL View)
- **File:** `migrations/V004__brain_views.sql` (NEW)

```sql
-- View: v_brain_stats (real-time Brain statistics)
CREATE VIEW v_brain_stats AS
SELECT
  obra_id,
  COUNT(DISTINCT lesson_id) as total_lessons,
  SUM(CASE WHEN resultado = 'sucesso' THEN 1 ELSE 0 END) as successful_lessons,
  AVG(confiabilidade) as avg_confidence,
  MAX(criado_em) as last_lesson_date,
  STRING_AGG(DISTINCT tipo_evento, ',') as event_types
FROM neo4j_lessons
GROUP BY obra_id;

-- View: v_top_lessons (most impactful lessons)
CREATE VIEW v_top_lessons AS
SELECT
  obra_id, resumo, resultado, impacto_economia, confiabilidade,
  ROW_NUMBER() OVER (PARTITION BY obra_id ORDER BY confiabilidade DESC) as rank
FROM neo4j_lessons
WHERE resultado = 'sucesso';

-- View: v_risk_patterns (recurring risks)
CREATE VIEW v_risk_patterns AS
SELECT
  obra_id, tipo_evento, COUNT(*) as frequency,
  STRING_AGG(DISTINCT risk, ',') as risks
FROM neo4j_lessons, UNNEST(risks) as risk
GROUP BY obra_id, tipo_evento
HAVING COUNT(*) > 1
ORDER BY frequency DESC;
```

#### 6. Similarity Search Implementation
- **File:** `scripts/brain_similarity_search.py` (NEW, 250 linhas)

```python
class BrainSimilaritySearch:
    """
    Find similar lessons to a given context
    Returns top N most relevant historical decisions
    """
    
    def search(self, context: Dict) -> List[Lesson]:
        """
        context = {
          'tipo_evento': 'ATRASO_MATERIAL',
          'tags': ['chuva', 'fornecedor', 'estrutura'],
          'constraintos': {'max_impacto': 500000}
        }
        
        Returns: List of lessons ranked by relevance
        """
        pass
```

#### 7. Quality Validation Script
- **File:** `scripts/brain_quality_check.py` (NEW, 200 linhas)
- **Validates:**
  - All lessons have required fields
  - Confiabilidade scores make sense (outliers?)
  - No duplicate lessons detected
  - Impact metrics are realistic
  - Tags are consistent

- **Output:** Report with quality metrics and anomalies

#### 8. Feed Real RDOs (Manual + Automated)
- Load 50-100 historical RDOs into Brain
- Run extraction pipeline on each
- Validate output quality
- Test similarity search accuracy

### Week 3 (27-02 setembro): Integration & Testing

#### 9. Integration with Recommendation Engine v1.5
- **File:** `apps/intelligence-layer/src/brain/brain.integration.ts` (NEW)
- **Adds to RecommendationService:**
  ```typescript
  async recommendWithBrain(request): Promise<Response> {
    // 1. Old: Extract features + heuristic scoring
    const v1_recommendations = await this.recommendV1(request);
    
    // 2. New: Query Brain for similar cases
    const similar_lessons = await brain.findSimilar(request.evento);
    
    // 3. Combine: Weight recommendations by historical success
    return this.combineRecommendations(v1_recommendations, similar_lessons);
  }
  ```

#### 10. Brain Query Endpoint (API)
- **File:** `apps/intelligence-layer/src/brain/brain.controller.ts` (NEW)
- **Endpoints:**
  ```
  GET  /brain/search?q=quando tivemos atraso por chuva
  GET  /brain/lessons/:obra_id
  GET  /brain/stats/:obra_id
  GET  /brain/similar/:tipo_evento
  ```

#### 11. A/B Test: v1.0 (heuristic) vs v1.5 (heuristic + Brain)
- **Duration:** 7 days in staging
- **Metrics:**
  - Recommendation accuracy (vs actual user decisions)
  - Confidence scores (v1.5 should have tighter confidence intervals)
  - Cache hit ratio (improved by better relevance)

#### 12. Documentation & Handoff
- **Files:**
  - `PHASE3.2-BRAIN-IMPLEMENTATION.md` — How it works
  - `BRAIN-USAGE-GUIDE.md` — How to query it
  - Runbooks for common issues

---

## 🗄️ Data Schema Changes

### PostgreSQL Changes (Minimal)

```sql
-- Add to diario_obras table
ALTER TABLE diario_obras ADD COLUMN brain_processado BOOLEAN DEFAULT false;
ALTER TABLE diario_obras ADD COLUMN brain_processado_em TIMESTAMP;
ALTER TABLE diario_obras ADD COLUMN brain_error_message TEXT;
ALTER TABLE diario_obras ADD COLUMN brain_extraction_attempts INT DEFAULT 0;
```

### Neo4j Structure (Complete Graph)

```
Brain (1 per obra)
  ├─ 50+ Lessons (1 week of RDOs)
  │  ├─ SIMILAR_TO other lessons
  │  ├─ PATTERN_OF EventType
  │  ├─ CAUSED_BY Causas
  │  ├─ SOLVED_BY Solucoes
  │  └─ OCCURRED_DURING Period
  ├─ EventTypes (aggregated patterns)
  ├─ Causas (root cause taxonomy)
  ├─ Solucoes (proven solutions)
  └─ Periods (seasonal patterns)
```

---

## 🔄 Daily Loop

```
06:00 — Last RDO closed
06:30 — Daily extraction job triggers
  ├─ Fetch latest RDO from PostgreSQL
  ├─ Send to Claude API (cost: ~$0.002 per RDO)
  ├─ Parse JSON response
  ├─ Store in Neo4j (5-10 ms)
  ├─ Link similarities (50-100 ms)
  ├─ Update Brain statistics
  └─ Log success/error to PostgreSQL

07:00 — Brain updated with latest lesson
  └─ Ready for next similar event

Next time similar event occurs:
  RecommendationEngine queries: "Show me 847 similar cases"
  └─ Returns with success_rate, avg_impact, solutions
```

**SLA:** Extraction completes within 60 seconds  
**Cost:** ~$0.002 per RDO (Claude API)  
**Storage:** ~1 KB per lesson in Neo4j

---

## 📊 Success Metrics

### Week 1 Checkpoint (19 setembro)
- [ ] Extraction pipeline running daily
- [ ] 10+ RDOs successfully processed
- [ ] Neo4j Brain contains structured lessons
- [ ] Similarity search returning results

### Week 2 Checkpoint (26 setembro)
- [ ] 50+ RDOs loaded into Brain
- [ ] Quality validation script green
- [ ] Dashboard shows real statistics
- [ ] A/B test configuration ready

### Week 3 Checkpoint (02 outubro)
- [ ] Integration with RecommendationEngine v1.5 complete
- [ ] A/B test running in staging (7 days)
- [ ] Documentation complete
- [ ] Ready for Phase 3.3

### Quality Gates
- [ ] No extraction failures > 3 days
- [ ] Average confidence score > 0.70
- [ ] Similarity search relevance > 75% (manual validation)
- [ ] API response time < 500ms

---

## 🎯 What Phase 3.2 Enables

### Phase 3.3: Brain Intelligence (Natural Language Search)
```
User: "Quando tivemos atraso por chuva?"
Brain: "8 casos similares encontrados:
  - Ago/2024: Atraso de 15 dias, solução: reordenação (sucesso)
  - Jul/2024: Atraso de 8 dias, solução: equipe extra (sucesso)
  ..."
```

### Phase 3.4: Engineering Assistant (Proactive)
```
New RDO created: "Chuva forte prevista para amanhã"
Assistant: "Hey, temos histórico de atrasos em chuva.
  - Fornecedor ABC é crítico (75% falha em chuva)
  - Recomendação: avançar entregas hoje
  - Custo: R$ 15k | Economia: R$ 100k"
```

### Phase 3.5: Predictive Analytics
```
Dashboard: "Risco de atraso nos próximos 60 dias: 34%
  - Baseado em: 847 casos históricos similares
  - Probabilidade de estourar orçamento: 22%
  - Equipamentos em falta: 3"
```

### Phase 3.6: Enterprise AI
```
C-Suite Query: "Quais obras têm maior risco de estourar orçamento?"
AI Response: "3 obras identificadas:
  - Obra A: 68% risco (fornecedor crítico atrasado)
  - Obra B: 54% risco (equipe acima do histórico)
  - Obra C: 41% risco (sazonalidade de chuvas)"
```

---

## 💰 Business Case

### Investment (Phase 3.2)
- Engineering effort: 100-120 hours (~R$ 30-40k)
- Claude API calls: ~200 calls/week × 12 weeks = 2,400 calls = ~R$ 2.4k
- Infrastructure: Included in existing Neo4j

**Total: ~R$ 45k**

### ROI (first 6 months)
- Each RDO processed: saves ~2h of manual analysis (R$ 300)
- 500+ RDOs in Brain: ~R$ 150k saved in analysis time
- Improved recommendations: reduce delays by 10% = R$ 500k+ per obra per year

**ROI: 10-15x in first year**

---

## 🚨 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Claude API extraction quality poor | Medium | High | Validation script + manual review of first 50 |
| Neo4j performance degradation | Low | Medium | Indexes + aggregation views |
| RDO data quality inconsistent | Medium | High | Quality checks + user training |
| Similarity search giving false positives | Medium | Medium | Relevance thresholds + manual validation |
| Pipeline falls behind (RDOs faster than extraction) | Low | Low | Async processing + batch mode |

---

## 📅 Detailed Timeline

### Week 1: Foundation (13-19 setembro)

**Day 1-2:**
- Set up Neo4j environment
- Deploy `brain_schema.cypher`
- Test database connections

**Day 3-4:**
- Implement `brain_extraction_pipeline.py`
- Test extraction with mock RDO
- Validate JSON parsing

**Day 5-6:**
- Add daily scheduler (n8n workflow)
- Test end-to-end with 10 real RDOs
- Verify Brain nodes created

**Day 7:**
- Documentation
- Handoff to team for feedback

### Week 2: Validation (20-26 setembro)

**Day 1-2:**
- Load 50+ historical RDOs (batch import)
- Run quality validation script
- Fix any data issues

**Day 3-4:**
- Implement similarity search
- Test with real queries
- Tune relevance thresholds

**Day 5-6:**
- Create Brain dashboard views
- Visualize statistics
- A/B test setup

**Day 7:**
- Performance optimization
- Load testing (100+ concurrent queries)

### Week 3: Integration (27-02 outubro)

**Day 1-2:**
- Integrate with RecommendationEngine
- Modify endpoint to use Brain
- Update response structure

**Day 3-4:**
- Deploy to staging
- Start 7-day A/B test
- Monitor metrics

**Day 5-6:**
- Collect A/B results
- Documentation sprint
- Prepare for Phase 3.3

**Day 7:**
- Phase 3.2 sign-off
- Plan Phase 3.3 kickoff

---

## 🔍 Quality Checklist

Before declaring Phase 3.2 complete:

- [ ] Extraction pipeline: 99%+ success rate
- [ ] 100+ RDOs successfully processed
- [ ] Similarity search relevance validated
- [ ] Brain statistics dashboard working
- [ ] A/B test shows Brain adds value
- [ ] Documentation complete
- [ ] Team trained on Brain concepts
- [ ] Runbooks prepared for support
- [ ] Neo4j performance acceptable (<100ms queries)
- [ ] Cost monitoring in place (Claude API)

---

## 🚀 Phase 3.2 Is Critical Because:

1. **Foundation:** Everything else (3.3-3.6) depends on quality of Brain
2. **Moat:** Once you have 1 year of RDOs, competitor can't replicate
3. **Network Effect:** Each new RDO makes recommendations smarter
4. **Data Asset:** The Brain becomes your company's most valuable asset
5. **Multiplier:** Powers both AI assistant (3.4) and predictive analytics (3.5)

**If Phase 3.2 succeeds, Phases 3.3-3.6 are much easier.**  
**If Phase 3.2 fails, everything after it fails.**

---

**Status:** Ready to start Week 1 on 13 setembro 2026  
**Next Review:** 19 setembro (Week 1 checkpoint)

