/**
 * IObjective - O Objetivo: Unidade de Medida de Progresso
 *
 * Princípio: Tudo é rastreável
 * - Um objetivo é uma meta mensurável da obra
 * - Objetivos se relacionam com eventos, atividades e decisões
 * - Contribuem para o cálculo do BMI (Buildly Maturity Index)
 */

export type ObjectiveStatus =
  | 'PLANEJADO'    // Ainda não iniciou
  | 'EM_EXECUCAO'  // Em andamento
  | 'CONCLUIDO'    // Atingiu meta
  | 'ATRASADO'     // Ultrapassou data alvo sem conclusão
  | 'EM_RISCO'     // Pode não ser atingido
  | 'CANCELADO';   // Cancelado propositalmente

export type ObjectiveDomain =
  | 'governanca'
  | 'engenharia'
  | 'planejamento'
  | 'execucao'
  | 'recursos'
  | 'financeiro'
  | 'risco'
  | 'sustentabilidade';

export type MetricaUnidade = '%' | 'dias' | 'horas' | 'reais' | 'unidades' | 'pessoas' | 'toneladas';

export interface IMetricaPrincipal {
  nome: string;                       // "% de conclusão", "Dias de atraso", etc
  valor_alvo: number;                 // Meta numérica
  valor_atual: number;                // Valor atual
  unidade: MetricaUnidade;
  tolerancia_minima?: number;         // Limite aceitável (ex: 5% abaixo)
}

export interface IBMIContribuicao {
  dimensao: string;                   // Qual dimensão do BMI?
  peso: number;                       // Peso dessa métrica (0-1)
  score_atual: number;                // Score calculado (0-100)
}

export interface IObjective {
  // Identificação
  id: string;                         // UUID
  obra_id: string;                    // UUID - A qual obra pertence
  version: number;                    // Para versionamento

  // Descrição
  nome: string;                       // "Concretar Bloco A até 15 de agosto"
  descricao?: string;                 // Contexto e motivação
  dominio: ObjectiveDomain;           // Categoria de objetivo

  // Métrica Principal
  metrica_principal: IMetricaPrincipal;

  // Temporal
  data_criacao: string;               // ISO8601
  data_inicio: string;                // ISO8601 - Quando deve iniciar
  data_alvo: string;                  // ISO8601 - Quando deve terminar
  data_conclusao?: string;            // ISO8601 - Quando foi concluído (se applicable)

  // Status & Progresso
  status: ObjectiveStatus;
  progresso_percentual: number;       // 0-100

  // Relacionamentos
  atividades_relacionadas: string[];  // UUIDs de atividades
  eventos_relacionados: string[];     // UUIDs de eventos que o afetaram
  decisoes_relacionadas: string[];    // UUIDs de decisões tomadas

  // Contribuição ao BMI
  contribuicao_ao_bmi: IBMIContribuicao;

  // Auditoria
  criado_por: string;                 // UUID do usuário
  criado_em: string;                  // ISO8601
  atualizado_em: string;              // ISO8601
  atualizado_por?: string;            // UUID do último atualizador
}

/**
 * Exemplos de Objetivos por Domínio:
 *
 * Execução:
 *   "Concluir Bloco A com qualidade excelente até 31 de agosto"
 *
 * Financeiro:
 *   "Manter variância de custos dentro de 5% até fim de Q3"
 *
 * Risco:
 *   "Zero acidentes graves (tipo 3+) durante toda a obra"
 *
 * Sustentabilidade:
 *   "Reciclar 80% dos resíduos de concreto até fim de obra"
 *
 * Governança:
 *   "100% das reuniões de RUP ocorrem conforme calendário"
 */

export class ObjectiveBuilder {
  private objective: Partial<IObjective> = {};

  constructor(id: string, obra_id: string, nome: string, dominio: ObjectiveDomain) {
    this.objective.id = id;
    this.objective.obra_id = obra_id;
    this.objective.nome = nome;
    this.objective.dominio = dominio;
    this.objective.version = 1;
    this.objective.data_criacao = new Date().toISOString();
    this.objective.status = 'PLANEJADO';
    this.objective.progresso_percentual = 0;
    this.objective.atividades_relacionadas = [];
    this.objective.eventos_relacionados = [];
    this.objective.decisoes_relacionadas = [];
  }

  withDescricao(descricao: string): this {
    this.objective.descricao = descricao;
    return this;
  }

  withMetricaPrincipal(metrica: IMetricaPrincipal): this {
    this.objective.metrica_principal = metrica;
    return this;
  }

  withDatas(data_inicio: string, data_alvo: string): this {
    this.objective.data_inicio = data_inicio;
    this.objective.data_alvo = data_alvo;
    return this;
  }

  withCriadoPor(user_id: string): this {
    this.objective.criado_por = user_id;
    return this;
  }

  withBMIContribuicao(contribuicao: IBMIContribuicao): this {
    this.objective.contribuicao_ao_bmi = contribuicao;
    return this;
  }

  build(): IObjective {
    if (!this.objective.id || !this.objective.obra_id || !this.objective.nome ||
        !this.objective.dominio || !this.objective.metrica_principal ||
        !this.objective.data_inicio || !this.objective.data_alvo ||
        !this.objective.criado_por || !this.objective.contribuicao_ao_bmi) {
      throw new Error('IObjective está incompleto. Use todos os métodos with*()');
    }

    // Defaults
    if (!this.objective.atualizado_em) {
      this.objective.atualizado_em = new Date().toISOString();
    }

    return this.objective as IObjective;
  }
}

/**
 * Exemplo de uso:
 *
 * const objetivo = new ObjectiveBuilder(
 *   uuid(),
 *   'obr_suzano',
 *   'Concluir Bloco A com qualidade excelente',
 *   'execucao'
 * )
 *   .withDescricao('Alcançar 100% de conclusão com zero defeitos críticos')
 *   .withMetricaPrincipal({
 *     nome: '% de conclusão',
 *     valor_alvo: 100,
 *     valor_atual: 0,
 *     unidade: '%'
 *   })
 *   .withDatas('2026-07-20', '2026-08-31')
 *   .withCriadoPor('usr_123')
 *   .withBMIContribuicao({
 *     dimensao: 'execucao',
 *     peso: 0.35,
 *     score_atual: 0
 *   })
 *   .build();
 */
