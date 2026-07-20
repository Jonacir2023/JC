// Buildly Brain Schema for Neo4j
// Phase 3.2: Institutional Knowledge Graph
// Transforms RDOs into searchable lessons and causal relationships

// ============================================================
// INDEXES (Performance optimization)
// ============================================================

CREATE INDEX idx_brain_obra_id IF NOT EXISTS FOR (b:Brain) ON (b.obra_id);
CREATE INDEX idx_lesson_tipo_evento IF NOT EXISTS FOR (l:Lesson) ON (l.tipo_evento);
CREATE INDEX idx_lesson_resultado IF NOT EXISTS FOR (l:Lesson) ON (l.resultado);
CREATE INDEX idx_lesson_tags IF NOT EXISTS FOR (l:Lesson) ON (l.tags);
CREATE INDEX idx_lesson_confiabilidade IF NOT EXISTS FOR (l:Lesson) ON (l.confiabilidade);

// ============================================================
// CONSTRAINT: Unique Brain per obra
// ============================================================

CREATE CONSTRAINT brain_obra_unique IF NOT EXISTS FOR (b:Brain) REQUIRE b.obra_id IS UNIQUE;

// ============================================================
// NODE: Brain (Root knowledge structure per obra)
// ============================================================

// Example creation:
MERGE (brain:Brain {
  id: apoc.create.uuid(),
  obra_id: "obra-xyz",
  nome_obra: "Prédio Residencial Vila Mariana",
  created_at: datetime(),
  updated_at: datetime(),
  total_lessons: 0,
  total_decisions: 0,
  total_risks: 0,
  total_successful_lessons: 0,
  total_failed_lessons: 0,
  average_confidence: 0.0
});

// ============================================================
// NODE: Lesson (Extracted from RDO)
// ============================================================

// Structure of a Lesson node:
CREATE (lesson:Lesson {
  id: apoc.create.uuid(),
  brain_id: "brain-uuid",
  rdo_id: "rdo-001",
  data: "2026-08-14",

  // Core content
  resumo: "Cimento chegou 15 dias atrasado em agosto. Reordenação de atividades foi a solução mais eficiente.",
  tipo_evento: "ATRASO_MATERIAL",
  resultado: "sucesso",

  // Content arrays
  decisoes: ["reordenar_atividades", "equipe_extra", "equipamento_adicional"],
  problemas: ["atraso_fornecedor", "chuva_excessiva", "congestionamento_rodovia"],
  causas: ["fornecedor_abc_atraso", "período_chuvoso", "falta_previsão_backup"],
  solucoes: ["reordenação_tarefas_não_críticas", "contratação_mão_obra_temporária", "mudança_sequência_fase"],
  pendencias: ["comunicação_cliente_atraso", "revisão_cronograma", "análise_fornecedor_backup"],
  riscos: ["mesmo_fornecedor_confiabilidade_baixa", "risco_de_atraso_futuro", "custo_equipe_extra"],
  licoes: [
    "Fornecedor ABC não respeita prazos em meses chuvosos - considerar alternativas",
    "Reordenação de tarefas não-críticas é solução mais custo-efetiva para atrasos de material",
    "Comunicação com cliente não deve ser postergada - impacta confiança",
    "Período chuvoso exige 30% buffer adicional em prazos de fornecedores externos"
  ],
  tags: ["fornecedor", "chuva", "atraso_material", "ago2024", "agosto", "estrutura"],

  // Impact metrics
  impacto_economia: 100000.0,  // Savings from reordering vs. waiting
  impacto_prazo_dias: 8.0,     // Days saved vs. worst-case scenario
  impacto_qualidade: "NENHUM",  // POSITIVO|NEGATIVO|NENHUM|DESCONHECIDO

  // Quality & trust
  confiabilidade: 0.85,         // How confident is this lesson (0-1)
  criado_em: datetime()
});

// ============================================================
// RELATIONSHIP: Brain -[:CONTAINS]-> Lesson
// ============================================================

// Every lesson belongs to exactly one Brain
(brain:Brain)-[:CONTAINS]->(lesson:Lesson)

// Properties: none needed (cardinality only)

