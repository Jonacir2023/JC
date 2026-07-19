/**
 * IDecision - A Decisão: Registro de Escolhas com Aprendizado
 *
 * Princípio: Aprendizado Corporativo
 * - Toda decisão é registrada com contexto completo
 * - Previsão vs. Realidade é rastreada
 * - Feedback score permite ML training
 * - Histórico de decisões similares informa novas decisões
 */

export type DecisionType =
  | 'OPERACIONAL'      // Decisões de execução (ex: rescheduling)
  | 'ESTRATEGICA'      // Decisões de longo prazo (ex: mudança de escopo)
  | 'FINANCEIRA'       // Decisões de orçamento (ex: alocação de recursos)
  | 'RISCO'            // Decisões de mitigação de risco
  | 'RECURSOS'         // Decisões de alocação de recursos
  | 'QUALIDADE'        // Decisões de garantia de qualidade
  | 'SUSTENTABILIDADE' | // Decisões ESG
  'OUTRO';

export type DecisionMaker = 'HUMANO' | 'IA' | 'HIBRIDO';

export type RiskLevel = 'ALTO' | 'MEDIO' | 'BAIXO';

export interface IDecisionOpcao {
  id: string;                         // Identificador da opção
  descricao: string;                  // "Esperar material (15 dias)"
  custo_estimado: number;             // Em reais
  impacto_prazo: number;              // Dias adicionais/economizados
  risco: RiskLevel;
  prós?: string[];                    // Benefícios
  contras?: string[];                 // Desvantagens
}

export interface IDecisaoResultadoEsperado {
  economia: number;                   // Estimado em reais
  ganho_prazo: number;                // Dias economizados (negativo = atraso)
  satisfacao_esperada: number;        // 0.0 a 1.0
  justificativa?: string;
}

export interface IDecisaoResultadoReal {
  economia: number;                   // Valor real economizado
  ganho_prazo: number;                // Dias reais economizados
  satisfacao_real: number;            // 0.0 a 1.0 (feedback)
  licoes_aprendidas?: string;         // O que aprendemos?
  desvio_estimativa: {
    economia_variance: number;        // % de desvio
    prazo_variance: number;           // % de desvio
  };
}

export interface IDecision {
  // Identificação
  id: string;                         // UUID
  tipo: DecisionType;
  version: number;

  // Contexto
  obra_id: string;                    // UUID
  evento_disparador_id: string;       // UUID do evento que causou decisão
  timestamp: string;                  // ISO8601 - Quando foi tomada

  // Contexto de Negócio
  contexto_workspace: {
    stakeholders: string[];           // UUIDs de pessoas envolvidas
    prioridade_negocio: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
    deadline?: string;                // ISO8601 - Se há deadline
  };

  // Opções Avaliadas
  opcoes_avaliadas: IDecisionOpcao[];
  opcao_escolhida_id: string;         // ID da opção selecionada

  // Quem Decidiu?
  decisor: DecisionMaker;
  decidido_por: string;               // UUID do usuário (se humano) ou ID da IA
  consenso?: boolean;                 // Houve consenso?

  // Previsão vs. Realidade
  resultado_esperado: IDecisaoResultadoEsperado;
  resultado_real?: IDecisaoResultadoReal;

  // Aprendizado & Feedback
  feedback_score: number;             // -1.0 (péssima) a +1.0 (ótima) - undefined se ainda não concluído
  feedback_comentario?: string;
  data_conclusao?: string;            // ISO8601 - Quando foi concluído

  // Rastreabilidade
  criado_em: string;                  // ISO8601
  criado_por: string;                 // UUID
  atualizado_em: string;
  atualizado_por?: string;

  // Relacionamentos
  decisoes_relacionadas?: string[];   // Outras decisões similares/relacionadas
  atividades_disparadas?: string[];   // Atividades criadas por esta decisão
}

/**
 * Use Case: Decisão de Rescheduling após atraso de material
 *
 * Evento Disparador: MATERIAL_DELAY (cimento atrasado 15 dias)
 * Opções:
 *   1. Esperar (custo: R$150k, prazo: +15 dias, risco: ALTO)
 *   2. Importar (custo: R$225k, prazo: +3 dias, risco: MEDIO)
 *   3. Reordenar (custo: R$50k, prazo: +7 dias, risco: BAIXO) ← ESCOLHIDA
 *
 * Resultado Esperado: R$100k economia, +8 dias ganho
 * Resultado Real (após 30 dias): R$105k economia, +9 dias ganho, satisfação: 0.92
 * Feedback Score: +0.95 (excelente!)
 */

