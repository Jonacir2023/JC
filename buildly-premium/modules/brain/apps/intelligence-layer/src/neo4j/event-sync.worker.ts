/**
 * Neo4j Event Sync Worker
 *
 * Sincroniza eventos do Event Store (PostgreSQL) para Neo4j Graph.
 * Executa continuamente via Bull.js job queue, convertendo IEvent em GraphNodes.
 *
 * Fluxo:
 * 1. Lê novo evento do Event Store
 * 2. Cria GraphNode para o evento
 * 3. Procura relacionamentos contextuais (outras entidades afetadas)
 * 4. Cria GraphRelationships
 * 5. Persiste no Neo4j
 * 6. Marca evento como sincronizado
 */

import { v4 as uuid } from 'uuid';
import {
  IGraphNode,
  IGraphRelationship,
  IEventoNode,
  IPathfindingResult,
  GraphNodeBuilder,
  GraphRelationshipBuilder,
} from '@buildly/intelligence-types';
import { IEvent, IObjective, IDecision } from '@buildly/common-types';

export interface IEventSyncConfig {
  neo4j_uri: string;
  neo4j_user: string;
  neo4j_password: string;
  postgres_connection_string: string;
  batch_size: number; // Quantidade de eventos por sync
  sync_interval_ms: number; // Intervalo de verificação
}

export interface ISyncResult {
  eventos_sincronizados: number;
  nodes_criados: number;
  relacionamentos_criados: number;
  erros: string[];
  duracao_ms: number;
}

/**
 * Serviço de sincronização de eventos para Neo4j
 */
export class EventSyncWorker {
  private config: IEventSyncConfig;
  private eventos_cache: Map<string, IEvent>; // Cache em memória de últimos eventos

  constructor(config: IEventSyncConfig) {
    this.config = config;
    this.eventos_cache = new Map();
  }

  /**
   * Executa um ciclo de sincronização
   * (Chamado periodicamente por Bull.js ou manualmente)
   */
  async executarSync(): Promise<ISyncResult> {
    const inicio = Date.now();
    const resultado: ISyncResult = {
      eventos_sincronizados: 0,
      nodes_criados: 0,
      relacionamentos_criados: 0,
      erros: [],
      duracao_ms: 0,
    };

    try {
      console.log('[EventSync] Iniciando sincronização com Neo4j...');

      // ========== PASSO 1: Recuperar eventos não sincronizados ==========
      const eventos_novos = await this.recuperarEventosNaoSincronizados(
        this.config.batch_size
      );

      if (eventos_novos.length === 0) {
        console.log('[EventSync] Nenhum evento novo para sincronizar');
        resultado.duracao_ms = Date.now() - inicio;
        return resultado;
      }

      console.log(`[EventSync] Encontrados ${eventos_novos.length} eventos novos`);

      // ========== PASSO 2: Sincronizar cada evento ==========
      for (const evento of eventos_novos) {
        try {
          // Criar GraphNode para o evento
          const event_node = await this.criarEventoNode(evento);
          resultado.nodes_criados++;

          // Encontrar entidades relacionadas (objetivos, decisões, etc)
          const relacionamentos = await this.encontrarRelacionamentos(evento);

          // Persistir node + relacionamentos no Neo4j
          await this.persistirNoNeo4j(event_node, relacionamentos);
          resultado.relacionamentos_criados += relacionamentos.length;

          // Marcar como sincronizado
          await this.marcarEventoSincronizado(evento.id);

          resultado.eventos_sincronizados++;
          this.eventos_cache.set(evento.id, evento);

          console.log(
            `[EventSync] ✓ Evento ${evento.id} sincronizado (${relacionamentos.length} relacionamentos)`
          );
        } catch (erro) {
          resultado.erros.push(`Evento ${evento.id}: ${erro}`);
          console.error(`[EventSync] ✗ Erro sincronizando evento ${evento.id}:`, erro);
        }
      }

      resultado.duracao_ms = Date.now() - inicio;

      console.log(`
[EventSync] ✅ Sincronização completa
  - Eventos: ${resultado.eventos_sincronizados}
  - Nós criados: ${resultado.nodes_criados}
  - Relacionamentos: ${resultado.relacionamentos_criados}
  - Erros: ${resultado.erros.length}
  - Tempo: ${resultado.duracao_ms}ms
      `);

      return resultado;
    } catch (erro) {
      resultado.erros.push(`Erro geral de sincronização: ${erro}`);
      resultado.duracao_ms = Date.now() - inicio;
      throw erro;
    }
  }

  /**
   * Recupera eventos que ainda não foram sincronizados para Neo4j
   */
  private async recuperarEventosNaoSincronizados(limit: number): Promise<IEvent[]> {
    // TODO: Conectar ao PostgreSQL Event Store
    // Consulta exemplo:
    // SELECT * FROM events
    // WHERE synced_to_neo4j = false
    // ORDER BY created_at ASC
    // LIMIT ?

    // Placeholder para demo
    console.log('[EventSync] (PLACEHOLDER) Buscando eventos não sincronizados do PostgreSQL');
    return [];
  }