// ============================================================
// RELATIONSHIP: Lesson -[:SIMILAR_TO]-> Lesson
// ============================================================

// Link lessons with similar characteristics
// This enables: "When you have ATRASO_MATERIAL + chuva,
// here are 12 similar past cases with 73% success rate"

(lesson1:Lesson)-[:SIMILAR_TO {
  similarity_score: 0.78,       // 0-1, based on:
                                // - matching_tags / total_tags
                                // - confiabilidade weight
                                // - temporal proximity
  matching_tags: 4,             // How many tags matched
  reason: "Same event type + similar context (rain, material, cost)"
}]->(lesson2:Lesson)

// ============================================================
// RELATIONSHIP: Lesson -[:PATTERN_OF]-> EventType
// ============================================================

// Creates event type taxonomy
// Example: lesson -[:PATTERN_OF]-> EventType("ATRASO_MATERIAL")

MATCH (lesson:Lesson { tipo_evento: "ATRASO_MATERIAL" })
MERGE (et:EventType { tipo: "ATRASO_MATERIAL" })
CREATE (lesson)-[:PATTERN_OF]->(et)

// EventType node:
CREATE (et:EventType {
  tipo: "ATRASO_MATERIAL",
  total_occurrences: 0,
  success_rate: 0.0,
  avg_impact_economia: 0.0,
  avg_impact_prazo: 0.0,
  most_common_solutions: [],
  highest_risk_combinations: []
});

// ============================================================
// RELATIONSHIP: Lesson -[:CAUSED_BY]-> Causa
// ============================================================

// Causal graph: understand root causes
// Example: A delay lesson was CAUSED_BY a supplier reliability issue

MATCH (lesson:Lesson)
UNWIND lesson.causas as causa_name
MERGE (causa:Causa { nome: causa_name })
CREATE (lesson)-[:CAUSED_BY]->(causa)

// Causa node:
CREATE (causa:Causa {
  nome: "fornecedor_abc_atraso",
  categoria: "FORNECEDOR",
  total_incidents: 0,
  success_rate_after: 0.0,
  recommended_solutions: []
});

// ============================================================
// RELATIONSHIP: Lesson -[:SOLVED_BY]-> Solucao
// ============================================================

// Solution effectiveness tracking

MATCH (lesson:Lesson)
WHERE lesson.resultado = "sucesso"
UNWIND lesson.solucoes as solucao_name
MERGE (sol:Solucao { nome: solucao_name })
CREATE (lesson)-[:SOLVED_BY { effectiveness: lesson.confiabilidade }]->(sol)

// Solucao node:
CREATE (sol:Solucao {
  nome: "reordenação_tarefas",
  categoria: "PLANEJAMENTO",
  total_applications: 0,
  success_rate: 0.73,
  avg_cost_savings: 87500.0,
  avg_schedule_recovery_days: 6.5,
  typical_context: ["ATRASO_MATERIAL", "fase_estrutura"],
  recommendation_strength: 0.9  // How strongly to recommend this
});

// ============================================================
// RELATIONSHIP: Lesson -[:OCCURRED_DURING]-> Period
// ============================================================

// Temporal context for seasonal patterns

MATCH (lesson:Lesson)
WHERE lesson.data IS NOT NULL
MERGE (period:Period {
  mes: toString(apoc.date.parse(lesson.data, 'ms', 'yyyy-MM-dd')).substring(5, 7),
  ano: toString(apoc.date.parse(lesson.data, 'ms', 'yyyy-MM-dd')).substring(0, 4)
})
CREATE (lesson)-[:OCCURRED_DURING]->(period)

// Period node:
CREATE (period:Period {
  mes: "08",
  ano: "2026",
  total_incidents: 0,
  total_delays: 0,
  weather_pattern: "CHUVOSO",  // SECO|CHUVOSO|MODERADO
  avg_delay_days: 5.2
});

// ============================================================
// QUERIES (Usage examples)
// ============================================================

// Query 1: Find all lessons for a obra
MATCH (brain:Brain { obra_id: "obra-xyz" })-[:CONTAINS]->(lesson:Lesson)
RETURN lesson.data, lesson.tipo_evento, lesson.resumo, lesson.resultado
ORDER BY lesson.criado_em DESC;

