import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  it('should return UP status', () => {
    const result = service.check();
    expect(result.status).toBe('UP');
    expect(result.service).toBe('Core API');
    expect(result.version).toBe('1.0.0');
    expect(result.timestamp).toBeDefined();
  });

  it('should have valid timestamp', () => {
    const result = service.check();
    const timestamp = new Date(result.timestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
