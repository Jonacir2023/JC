import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # Tenant — Multi-tenancy support
  type Tenant {
    id: String!
    name: String!
    slug: String!
    created_at: String!
    owner_id: String!
    subscription_tier: SubscriptionTier!
    is_active: Boolean!
  }

  # RDO Event
  type RDOEvent {
    id: String!
    tenant_id: String!
    obra_id: String!
    tipo: String!
    descricao: String!
    criador: String!
    data_evento: String!
    created_at: String!
  }

  # Pattern Detection Result
  type Pattern {
    id: String!
    tenant_id: String!
    obra_id: String!
    pattern_type: PatternType!
    confidence: Float!
    description: String!
    detected_at: String!
  }

  # Alert
  type Alert {
    id: String!
    tenant_id: String!
    rdo_id: String!
    pattern_type: PatternType!
    alert_severity: AlertSeverity!
    description: String!
    confidence: Float!
    recommended_action: String!
    effectiveness_score: Float
    created_at: String!
  }

  # Statistics for Obra
  type ObraStats {
    obra_id: String!
    total_events: Int!
    total_alerts: Int!
    patterns: PatternStats!
    effectiveness: EffectivenessStats!
  }

  type PatternStats {
    temporal: PatternCount!
    causal: PatternCount!
    cascade: PatternCount!
    resource: PatternCount!
  }

  type PatternCount {
    count: Int!
    avg_confidence: Float!
  }

  type EffectivenessStats {
    avg_score: Float!
    implementations: Int!
    success_rate: Float!
  }

  # Subscription
  type Subscription {
    tier: SubscriptionTier!
    max_obrasCount: Int!
    max_api_requests_per_month: Int!
    features: [String!]!
  }

  # Search Results
  type SearchResult {
    id: String!
    content: String!
    relevance_score: Float!
    pattern_type: PatternType!
    confidence: Float!
  }

  type SearchResponse {
    success: Boolean!
    results: [SearchResult!]!
    total_found: Int!
    execution_time_ms: Int!
  }

  # Enums
  enum PatternType {
    TEMPORAL
    CAUSAL
    CASCADE
    RESOURCE
  }

  enum AlertSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum SubscriptionTier {
    FREE
    PRO
    ENTERPRISE
  }

  # Queries
  type Query {
    # Tenant queries
    me: Tenant!
    tenants: [Tenant!]!
    tenant(id: String!): Tenant

    # Event queries
    events(obra_id: String!, limit: Int = 10, offset: Int = 0): [RDOEvent!]!
    event(id: String!): RDOEvent

    # Pattern queries
    patterns(obra_id: String!, pattern_type: PatternType): [Pattern!]!
    patternStats(pattern_type: PatternType!): [PatternCount!]!

    # Alert queries
    alerts(obra_id: String!, severity: AlertSeverity): [Alert!]!
    alertStats(obra_id: String!): ObraStats!

    # Search
    search(query: String!, obra_id: String!, limit: Int = 10): SearchResponse!
    searchAdvanced(
      query: String!
      obra_id: String!
      filters: SearchFiltersInput!
      limit: Int = 10
    ): SearchResponse!

    # Health
    health: HealthStatus!
  }

  input SearchFiltersInput {
    pattern_type: PatternType
    min_confidence: Float
    severity: AlertSeverity
    date_from: String
    date_to: String
  }

  type HealthStatus {
    status: String!
    timestamp: String!
    services: ServiceStatus!
    uptime_seconds: Int!
    version: String!
  }

  type ServiceStatus {
    database: String!
    neo4j: String!
    redis: String!
    qdrant: String!
  }

  # Mutations
  type Mutation {
    # Tenant mutations
    createTenant(name: String!, slug: String!): Tenant!
    updateTenant(id: String!, name: String, slug: String): Tenant!
    deleteTenant(id: String!): Boolean!

    # Event mutations
    createEvent(input: CreateEventInput!): RDOEvent!
    updateEvent(id: String!, input: UpdateEventInput!): RDOEvent!

    # Alert mutations
    recordAlertFeedback(
      alert_id: String!
      action_taken: String!
      effectiveness_achieved: Float
    ): Alert!

    # Subscription mutations
    upgradeSubscription(tenant_id: String!, tier: SubscriptionTier!): Subscription!
  }

  input CreateEventInput {
    obra_id: String!
    tipo: String!
    descricao: String!
    criador: String!
    data_evento: String!
  }

  input UpdateEventInput {
    tipo: String
    descricao: String
    criador: String
  }
`;
