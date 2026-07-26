import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return 200 with health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'UP');
          expect(res.body).toHaveProperty('service', 'Core API');
          expect(res.body).toHaveProperty('version', '1.0.0');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should have valid ISO timestamp', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res: any) => {
          const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
          expect(res.body.timestamp).toMatch(isoRegex);
        });
    });

    it('should respond in less than 100ms', () => {
      const start = Date.now();
      return request(app.getHttpServer())
        .get('/health')
        .expect(() => {
          const elapsed = Date.now() - start;
          expect(elapsed).toBeLessThan(100);
        });
    });
  });
});
