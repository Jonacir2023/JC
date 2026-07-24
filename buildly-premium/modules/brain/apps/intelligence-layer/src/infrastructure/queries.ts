/**
 * SQL & Cypher Queries
 *
 * Centraliza todas as queries usadas pelos serviços
 */

// ========== POSTGRESQL QUERIES ==========

export const SQL = {
  // ===== EVENTS =====
  events: {
    selectUnsyncedEvents: `
      SELECT id, type, timestamp, "context", data, audit
      FROM events
      WHERE synced_to_neo4j = false
      ORDER BY created_at ASC
      LIMIT $1
    `,

    markEventSynced: `
      UPDATE events
      SET synced_to_neo4j = true, synced_at = NOW()
      WHERE id = $1
    `,

    selectEventById: `
      SELECT * FROM events WHERE id = $1
    `,

    selectEventsByObra: `
      SELECT * FROM events
      WHERE context->>'obra_id' = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `,
  },

  // ===== OBJECTIVES =====
  objectives: {
    selectObjectivesForBMI: `
      SELECT id, obra_id, nome, status, progresso_percentual, data_alvo
      FROM objectives
      WHERE obra_id = $1
      AND status IN ('PLANEJADO', 'EM_EXECUCAO', 'ATRASADO')
    `,

    selectObjectiveById: `
      SELECT * FROM objectives WHERE id = $1
    `,

    updateObjectiveStatus: `
      UPDATE objectives
      SET status = $2, updated_at = NOW()
      WHERE id = $1
    `,
  },

  // ===== DECISIONS =====
  decisions: {
    selectDecisionsForBMI: `
      SELECT id, obra_id, feedback_score, resultado_esperado, resultado_real
      FROM decisions
      WHERE obra_id = $1
      ORDER BY created_at DESC
    `,

    selectDecisionById: `
      SELECT * FROM decisions WHERE id = $1
    `,
  },

  // ===== BMI HISTORY =====
  bmi_history: {
    insertBMIScore: `
      INSERT INTO bmi_scores (
        id, obra_id, timestamp,
        bmi_total, classificacao,
        dimensao_execucao, dimensao_financeiro, dimensao_risco,
        dimensao_governanca, dimensao_planejamento,
        dimensao_recursos, dimensao_sustentabilidade, dimensao_seguranca
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `,

    selectBMIHistory: `
      SELECT bmi_total, classificacao, timestamp
      FROM bmi_scores
      WHERE obra_id = $1
      ORDER BY timestamp DESC
      LIMIT 30
    `,
  },
};

// ========== NEO4J CYPHER QUERIES ==========