  /**
   * Cria um GraphNode a partir de um IEvent
   */
  private async criarEventoNode(evento: IEvent): Promise<IEventoNode> {
    const builder = new GraphNodeBuilder(evento.id, 'EVENTO') as any;

    const node: IEventoNode = {
      id: `node_${uuid()}`, // Será substituído por ID do Neo4j
      ref_id: evento.id,
      tipo: 'EVENTO',
      timestamp_sincronizacao: new Date().toISOString(),
      propriedades: {
        tipo_evento: evento.type,
        descricao: evento.context?.impacto_potencial || 'Sem descrição',
        data_ocorrencia: evento.timestamp,
        obra_id: evento.context?.obra_id || '',
        prioridade: evento.context?.prioridade || 'MEDIA',
        impacto_potencial: evento.context?.impacto_potencial || '',
      },
      score_relevancia: 1.0, // Eventos são sempre relevantes
    };

    return node;
  }

  /**
   * Encontra todas as entidades relacionadas a um evento
   * (Objetivos ameaçados, atividades afetadas, decisões tomadas, etc)
   */
  private async encontrarRelacionamentos(evento: IEvent): Promise<IGraphRelationship[]> {
    const relacionamentos: IGraphRelationship[] = [];

    // TODO: Conectar a banco de dados para encontrar:
    // 1. Objetivos que este evento ameaça (via IObjective.relacionamentos)
    // 2. Atividades que este evento afeta (via cronograma)
    // 3. Decisões que este evento disparou (via IDecision.evento_disparador_id)
    // 4. Colaboradores impactados (via responsáveis dos objetivos)

    // Placeholder: simular algumas relações baseadas no tipo de evento
    if (evento.type === 'MATERIAL_DELAY') {
      // Criar relacionamento: EVENTO -[AMEACA]-> OBJETIVO (Bloco A)
      const rel_ameaca = new GraphRelationshipBuilder(
        'AMEACA',
        `node_${evento.id}`,
        'EVENTO',
        'node_obj_bloco_a', // Placeholder
        'OBJETIVO'
      )
        .withConfianca(0.95)
        .withPeso(1.0)
        .build();

      relacionamentos.push(rel_ameaca);

      // Criar relacionamento: EVENTO -[AFETA]-> ATIVIDADE (Assentar blocos)
      const rel_afeta = new GraphRelationshipBuilder(
        'AFETA',
        `node_${evento.id}`,
        'EVENTO',
        'node_atv_assentar_blocos', // Placeholder
        'ATIVIDADE'
      )
        .withConfianca(0.92)
        .withPeso(0.8)
        .build();

      relacionamentos.push(rel_afeta);
    }

    return relacionamentos;
  }

  /**
   * Persiste node e relacionamentos no Neo4j
   */
  private async persistirNoNeo4j(
    node: IEventoNode,
    relacionamentos: IGraphRelationship[]
  ): Promise<void> {
    // TODO: Conectar ao Neo4j e executar Cypher:
    // 1. CREATE (n:EVENTO {id, type_evento, timestamp, ...})
    // 2. CREATE (n)-[r:AMEACA]->(m) para cada relacionamento
    // 3. CREATE INDEX se necessário

    // Placeholder para demo
    console.log(`[EventSync] (PLACEHOLDER) Persistindo node ${node.ref_id} no Neo4j`);
    console.log(`[EventSync] (PLACEHOLDER) Criando ${relacionamentos.length} relacionamentos`);
  }

  /**
   * Marca um evento como já sincronizado
   */
  private async marcarEventoSincronizado(evento_id: string): Promise<void> {
    // TODO: Conectar ao PostgreSQL e atualizar:
    // UPDATE events SET synced_to_neo4j = true, synced_at = NOW()
    // WHERE id = evento_id

    console.log(`[EventSync] (PLACEHOLDER) Marcando evento ${evento_id} como sincronizado`);
  }

  /**
   * Executa pathfinding para detectar cascatas
   * (Método auxiliar para análise pós-sync)
   */
  async detectarCascatas(evento_id: string): Promise<IPathfindingResult | null> {
    // TODO: Executar Cypher query:
    // MATCH caminho = (evento:EVENTO {ref_id: ?})
    //       -[*1..5]->(impactados)
    // RETURN caminho, length(caminho) AS profundidade
    // ORDER BY profundidade DESC
    // LIMIT 1

    // Placeholder
    console.log(
      `[EventSync] (PLACEHOLDER) Detectando cascatas do evento ${evento_id}`
    );
    return null;
  }

  /**
   * Recalcula métricas do grafo (densidade, centralidade, etc)
   */
  async recalcularMetricasGrafo(): Promise<void> {
    // TODO: Executar queries de análise no Neo4j:
    // 1. Contar nós por tipo
    // 2. Contar relacionamentos por tipo
    // 3. Calcular centralidade (betweenness, closeness)
    // 4. Detectar componentes desconectados
    // 5. Salvar métricas em cache/banco

    console.log('[EventSync] (PLACEHOLDER) Recalculando métricas do grafo');
  }
}

/**
 * Exemplo de uso:
 *
 * const worker = new EventSyncWorker({
 *   neo4j_uri: 'bolt://localhost:7687',
 *   neo4j_user: 'neo4j',
 *   neo4j_password: 'password',
 *   postgres_connection_string: 'postgresql://...',
 *   batch_size: 50,
 *   sync_interval_ms: 60000, // 1 min
 * });
 *
 * // Executar uma vez
 * const resultado = await worker.executarSync();
 * console.log(`Sincronizados ${resultado.eventos_sincronizados} eventos`);
 *
 * // Ou agendar para rodar periodicamente (via Bull.js)
 * const queue = new Queue('event-sync');
 * queue.process(async () => {
 *   return await worker.executarSync();
 * });
 *
 * // Agendar para rodar a cada minuto
 * queue.add({}, { repeat: { every: 60000 } });
 */