// Query 2: When we had delays due to rain
MATCH (lesson:Lesson)
WHERE "chuva" IN lesson.tags
  AND lesson.tipo_evento = "ATRASO_MATERIAL"
RETURN lesson.resumo, lesson.solucoes, lesson.resultado, lesson.confiabilidade
ORDER BY lesson.confiabilidade DESC;

// Query 3: Find similar lessons to a current event
MATCH (current:Lesson { rdo_id: "rdo-current" })
MATCH (current)-[:SIMILAR_TO { similarity_score: score }]->(similar:Lesson)
WHERE score > 0.7
RETURN
  similar.resumo,
  similar.resultado,
  similar.solucoes,
  similar.confiabilidade,
  score as similarity
ORDER BY score DESC
LIMIT 5;

// Query 4: Success rate for a solution type
MATCH (sol:Solucao { nome: "reordenação_tarefas" })
<-(lesson:Lesson)-[:SOLVED_BY]-(sol)
WHERE lesson.resultado = "sucesso"
RETURN
  COUNT(lesson) as successful_applications,
  AVG(lesson.impacto_economia) as avg_savings,
  AVG(lesson.confiabilidade) as avg_confidence;

// Query 5: Root cause analysis - what causes delays most frequently
MATCH (causa:Causa)<-[:CAUSED_BY]-(lesson:Lesson)
WHERE lesson.tipo_evento = "ATRASO_MATERIAL"
RETURN
  causa.nome,
  COUNT(lesson) as frequency,
  AVG(lesson.confiabilidade) as reliability
ORDER BY frequency DESC;

// Query 6: Seasonal patterns - delays by month
MATCH (lesson:Lesson)-[:OCCURRED_DURING]->(period:Period)
WHERE lesson.tipo_evento = "ATRASO_MATERIAL"
RETURN
  period.mes,
  COUNT(lesson) as incident_count,
  AVG(lesson.impacto_prazo_dias) as avg_delay_days
ORDER BY period.mes;

// Query 7: Brain statistics for dashboard
MATCH (brain:Brain { obra_id: "obra-xyz" })
RETURN
  brain.total_lessons,
  brain.total_decisions,
  brain.total_risks,
  brain.total_successful_lessons,
  brain.average_confidence;

// ============================================================
// AGGREGATIONS (Materialized views for performance)
// ============================================================

// Periodic stats update (run daily after new lessons added)
MATCH (brain:Brain { obra_id: $obra_id })
MATCH (brain)-[:CONTAINS]->(lesson:Lesson)
WITH brain,
     COUNT(lesson) as total_lessons,
     COUNT(CASE WHEN lesson.resultado = "sucesso" THEN 1 END) as successful,
     AVG(lesson.confiabilidade) as avg_conf
SET brain.total_lessons = total_lessons,
    brain.total_successful_lessons = successful,
    brain.average_confidence = avg_conf,
    brain.updated_at = datetime();

// Update EventType stats
MATCH (et:EventType)<-[:PATTERN_OF]-(lesson:Lesson)
WITH et,
     COUNT(lesson) as occurrences,
     COUNT(CASE WHEN lesson.resultado = "sucesso" THEN 1 END) as successes
SET et.total_occurrences = occurrences,
    et.success_rate = CASE WHEN occurrences > 0 THEN toFloat(successes) / toFloat(occurrences) ELSE 0.0 END;

// ============================================================
// CONSTRAINTS & INTEGRITY
// ============================================================

// Ensure lesson always has a Brain parent
CREATE CONSTRAINT lesson_brain_exists IF NOT EXISTS
FOR (l:Lesson) REQUIRE EXISTS((l)<-[:CONTAINS]-(:Brain));

// Ensure valid resultado values
CREATE CONSTRAINT lesson_resultado_valid IF NOT EXISTS
FOR (l:Lesson) REQUIRE l.resultado IN ['sucesso', 'parcial', 'falha'];

// Ensure confiabilidade is between 0 and 1
CREATE CONSTRAINT lesson_confiabilidade_range IF NOT EXISTS
FOR (l:Lesson) REQUIRE l.confiabilidade >= 0.0 AND l.confiabilidade <= 1.0;
