export interface IEvent {
  id: string;
  event_type: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  version: number;
}

export interface IMaterialDelayEvent extends IEvent {
  material_id: string;
  delay_days: number;
  impact_brl: number;
  confidence_score: number;
}

export interface ICostOverrunEvent extends IEvent {
  cost_actual_brl: number;
  cost_budget_brl: number;
  overrun_percent: number;
}

export interface IScheduleDeviationEvent extends IEvent {
  actual_days: number;
  planned_days: number;
  deviation_percent: number;
}