export class DecisionBuilder {
  private decision: Partial<IDecision> = {};

  constructor(id: string, obra_id: string, evento_disparador_id: string, tipo: DecisionType) {
    this.decision.id = id;
    this.decision.obra_id = obra_id;
    this.decision.evento_disparador_id = evento_disparador_id;
    this.decision.tipo = tipo;
    this.decision.version = 1;
    this.decision.timestamp = new Date().toISOString();
    this.decision.opcoes_avaliadas = [];
  }

  withContextoWorkspace(contexto: IDecision['contexto_workspace']): this {
    this.decision.contexto_workspace = contexto;
    return this;
  }

  addOpcao(opcao: IDecisionOpcao): this {
    if (!this.decision.opcoes_avaliadas) {
      this.decision.opcoes_avaliadas = [];
    }
    this.decision.opcoes_avaliadas.push(opcao);
    return this;
  }

  withOpcaoEscolhida(opcao_id: string): this {
    this.decision.opcao_escolhida_id = opcao_id;
    return this;
  }

  withDecisao(decisor: DecisionMaker, decidido_por: string, consenso?: boolean): this {
    this.decision.decisor = decisor;
    this.decision.decidido_por = decidido_por;
    this.decision.consenso = consenso;
    return this;
  }

  withResultadoEsperado(resultado: IDecisaoResultadoEsperado): this {
    this.decision.resultado_esperado = resultado;
    return this;
  }

  withResultadoReal(resultado: IDecisaoResultadoReal): this {
    this.decision.resultado_real = resultado;
    return this;
  }

  withFeedback(score: number, comentario?: string): this {
    if (score < -1.0 || score > 1.0) {
      throw new Error('Feedback score deve estar entre -1.0 e +1.0');
    }
    this.decision.feedback_score = score;
    this.decision.feedback_comentario = comentario;
    this.decision.data_conclusao = new Date().toISOString();
    return this;
  }

  withRastreabilidade(criado_por: string, atualizado_por?: string): this {
    this.decision.criado_em = new Date().toISOString();
    this.decision.criado_por = criado_por;
    this.decision.atualizado_em = new Date().toISOString();
    this.decision.atualizado_por = atualizado_por;
    return this;
  }

  build(): IDecision {
    if (!this.decision.id || !this.decision.obra_id || !this.decision.evento_disparador_id ||
        !this.decision.tipo || !this.decision.contexto_workspace ||
        !this.decision.opcoes_avaliadas || this.decision.opcoes_avaliadas.length === 0 ||
        !this.decision.opcao_escolhida_id || !this.decision.decisor ||
        !this.decision.decidido_por || !this.decision.resultado_esperado ||
        !this.decision.criado_por) {
      throw new Error('IDecision está incompleta. Use todos os métodos with*()');
    }

    return this.decision as IDecision;
  }
}

/**
 * Exemplo de uso completo:
 *
 * const decisao = new DecisionBuilder(
 *   uuid(),
 *   'obr_suzano',
 *   'evt_material_delay_123',
 *   'OPERACIONAL'
 * )
 *   .withContextoWorkspace({
 *     stakeholders: ['usr_eng_chefe', 'usr_fornecedor', 'usr_financeiro'],
 *     prioridade_negocio: 'CRITICA'
 *   })
 *   .addOpcao({
 *     id: 'opt_1',
 *     descricao: 'Esperar material (15 dias)',
 *     custo_estimado: 150000,
 *     impacto_prazo: 15,
 *     risco: 'ALTO'
 *   })
 *   .addOpcao({
 *     id: 'opt_2',
 *     descricao: 'Importar de outro fornecedor (+50% custo)',
 *     custo_estimado: 225000,
 *     impacto_prazo: 3,
 *     risco: 'MEDIO'
 *   })
 *   .addOpcao({
 *     id: 'opt_3',
 *     descricao: 'Pausar atividade B, reordenar sequência',
 *     custo_estimado: 50000,
 *     impacto_prazo: 7,
 *     risco: 'BAIXO'
 *   })
 *   .withOpcaoEscolhida('opt_3')
 *   .withDecisao('HIBRIDO', 'usr_eng_chefe', true)
 *   .withResultadoEsperado({
 *     economia: 100000,
 *     ganho_prazo: 8,
 *     satisfacao_esperada: 0.85
 *   })
 *   .withRastreabilidade('usr_eng_chefe')
 *   .build();
 */
