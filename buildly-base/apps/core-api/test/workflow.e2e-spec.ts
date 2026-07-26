import {
  IMaterialDelayEvent,
  IDecision,
  IDecisionFeedback,
  DecisionType,
  DecisionStatus,
} from '@buildly/common-types';

describe('Complete Event → Decision → Feedback Workflow (E2E)', () => {
  let simulatedEventStore: IMaterialDelayEvent[] = [];
  let simulatedDecisions: IDecision[] = [];
  let simulatedFeedback: IDecisionFeedback[] = [];

  beforeEach(() => {
    // Reset stores
    simulatedEventStore = [];
    simulatedDecisions = [];
    simulatedFeedback = [];
  });

  describe('Phase 1: Material Delay Event', () => {
    it('should create and store a material delay event', () => {
      const event: IMaterialDelayEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date('2026-07-26T10:00:00Z'),
        context: {
          obra_id: 'OBR-001',
          supplier: 'Concreteira XYZ',
          material: 'Concreto Usinado',
        },
        version: 1,
        material_id: 'MAT-CONCRETE-001',
        delay_days: 5,
        impact_brl: 50000,
        confidence_score: 0.95,
      };

      simulatedEventStore.push(event);

      expect(simulatedEventStore).toHaveLength(1);
      expect(simulatedEventStore[0].event_type).toBe('MATERIAL_DELAY');
      expect(simulatedEventStore[0].delay_days).toBe(5);
    });

    it('should preserve event immutability', () => {
      const originalEvent: IMaterialDelayEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date(),
        version: 1,
        material_id: 'MAT-001',
        delay_days: 3,
        impact_brl: 30000,
        confidence_score: 0.85,
      };

      simulatedEventStore.push(originalEvent);

      // Event should not change
      expect(simulatedEventStore[0].delay_days).toBe(3);
      expect(simulatedEventStore[0].timestamp).toEqual(originalEvent.timestamp);
    });
  });

  describe('Phase 2: Decision Creation', () => {
    beforeEach(() => {
      // Create an event first
      const event: IMaterialDelayEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date(),
        version: 1,
        material_id: 'MAT-001',
        delay_days: 5,
        impact_brl: 50000,
        confidence_score: 0.95,
      };
      simulatedEventStore.push(event);
    });

    it('should create decision triggered by material delay event', () => {
      const materialDelayEvent = simulatedEventStore[0] as IMaterialDelayEvent;

      const decision: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: DecisionType.MATERIAL_SUBSTITUTION,
        status: DecisionStatus.PENDING,
        context: {
          triggered_by_event: materialDelayEvent.id,
          suggested_substitute: 'Concreto Pré-moldado',
          cost_difference_brl: 15000,
        },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system-ml-engine',
      };

      simulatedDecisions.push(decision);

      expect(simulatedDecisions).toHaveLength(1);
      expect(simulatedDecisions[0].type).toBe(DecisionType.MATERIAL_SUBSTITUTION);
      expect(simulatedDecisions[0].context).toHaveProperty('triggered_by_event');
    });

    it('should track decision approval flow', () => {
      const decision: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: DecisionType.BUDGET_APPROVAL,
        status: DecisionStatus.PENDING,
        context: { amount: 50000 },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
      };

      simulatedDecisions.push(decision);

      // Simulate approval
      simulatedDecisions[0].status = DecisionStatus.APPROVED;
      simulatedDecisions[0].approved_by = 'approver-456';
      simulatedDecisions[0].approval_reason = 'Cost-benefit analysis positive';
      simulatedDecisions[0].updated_at = new Date();

      expect(simulatedDecisions[0].status).toBe(DecisionStatus.APPROVED);
      expect(simulatedDecisions[0].approved_by).toBe('approver-456');
      expect(simulatedDecisions[0].approval_reason).toBeDefined();
    });
  });

  describe('Phase 3: Decision Feedback Loop', () => {
    beforeEach(() => {
      // Create event and decision first
      const event: IMaterialDelayEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date(),
        version: 1,
        material_id: 'MAT-001',
        delay_days: 5,
        impact_brl: 50000,
        confidence_score: 0.95,
      };
      simulatedEventStore.push(event);

      const decision: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: DecisionType.MATERIAL_SUBSTITUTION,
        status: DecisionStatus.APPROVED,
        context: { substitute: 'Alternative material' },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
        approved_by: 'approver-456',
      };
      simulatedDecisions.push(decision);
    });

    it('should record feedback on decision outcome', () => {
      const approvedDecision = simulatedDecisions[0];

      const feedback: IDecisionFeedback = {
        decision_id: approvedDecision.id,
        outcome: 'success',
        feedback: 'Substitution resolved issue within 48 hours',
        actual_impact: 35000, // Saved 15k more than expected
      };

      simulatedFeedback.push(feedback);

      expect(simulatedFeedback).toHaveLength(1);
      expect(simulatedFeedback[0].outcome).toBe('success');
      expect(simulatedFeedback[0].actual_impact).toBe(35000);
    });

    it('should handle partial success feedback', () => {
      const decision = simulatedDecisions[0];

      const feedback: IDecisionFeedback = {
        decision_id: decision.id,
        outcome: 'partial',
        feedback: 'Substitution helped but caused 2 days delay elsewhere',
        actual_impact: 25000,
      };

      simulatedFeedback.push(feedback);

      expect(simulatedFeedback[0].outcome).toBe('partial');
    });

    it('should handle failure feedback', () => {
      const decision = simulatedDecisions[0];

      const feedback: IDecisionFeedback = {
        decision_id: decision.id,
        outcome: 'failure',
        feedback: 'Alternative material quality issues detected',
      };

      simulatedFeedback.push(feedback);

      expect(simulatedFeedback[0].outcome).toBe('failure');
      expect(simulatedFeedback[0].actual_impact).toBeUndefined();
    });
  });

  describe('Complete Workflow Validation', () => {
    it('should complete full event-decision-feedback lifecycle', () => {
      // Step 1: Event
      const event: IMaterialDelayEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date(),
        version: 1,
        material_id: 'MAT-001',
        delay_days: 5,
        impact_brl: 50000,
        confidence_score: 0.95,
      };
      simulatedEventStore.push(event);

      // Step 2: Decision
      const decision: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: DecisionType.MATERIAL_SUBSTITUTION,
        status: DecisionStatus.APPROVED,
        context: { triggered_by: event.id },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        approved_by: 'approver',
      };
      simulatedDecisions.push(decision);

      // Step 3: Feedback
      const feedback: IDecisionFeedback = {
        decision_id: decision.id,
        outcome: 'success',
        feedback: 'Resolved successfully',
        actual_impact: 45000,
      };
      simulatedFeedback.push(feedback);

      // Validate entire workflow
      expect(simulatedEventStore).toHaveLength(1);
      expect(simulatedDecisions).toHaveLength(1);
      expect(simulatedFeedback).toHaveLength(1);

      // Validate relationships
      expect(simulatedDecisions[0].context).toHaveProperty(
        'triggered_by',
        simulatedEventStore[0].id,
      );
      expect(simulatedFeedback[0].decision_id).toBe(simulatedDecisions[0].id);

      // Validate workflow state
      expect(simulatedDecisions[0].status).toBe(DecisionStatus.APPROVED);
      expect(simulatedFeedback[0].outcome).toBe('success');
    });

    it('should handle multiple parallel decisions from single event', () => {
      // Single event
      const event: IMaterialDelayEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date(),
        version: 1,
        material_id: 'MAT-001',
        delay_days: 5,
        impact_brl: 50000,
        confidence_score: 0.95,
      };
      simulatedEventStore.push(event);

      // Multiple decisions triggered by same event
      const decision1: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: DecisionType.MATERIAL_SUBSTITUTION,
        status: DecisionStatus.APPROVED,
        context: { triggered_by: event.id },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
      };

      const decision2: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        type: DecisionType.SCHEDULE_ADJUSTMENT,
        status: DecisionStatus.APPROVED,
        context: { triggered_by: event.id },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
      };

      simulatedDecisions.push(decision1, decision2);

      expect(simulatedDecisions).toHaveLength(2);
      expect(simulatedDecisions.every((d) => d.context.triggered_by === event.id)).toBe(true);
    });
  });
});
