import {
  IEvent,
  IMaterialDelayEvent,
  IDecision,
  DecisionStatus,
  DecisionType,
} from '@buildly/common-types';

describe('Integration with Common Types', () => {
  describe('Event Types', () => {
    it('should create valid MaterialDelayEvent', () => {
      const event: IMaterialDelayEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date(),
        context: { obra_id: 'OBR-001' },
        version: 1,
        material_id: 'MAT-001',
        delay_days: 5,
        impact_brl: 50000,
        confidence_score: 0.95,
      };

      expect(event.id).toBeDefined();
      expect(event.event_type).toBe('MATERIAL_DELAY');
      expect(event.delay_days).toBe(5);
      expect(event.confidence_score).toBe(0.95);
    });

    it('should validate event structure', () => {
      const event: IEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'MATERIAL_DELAY',
        timestamp: new Date(),
        version: 1,
      };

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('event_type');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('version');
    });
  });

  describe('Decision Types', () => {
    it('should create valid Decision', () => {
      const decision: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: DecisionType.BUDGET_APPROVAL,
        status: DecisionStatus.PENDING,
        context: { budget_requested: 100000 },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
      };

      expect(decision.id).toBeDefined();
      expect(decision.type).toBe(DecisionType.BUDGET_APPROVAL);
      expect(decision.status).toBe(DecisionStatus.PENDING);
    });

    it('should validate decision status enum', () => {
      const statuses = Object.values(DecisionStatus);
      expect(statuses).toContain('PENDING');
      expect(statuses).toContain('APPROVED');
      expect(statuses).toContain('REJECTED');
      expect(statuses).toContain('ESCALATED');
    });

    it('should validate decision type enum', () => {
      const types = Object.values(DecisionType);
      expect(types).toContain('BUDGET_APPROVAL');
      expect(types).toContain('MATERIAL_SUBSTITUTION');
      expect(types).toContain('SCHEDULE_ADJUSTMENT');
      expect(types).toContain('RESOURCE_REALLOCATION');
      expect(types).toContain('COST_MITIGATION');
    });

    it('should handle decision lifecycle', () => {
      const decision: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: DecisionType.COST_MITIGATION,
        status: DecisionStatus.PENDING,
        context: {},
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
      };

      // Simulate approval
      decision.status = DecisionStatus.APPROVED;
      decision.approved_by = 'approver-456';
      decision.updated_at = new Date();

      expect(decision.status).toBe(DecisionStatus.APPROVED);
      expect(decision.approved_by).toBe('approver-456');
      expect(decision.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('Type Safety', () => {
    it('should enforce type checking at compile time', () => {
      // This would fail TypeScript compilation if types are wrong
      const decision: IDecision = {
        id: 'test-id',
        type: DecisionType.BUDGET_APPROVAL,
        status: DecisionStatus.PENDING,
        context: { custom_field: 'value' },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
      };

      expect(decision.context).toHaveProperty('custom_field');
    });

    it('should allow optional fields in Decision', () => {
      const decision: IDecision = {
        id: 'test-id',
        type: DecisionType.BUDGET_APPROVAL,
        status: DecisionStatus.PENDING,
        context: {},
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
        // approved_by and approval_reason are optional
      };

      expect(decision.approved_by).toBeUndefined();
      expect(decision.approval_reason).toBeUndefined();
    });
  });
});
