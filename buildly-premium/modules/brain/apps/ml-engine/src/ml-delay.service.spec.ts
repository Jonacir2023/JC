import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MLDelayService } from './ml-delay.service';

describe('MLDelayService — Material Delay Prediction Pilot', () => {
  let service: MLDelayService;
  let mockDbPool: any;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockDbPool = {
      query: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MLDelayService,
        {
          provide: 'DB_POOL',
          useValue: mockDbPool,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<MLDelayService>(MLDelayService);
  });

  describe('predictMaterialDelays', () => {
    it('should return empty predictions when obra has no delays', async () => {
      const mockRows = [];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await service.predictMaterialDelays('obra-123', 7);

      expect(result.status).toBe('success');
      expect(result.data.predictions).toEqual([]);
      expect(result.data.summary.total_alerts).toBe(0);
    });

    it('should detect CRITICAL delays with high confidence', async () => {
      const mockRows = [
        {
          id: 'pred-1',
          obra_id: 'obra-123',
          material_id: 'mat-cimento',
          material_name: 'Cimento CP II',
          predicted_delay_days: 8,
          confidence: 0.78,
          severity: 'CRITICAL',
          predicted_date: '2026-08-02',
          recommended_action: 'Reordenar cronograma (risco crítico)',
          requires_approval: true,
        },
      ];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await service.predictMaterialDelays('obra-123', 7);

      expect(result.status).toBe('success');
      expect(result.data.predictions).toHaveLength(1);
      expect(result.data.predictions[0].severity).toBe('CRITICAL');
      expect(result.data.predictions[0].confidence).toBeGreaterThan(0.7);
      expect(result.data.summary.critical_alerts).toBe(1);
    });

    it('should filter predictions with low confidence (< 50%)', async () => {
      const mockRows = [
        {
          id: 'pred-1',
          obra_id: 'obra-123',
          material_id: 'mat-areia',
          material_name: 'Areia Média',
          predicted_delay_days: 2,
          confidence: 0.25,
          severity: 'LOW',
          predicted_date: '2026-08-01',
          recommended_action: 'Monitorar fornecedor',
          requires_approval: false,
        },
      ];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await service.predictMaterialDelays('obra-123', 7);

      expect(result.data.predictions).toHaveLength(1);
      expect(result.data.predictions[0].confidence).toBeLessThan(0.5);
    });

    it('should calculate financial impact correctly', async () => {
      const mockRows = [
        {
          id: 'pred-1',
          obra_id: 'obra-123',
          material_id: 'mat-aco',
          material_name: 'Aço CA-50',
          predicted_delay_days: 5,
          confidence: 0.8,
          severity: 'CRITICAL',
          predicted_date: '2026-08-01',
          recommended_action: 'Reordenar cronograma (risco crítico)',
          requires_approval: true,
        },
        {
          id: 'pred-2',
          obra_id: 'obra-123',
          material_id: 'mat-concreto',
          material_name: 'Concreto Usinado',
          predicted_delay_days: 3,
          confidence: 0.6,
          severity: 'HIGH',
          predicted_date: '2026-08-02',
          recommended_action: 'Adiantar pedido ou providenciar alternativa',
          requires_approval: true,
        },
      ];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await service.predictMaterialDelays('obra-123', 7);

      const { estimated_impact_brl } = result.data.summary;
      // CRITICAL (0.8 * 50000) + HIGH (0.6 * 25000) = 40000 + 15000 = 55000
      expect(estimated_impact_brl).toBeGreaterThan(40000);
      expect(estimated_impact_brl).toBeLessThan(60000);
    });

    it('should require approval for HIGH and CRITICAL predictions', async () => {
      const mockRows = [
        {
          id: 'pred-1',
          obra_id: 'obra-123',
          material_id: 'mat-steel',
          material_name: 'Aço',
          predicted_delay_days: 6,
          confidence: 0.7,
          severity: 'HIGH',
          predicted_date: '2026-08-01',
          recommended_action: 'Adiantar pedido ou providenciar alternativa',
          requires_approval: true,
        },
      ];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await service.predictMaterialDelays('obra-123', 7);

      expect(result.data.predictions[0].requires_approval).toBe(true);
    });

    it('should cache results for 24 hours', async () => {
      const mockRows = [];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      await service.predictMaterialDelays('obra-123', 7);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'ml:delay:obra-123:7',
        expect.any(Object),
        24 * 60 * 60 * 1000,
      );
    });

    it('should return cached result on second call', async () => {
      const cachedResult = {
        status: 'success',
        data: { obra_id: 'obra-123', predictions: [], summary: { total_alerts: 0, critical_alerts: 0, high_alerts: 0, estimated_impact_brl: 0 } },
        metadata: { query_time_ms: 100, cache_hit: false, forecast_days: 7 },
      };
      mockCacheManager.get.mockResolvedValueOnce(cachedResult);

      const result = await service.predictMaterialDelays('obra-123', 7);

      expect(result.metadata.cache_hit).toBe(true);
      expect(mockDbPool.query).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockDbPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(service.predictMaterialDelays('obra-123', 7)).rejects.toThrow(
        'Material delay prediction failed',
      );
    });

    it('should respect forecast_days parameter (default 7, max 30)', async () => {
      const mockRows = [];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      await service.predictMaterialDelays('obra-123', 14);

      const [query, params] = mockDbPool.query.mock.calls[0];
      expect(params[1]).toBe(14);
    });

    it('should aggregate predictions by severity levels', async () => {
      const mockRows = [
        {
          id: 'pred-1',
          obra_id: 'obra-123',
          material_id: 'mat-1',
          material_name: 'Material 1',
          predicted_delay_days: 5,
          confidence: 0.8,
          severity: 'CRITICAL',
          predicted_date: '2026-08-01',
          recommended_action: 'Reordenar cronograma (risco crítico)',
          requires_approval: true,
        },
        {
          id: 'pred-2',
          obra_id: 'obra-123',
          material_id: 'mat-2',
          material_name: 'Material 2',
          predicted_delay_days: 3,
          confidence: 0.6,
          severity: 'HIGH',
          predicted_date: '2026-08-02',
          recommended_action: 'Adiantar pedido ou providenciar alternativa',
          requires_approval: true,
        },
        {
          id: 'pred-3',
          obra_id: 'obra-123',
          material_id: 'mat-3',
          material_name: 'Material 3',
          predicted_delay_days: 2,
          confidence: 0.3,
          severity: 'MEDIUM',
          predicted_date: '2026-08-03',
          recommended_action: 'Monitorar fornecedor',
          requires_approval: false,
        },
      ];
      mockDbPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await service.predictMaterialDelays('obra-123', 7);

      expect(result.data.summary.total_alerts).toBe(3);
      expect(result.data.summary.critical_alerts).toBe(1);
      expect(result.data.summary.high_alerts).toBe(1);
    });
  });
});
