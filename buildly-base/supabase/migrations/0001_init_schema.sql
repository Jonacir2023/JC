-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum types
CREATE TYPE event_type_enum AS ENUM (
  'MATERIAL_DELAY',
  'COST_OVERRUN',
  'SCHEDULE_DEVIATION',
  'RESOURCE_UNAVAILABLE',
  'QUALITY_ISSUE'
);

CREATE TYPE decision_type_enum AS ENUM (
  'BUDGET_APPROVAL',
  'MATERIAL_SUBSTITUTION',
  'SCHEDULE_ADJUSTMENT',
  'RESOURCE_REALLOCATION',
  'COST_MITIGATION'
);

CREATE TYPE decision_status_enum AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ESCALATED'
);

-- Event Store (immutable event log)
CREATE TABLE event_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type event_type_enum NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_aggregate ON event_store(aggregate_id, aggregate_type);
CREATE INDEX idx_event_type ON event_store(event_type);
CREATE INDEX idx_event_created ON event_store(created_at DESC);

-- Decisions table
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type decision_type_enum NOT NULL,
  status decision_status_enum NOT NULL DEFAULT 'PENDING',
  context JSONB NOT NULL,
  created_by UUID NOT NULL,
  approved_by UUID,
  approval_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_decision_status ON decisions(status);
CREATE INDEX idx_decision_created ON decisions(created_at DESC);
CREATE INDEX idx_decision_type ON decisions(type);

-- Decision feedback (for ML training)
CREATE TABLE decision_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure', 'partial')),
  feedback TEXT,
  actual_impact NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_decision ON decision_feedback(decision_id);

-- Cache table for decision aggregates
CREATE TABLE decision_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_snapshot_decision ON decision_snapshots(decision_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
