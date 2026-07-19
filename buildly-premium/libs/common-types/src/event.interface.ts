/**
 * IEvent - O Evento: Átomo do Sistema Buildly
 *
 * Princípio: Imutabilidade e Contexto Completo
 * - Todo evento é append-only no Event Store
 - Todo evento carrega seu contexto de negócio
 * - Rastreabilidade completa para auditoria e conformidade
 */

export type EventType =
  | 'MATERIAL_DELAY'
  | 'ACTIVITY_COMPLETED'
  | 'ACTIVITY_BLOCKED'
  | 'RESOURCE_ALLOCATED'
  | 'RESOURCE_UNAVAILABLE'
  | 'FINANCIAL_VARIANCE'
  | 'SAFETY_INCIDENT'
  | 'QUALITY_ISSUE'
  | 'ENVIRONMENTAL_IMPACT'
  | 'DECISION_MADE'
  | 'FORECAST_UPDATED'
  | 'STAKEHOLDER_ALERT'
  | 'OBJECTIVE_CREATED'
  | 'OBJECTIVE_UPDATED'
  | 'OBJECTIVE_COMPLETED';

export type ModuleType =
  | 'governance'
  | 'engineering'
  | 'planning'
  | 'execution'
  | 'resources'
  | 'financial'
  | 'control'
  | 'documentation';

export type PriorityLevel = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';

export type EventSource = 'api' | 'mobile' | 'webhook' | 'sensor' | 'ai_inference' | 'batch_job';

export interface IEventOrigin {
  module: ModuleType;
  user_id: string;  // UUID
  source: EventSource;
  ip_address?: string;
  user_agent?: string;
}

export interface IEventContext {
  obra_id: string;                    // UUID - Obrigatório
  contrato_id?: string;               // UUID
  atividade_id?: string;              // UUID
  recurso_id?: string;                // UUID
  prioridade: PriorityLevel;
  impacto_potencial?: string;         // Descrição livre de impacto
  stakeholders_afetados?: string[];   // UUIDs de pessoas
}

export interface IEventRelationships {
  parent_event_id?: string;           // Qual evento causou este
  related_events?: string[];          // Outros eventos relacionados (IDs)
  cascade_triggers?: EventType[];     // Eventos que podem ser disparados por este
}

export interface IEventAudit {
  created_at: string;                 // ISO8601
  created_by: string;                 // UUID do usuário
  valid_from: string;                 // ISO8601 - Quando começa a valer
  valid_to?: string;                  // ISO8601 - Soft delete
}

export interface IEvent {
  // Identificação
  id: string;                         // UUID v4
  type: EventType;
  version: number;                    // Para versionamento e concorrência

  // Temporal
  timestamp: string;                  // ISO8601 - Quando foi registrado
  source_timestamp?: string;          // ISO8601 - Quando aconteceu realmente (se diferente)

  // Origem
  origin: IEventOrigin;

  // Contexto de Negócio
  context: IEventContext;

  // Dados Específicos do Evento
  data: Record<string, any>;

  // Relacionamentos Gráficos
  relationships?: IEventRelationships;

  // Auditoria
  audit: IEventAudit;
}

/**
 * Builder Pattern para criar eventos com validação
 */
export class EventBuilder {
  private event: Partial<IEvent> = {};

  constructor(id: string, type: EventType) {
    this.event.id = id;
    this.event.type = type;
    this.event.version = 1;
    this.event.timestamp = new Date().toISOString();
  }

  withOrigin(origin: IEventOrigin): this {
    this.event.origin = origin;
    return this;
  }

  withContext(context: IEventContext): this {
    this.event.context = context;
    return this;
  }

  withData(data: Record<string, any>): this {
    this.event.data = data;
    return this;
  }

  withRelationships(relationships: IEventRelationships): this {
    this.event.relationships = relationships;
    return this;
  }

  withAudit(audit: IEventAudit): this {
    this.event.audit = audit;
    return this;
  }

  build(): IEvent {
    if (!this.event.id || !this.event.type || !this.event.origin ||
        !this.event.context || !this.event.data || !this.event.audit) {
      throw new Error('IEvent está incompleto. Use todos os métodos with*()');
    }
    return this.event as IEvent;
  }
}

/**
 * Exemplo de uso:
 *
 * const evento = new EventBuilder(uuid(), 'MATERIAL_DELAY')
 *   .withOrigin({
 *     module: 'execution',
 *     user_id: 'usr_123',
 *     source: 'api'
 *   })
 *   .withContext({
 *     obra_id: 'obr_suzano',
 *     prioridade: 'CRITICA'
 *   })
 *   .withData({
 *     material: 'Cimento CP II',
 *     atraso_dias: 15,
 *     motivo: 'Greve'
 *   })
 *   .withAudit({
 *     created_at: new Date().toISOString(),
 *     created_by: 'usr_123',
 *     valid_from: new Date().toISOString()
 *   })
 *   .build();
 */
