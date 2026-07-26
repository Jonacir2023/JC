export enum DecisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

export enum DecisionType {
  BUDGET_APPROVAL = 'BUDGET_APPROVAL',
  MATERIAL_SUBSTITUTION = 'MATERIAL_SUBSTITUTION',
  SCHEDULE_ADJUSTMENT = 'SCHEDULE_ADJUSTMENT',
  RESOURCE_REALLOCATION = 'RESOURCE_REALLOCATION',
  COST_MITIGATION = 'COST_MITIGATION',
}

export interface IDecision {
  id: string;
  type: DecisionType;
  status: DecisionStatus;
  context: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  approved_by?: string;
  approval_reason?: string;
}

export interface IDecisionFeedback {
  decision_id: string;
  outcome: 'success' | 'failure' | 'partial';
  feedback: string;
  actual_impact?: number;
}