export const CYPHER = {
  // ===== CREATE NODES =====
  nodes: {
    createEventoNode: (params: any) => `
      CREATE (n:EVENTO {
        ref_id: $ref_id,
        tipo_evento: $tipo_evento,
        timestamp: $timestamp,
        obra_id: $obra_id,
        prioridade: $prioridade,
        impacto_potencial: $impacto_potencial,
        synced_at: datetime()
      })
      RETURN n
    `,

    createObjetivoNode: (params: any) => `
      CREATE (n:OBJETIVO {
        ref_id: $ref_id,
        nome: $nome,
        obra_id: $obra_id,
        status: $status,
        progresso: $progresso,
        data_alvo: $data_alvo,
        synced_at: datetime()
      })
      RETURN n
    `,

    createDecisaoNode: (params: any) => `
      CREATE (n:DECISAO {
        ref_id: $ref_id,
        descricao: $descricao,
        obra_id: $obra_id,
        feedback_score: $feedback_score,
        decisor: $decisor,
        synced_at: datetime()
      })
      RETURN n
    `,
  },

  // ===== CREATE RELATIONSHIPS =====
  relationships: {
    createAmeacaRelation: `
      MATCH (evento:EVENTO {ref_id: $evento_id})
      MATCH (objetivo:OBJETIVO {ref_id: $objetivo_id})
      CREATE (evento)-[r:AMEACA {
        confianca: $confianca,
        peso: $peso,
        created_at: datetime()
      }]->(objetivo)
      RETURN r
    `,

    createAfetaRelation: `
      MATCH (evento:EVENTO {ref_id: $evento_id})
      MATCH (atividade:ATIVIDADE {ref_id: $atividade_id})
      CREATE (evento)-[r:AFETA {
        confianca: $confianca,
        peso: $peso,
        created_at: datetime()
      }]->(atividade)
      RETURN r
    `,

    createMitigadaPorRelation: `
      MATCH (objetivo:OBJETIVO {ref_id: $objetivo_id})
      MATCH (decisao:DECISAO {ref_id: $decisao_id})
      CREATE (objetivo)-[r:MITIGADA_POR {
        efetividade: $efetividade,
        created_at: datetime()
      }]->(decisao)
      RETURN r
    `,

    createCausadaPorRelation: `
      MATCH (decisao:DECISAO {ref_id: $decisao_id})
      MATCH (evento:EVENTO {ref_id: $evento_id})
      CREATE (decisao)-[r:CAUSADA_POR {
        created_at: datetime()
      }]->(evento)
      RETURN r
    `,
  },

  // ===== PATHFINDING =====
  pathfinding: {
    shortestPath: `
      MATCH caminho = shortestPath(
        (origem {ref_id: $origem_id})
        -[*1..10]->(destino {ref_id: $destino_id})
      )
      RETURN [n IN nodes(caminho) | n.ref_id] AS path,
             length(caminho) AS profundidade,
             [r IN relationships(caminho) | type(r)] AS tipos_relacao
    `,

    cascata: `
      MATCH (evento:EVENTO {ref_id: $evento_id})
      CALL apoc.path.expandConfig({
        startNode: evento,
        relationshipFilter: '',
        maxLevel: $max_nivel
      })
      YIELD path
      UNWIND nodes(path) AS nodo
      RETURN DISTINCT nodo.tipo AS tipo_nodo, COUNT(*) AS quantidade
    `,

    allImpacts: `
      MATCH (evento:EVENTO {ref_id: $evento_id})
      MATCH (evento)-[*1..5]->(impactado)
      RETURN DISTINCT
        labels(impactado)[0] AS tipo_impactado,
        impactado.ref_id AS id,
        length(shortestPath((evento)-[*]-(impactado))) AS distancia
      ORDER BY distancia ASC
    `,
  },

  // ===== ANALYTICS =====
  analytics: {
    graphMetrics: `
      MATCH (n)
      RETURN
        COUNT(n) AS total_nodes,
        COUNT(DISTINCT labels(n)[0]) AS tipos_unicos
      WITH *
      MATCH (r)--(-)
      RETURN total_nodes, tipos_unicos, COUNT(r) / 2 AS total_relationships
    `,

    centralidade: `
      MATCH (n)
      WITH n
      MATCH (n)-[r]->()
      RETURN n.ref_id, COUNT(r) AS grau_saida
      ORDER BY grau_saida DESC
      LIMIT 10
    `,

    componentes: `
      MATCH (n)
      WHERE NOT EXISTS((n)-->())
      AND NOT EXISTS((n)<--())
      RETURN COUNT(n) AS nodes_isolados
    `,
  },

  // ===== CLEANUP =====
  maintenance: {
    deleteAllNodes: `
      MATCH (n) DETACH DELETE n
    `,

    deleteNodeByRef: `
      MATCH (n {ref_id: $ref_id}) DETACH DELETE n
    `,

    createIndexes: `
      CREATE INDEX IF NOT EXISTS FOR (n:EVENTO) ON (n.ref_id);
      CREATE INDEX IF NOT EXISTS FOR (n:OBJETIVO) ON (n.ref_id);
      CREATE INDEX IF NOT EXISTS FOR (n:DECISAO) ON (n.ref_id);
      CREATE INDEX IF NOT EXISTS FOR (n:EVENTO) ON (n.obra_id);
      CREATE INDEX IF NOT EXISTS FOR (n:OBJETIVO) ON (n.obra_id);
    `,
  },
};

/**
 * Exemplo de uso:
 *
 * // SQL
 * const unsyncedEvents = await postgres_pool.query(
 *   SQL.events.selectUnsyncedEvents,
 *   [50] // batch size
 * );
 *
 * // Cypher
 * const session = neo4j_driver.session();
 * await session.run(CYPHER.nodes.createEventoNode(), {
 *   ref_id: evento.id,
 *   tipo_evento: evento.type,
 *   // ...
 * });
 */
