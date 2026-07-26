import { HealthService } from '../src/health.service';
import {
  IDecision,
  DecisionType,
  DecisionStatus,
} from '@buildly/common-types';

describe('Performance & Load Tests', () => {
  const healthService = new HealthService();

  describe('Health Check Performance', () => {
    it('should respond to health check in < 5ms', () => {
      const start = performance.now();
      const result = healthService.check();
      const elapsed = performance.now() - start;

      expect(result.status).toBe('UP');
      expect(elapsed).toBeLessThan(5);
    });

    it('should handle 1000 sequential health checks', () => {
      const start = performance.now();
      const results = [];

      for (let i = 0; i < 1000; i++) {
        results.push(healthService.check());
      }

      const elapsed = performance.now() - start;
      const avgTime = elapsed / 1000;

      expect(results).toHaveLength(1000);
      expect(avgTime).toBeLessThan(1); // Average < 1ms per check
      expect(elapsed).toBeLessThan(2000); // Total < 2 seconds for 1000 checks
    });

    it('should have consistent response structure', () => {
      const results = Array.from({ length: 100 }, () => healthService.check());

      results.forEach((result) => {
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('service');
        expect(result).toHaveProperty('version');
        expect(result).toHaveProperty('timestamp');
      });
    });
  });

  describe('Decision Creation Performance', () => {
    it('should create decision object in < 2ms', () => {
      const start = performance.now();

      const decision: IDecision = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: DecisionType.BUDGET_APPROVAL,
        status: DecisionStatus.PENDING,
        context: { budget: 100000, project: 'OBR-001' },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
      };

      const elapsed = performance.now() - start;

      expect(decision.id).toBeDefined();
      expect(elapsed).toBeLessThan(2);
    });

    it('should create 10000 decision objects efficiently', () => {
      const start = performance.now();
      const decisions: IDecision[] = [];

      for (let i = 0; i < 10000; i++) {
        decisions.push({
          id: `decision-${i}`,
          type: DecisionType.BUDGET_APPROVAL,
          status: DecisionStatus.PENDING,
          context: { index: i },
          created_at: new Date(),
          updated_at: new Date(),
          created_by: `user-${i % 10}`,
        });
      }

      const elapsed = performance.now() - start;
      const avgTime = elapsed / 10000;

      expect(decisions).toHaveLength(10000);
      expect(avgTime).toBeLessThan(0.5); // Average < 0.5ms per decision
      expect(elapsed).toBeLessThan(10000); // Total < 10 seconds for 10k decisions
    });
  });

  describe('Memory Usage Patterns', () => {
    it('should not have memory leaks in repeated operations', () => {
      const iterations = 1000;
      const baseline = process.memoryUsage();

      for (let i = 0; i < iterations; i++) {
        const decision: IDecision = {
          id: `decision-${i}`,
          type: DecisionType.BUDGET_APPROVAL,
          status: DecisionStatus.PENDING,
          context: { index: i, data: 'test'.repeat(100) },
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'user-123',
        };
        // Simulate usage without keeping reference
        JSON.stringify(decision);
      }

      const after = process.memoryUsage();
      const heapGrowth = (after.heapUsed - baseline.heapUsed) / 1024 / 1024;

      // Heap growth should be minimal (< 50MB for 1000 operations)
      expect(heapGrowth).toBeLessThan(50);
    });
  });

  describe('Concurrent Operation Simulation', () => {
    it('should handle concurrent decision state changes', async () => {
      const decisions: IDecision[] = Array.from({ length: 100 }, (_, i) => ({
        id: `decision-${i}`,
        type: DecisionType.BUDGET_APPROVAL,
        status: DecisionStatus.PENDING,
        context: { index: i },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: `user-${i % 5}`,
      }));

      const start = performance.now();

      // Simulate concurrent approvals
      const updates = decisions.map((decision) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            decision.status = DecisionStatus.APPROVED;
            decision.approved_by = 'approver-1';
            decision.updated_at = new Date();
            resolve();
          }, Math.random() * 10); // Random delay up to 10ms
        });
      });

      await Promise.all(updates);

      const elapsed = performance.now() - start;

      expect(decisions.every((d) => d.status === DecisionStatus.APPROVED)).toBe(true);
      expect(elapsed).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Scalability Indicators', () => {
    it('should demonstrate linear scalability', () => {
      const sizes = [100, 1000, 10000];
      const times: number[] = [];

      sizes.forEach((size) => {
        const start = performance.now();

        for (let i = 0; i < size; i++) {
          healthService.check();
        }

        times.push(performance.now() - start);
      });

      // Each 10x increase should mean roughly 10x time increase
      // But sub-millisecond operations may have overhead that doesn't scale linearly
      const ratio1 = times[1] / times[0];
      const ratio2 = times[2] / times[1];

      expect(ratio1).toBeLessThan(20); // Allow for variance
      expect(ratio2).toBeLessThan(20);
      expect(ratio1).toBeGreaterThan(2); // Should show some scaling
    });
  });
});
