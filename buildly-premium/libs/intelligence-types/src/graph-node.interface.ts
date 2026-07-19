/**
 * Graph Node Interfaces — Neo4j Representation
 *
 * Define como Events, Objectives, e Decisions são representados no grafo Neo4j.
 * Cada nó contém referência ao original mais metadados de relacionamento.
 */

export type NodeType =
  | 'EVENTO'
  | 'OBJETIVO'
  | 'DECISAO'
  | 'COLABORADOR'
  | 'EQUIPE'
  | 'FORNECEDOR'
  | 'ATIVIDADE'
  | 'RECURSO';

export type RelationType =
  | 'AMEACA'              // Evento ameaça Objetivo
  | 'AFETA'               // Evento afeta Atividade
  | 'MITIGADA_POR'        // Objetivo mitigado por Decisão
  | 'CAUSADA_POR'         // Decisão causada por Evento
  | 'RESPONSAVEL'         // Colaborador responsável por Objetivo
  | 'PARTICIPA'           // Colaborador participa de Decisão
  | 'FORNECE'             // Fornecedor fornece Recurso
  | 'DEPENDE_DE'          // Atividade depende de Atividade
  | 'RELACIONADA_A'       // Evento relacionado a Evento (causalidade)
  | 'CONTRIBUI_A'         // Objetivo contribui ao BMI
  | 'AFETA_DIMENSAO';     // Decisão afeta dimensão do BMI

export interface IGraphNode {
  id: string;                    // Neo4j node ID
  ref_id: string;                // Referência ao original (evento_id, objetivo_id, etc.)
  tipo: NodeType;
  timestamp_sincronizacao: string; // ISO 8601 do sync
  propriedades: Record<string, any>; // Metadados específicos do tipo
  score_relevancia?: number;     // 0-1, usado para ranking em queries
}

/**
 * Nó de Evento no Grafo
 */
export interface IEventoNode extends IGraphNode {
  tipo: 'EVENTO';
  propriedades: {
    tipo_evento: string;         // 'MATERIAL_DELAY', 'ACTIVITY_BLOCKED', etc.
    descricao: string;
    data_ocorrencia: string;
    obra_id: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    impacto_potencial: string;
  };
}

/**
 * Nó de Objetivo no Grafo
 */
export interface IObjetivoNode extends IGraphNode {
  tipo: 'OBJETIVO';
  propriedades: {
    nome: string;
    descricao: string;
    dominio: string;             // 'execucao', 'financeiro', etc.
    obra_id: string;
    status: string;              // 'PLANEJADO', 'EM_EXECUCAO', 'EM_RISCO', etc.
    progresso_percentual: number;
    data_alvo: string;
    valor_alvo_metrica: number;
    bmi_peso?: number;           // Peso na contribuição do BMI
  };
}

/**
 * Nó de Decisão no Grafo
 */
export interface IDecisaoNode extends IGraphNode {
  tipo: 'DECISAO';
  propriedades: {
    tipo_decisao: string;        // 'OPERACIONAL', 'ESTRATEGICA', etc.
    descricao: string;
    obra_id: string;
    evento_disparador_id: string;
    decisor: string;
    opcao_escolhida: string;
    custo_estimado: number;
    impacto_prazo_dias: number;
    risco: string;
    feedback_score?: number;
  };
}

/**
 * Nó de Colaborador no Grafo
 */
export interface IColaboradorNode extends IGraphNode {
  tipo: 'COLABORADOR';
  propriedades: {
    nome: string;
    cargo: string;
    empresa: string;
    score_desempenho?: number;   // 0-1, baseado no histórico
    decisoes_tomadas?: number;
    taxa_sucesso?: number;       // Feedback score médio
  };
}

/**
 * Relação no Grafo
 */
export interface IGraphRelationship {
  id: string;                    // Neo4j relationship ID
  tipo: RelationType;
  from_node_id: string;          // Node ID de origem
  to_node_id: string;            // Node ID de destino
  from_type: NodeType;
  to_type: NodeType;
  timestamp_criacao: string;
  propriedades?: {
    peso?: number;               // Para ponderação em pathfinding
    distancia?: number;          // Graus de separação
    confianca?: number;          // 0-1, força do relacionamento
  };
}

/**
 * Contexto de Relacionamento (para análise)
 */
export interface IRelationshipContext {
  relacionamento: IGraphRelationship;
  node_origem: IGraphNode;
  node_destino: IGraphNode;
  caminho_anterior?: IGraphNode[]; // Nós anteriores no pathfinding
  profundidade?: number;         // Nível no grafo
}

/**
 * Resultado de Pathfinding (cascata de eventos/impactos)
 */
export interface IPathfindingResult {
  caminho: IGraphNode[];         // Sequência de nós
  relacionamentos: IGraphRelationship[]; // Sequência de relações
  profundidade: number;          // Quantos graus de separação
  relevancia_total: number;      // Score agregado
  descricao: string;             // Narração em português
  exemplo?: string;              // Exemplo concreto
}

/**
 * Builder para GraphNode
 */
export class GraphNodeBuilder {
  private node: IGraphNode;

  constructor(ref_id: string, tipo: NodeType) {
    this.node = {
      id: '',                    // Será gerado pelo Neo4j
      ref_id,
      tipo,
      timestamp_sincronizacao: new Date().toISOString(),
      propriedades: {},
    };
  }

  withRelevancia(score: number): this {
    this.node.score_relevancia = Math.max(0, Math.min(1, score));
    return this;
  }

  withPropriedade(chave: string, valor: any): this {
    this.node.propriedades[chave] = valor;
    return this;
  }

  withPropriedades(props: Record<string, any>): this {
    this.node.propriedades = { ...this.node.propriedades, ...props };
    return this;
  }

  build(): IGraphNode {
    if (!this.node.ref_id) {
      throw new Error('ref_id é obrigatório para GraphNode');
    }
    return { ...this.node };
  }
}

/**
 * Builder para GraphRelationship
 */
export class GraphRelationshipBuilder {
  private rel: IGraphRelationship;

  constructor(
    tipo: RelationType,
    from_node_id: string,
    from_type: NodeType,
    to_node_id: string,
    to_type: NodeType
  ) {
    this.rel = {
      id: '',                    // Será gerado pelo Neo4j
      tipo,
      from_node_id,
      to_node_id,
      from_type,
      to_type,
      timestamp_criacao: new Date().toISOString(),
      propriedades: {},
    };
  }

  withPeso(peso: number): this {
    if (!this.rel.propriedades) this.rel.propriedades = {};
    this.rel.propriedades.peso = peso;
    return this;
  }

  withConfianca(confianca: number): this {
    if (!this.rel.propriedades) this.rel.propriedades = {};
    this.rel.propriedades.confianca = Math.max(0, Math.min(1, confianca));
    return this;
  }

  build(): IGraphRelationship {
    if (!this.rel.from_node_id || !this.rel.to_node_id) {
      throw new Error('from_node_id e to_node_id são obrigatórios');
    }
    return { ...this.rel };
  }
}
