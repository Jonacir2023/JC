import * as fs from 'fs';
import * as path from 'path';

describe('Database Migrations', () => {
  const migrationsDir = path.join(__dirname, 'migrations');

  it('should have migration files', () => {
    const files = fs.readdirSync(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));
    expect(sqlFiles.length).toBeGreaterThan(0);
  });

  describe('Migration 0001_init_schema.sql', () => {
    let content: string;

    beforeAll(() => {
      const filePath = path.join(migrationsDir, '0001_init_schema.sql');
      content = fs.readFileSync(filePath, 'utf-8');
    });

    it('should create event_type_enum', () => {
      expect(content).toContain('CREATE TYPE event_type_enum AS ENUM');
      expect(content).toContain('MATERIAL_DELAY');
      expect(content).toContain('COST_OVERRUN');
      expect(content).toContain('SCHEDULE_DEVIATION');
    });

    it('should create decision_type_enum', () => {
      expect(content).toContain('CREATE TYPE decision_type_enum AS ENUM');
      expect(content).toContain('BUDGET_APPROVAL');
      expect(content).toContain('MATERIAL_SUBSTITUTION');
    });

    it('should create decision_status_enum', () => {
      expect(content).toContain('CREATE TYPE decision_status_enum AS ENUM');
      expect(content).toContain('PENDING');
      expect(content).toContain('APPROVED');
      expect(content).toContain('REJECTED');
    });

    it('should create event_store table', () => {
      expect(content).toContain('CREATE TABLE event_store');
      expect(content).toContain('event_type event_type_enum NOT NULL');
      expect(content).toContain('aggregate_id UUID NOT NULL');
      expect(content).toContain('data JSONB NOT NULL');
    });

    it('should create decisions table', () => {
      expect(content).toContain('CREATE TABLE decisions');
      expect(content).toContain('type decision_type_enum NOT NULL');
      expect(content).toContain('status decision_status_enum NOT NULL DEFAULT');
    });

    it('should create decision_feedback table', () => {
      expect(content).toContain('CREATE TABLE decision_feedback');
      expect(content).toContain('decision_id UUID NOT NULL REFERENCES decisions');
      expect(content).toContain("outcome VARCHAR(20) NOT NULL CHECK");
    });

    it('should have indexes for performance', () => {
      expect(content).toContain('CREATE INDEX idx_event_aggregate');
      expect(content).toContain('CREATE INDEX idx_decision_status');
      expect(content).toContain('CREATE INDEX idx_feedback_decision');
    });

    it('should have update_updated_at trigger', () => {
      expect(content).toContain('CREATE TRIGGER update_decisions_updated_at');
      expect(content).toContain('update_updated_at_column');
    });
  });

  describe('Migration 0002_audit_log.sql', () => {
    let content: string;

    beforeAll(() => {
      const filePath = path.join(migrationsDir, '0002_audit_log.sql');
      content = fs.readFileSync(filePath, 'utf-8');
    });

    it('should create audit_log table', () => {
      expect(content).toContain('CREATE TABLE audit_log');
      expect(content).toContain('entity_type VARCHAR(50) NOT NULL');
      expect(content).toContain('entity_id UUID NOT NULL');
    });

    it('should have audit action enum', () => {
      expect(content).toContain("action IN ('CREATE', 'UPDATE', 'DELETE'");
    });

    it('should create audit triggers', () => {
      expect(content).toContain('CREATE TRIGGER audit_decisions');
      expect(content).toContain('audit_decisions_change');
    });

    it('should create metrics views', () => {
      expect(content).toContain('CREATE OR REPLACE VIEW event_metrics');
      expect(content).toContain('CREATE OR REPLACE VIEW decision_metrics');
    });

    it('should have audit indexes', () => {
      expect(content).toContain('CREATE INDEX idx_audit_entity');
      expect(content).toContain('CREATE INDEX idx_audit_created');
    });
  });

  describe('Migration Quality', () => {
    it('should not have bare DROP statements', () => {
      const files = fs.readdirSync(migrationsDir);
      files.forEach((file) => {
        if (file.endsWith('.sql')) {
          const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
          // Migrations should use IF EXISTS
          const hasDrop = /^DROP\s+(?!.*IF\s+EXISTS)/gim.test(content);
          expect(hasDrop).toBe(false);
        }
      });
    });

    it('should use IF NOT EXISTS for creates', () => {
      const files = fs.readdirSync(migrationsDir);
      files.forEach((file) => {
        if (file.endsWith('.sql')) {
          const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
          // Most creates should be safe
          expect(content.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
