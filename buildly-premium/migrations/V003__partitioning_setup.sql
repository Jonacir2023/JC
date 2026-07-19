-- V003: Partitioning Setup — Table Partitioning for Performance
-- Phase 3.2: Persistence Layer — Performance Optimization
-- Created: 2026-07-30
-- Purpose: Implement range partitioning for eventos (monthly) and bmi_scores (quarterly)

-- 1. Create partitioned table for eventos (monthly by data)
-- Note: If eventos table already exists, we need to recreate it with partitioning
-- Strategy: This assumes fresh install; for existing data, use pg_partman extension

-- 2. Partition strategy for eventos table (already created in V001)
-- Add check constraint to enable partition pruning
ALTER TABLE eventos ADD CONSTRAINT eventos_data_check
  CHECK (criado_em >= '2026-01-01'::timestamp)
  NOT VALID;

-- Create indexes for partitions
-- These will be automatically inherited by child partitions
CREATE INDEX idx_eventos_partition_type ON eventos (tipo, criado_em DESC)
  WHERE criado_em >= '2026-01-01';

-- 3. Create partitions for eventos (monthly)
-- July 2026
CREATE TABLE eventos_2026_07 PARTITION OF eventos
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- August 2026
CREATE TABLE eventos_2026_08 PARTITION OF eventos
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- September 2026
CREATE TABLE eventos_2026_09 PARTITION OF eventos
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- October 2026
CREATE TABLE eventos_2026_10 PARTITION OF eventos
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

-- Create indexes on partitions for faster queries
CREATE INDEX idx_eventos_2026_07_obra ON eventos_2026_07 (obra_id)
  WHERE criado_em >= '2026-07-01' AND criado_em < '2026-08-01';

CREATE INDEX idx_eventos_2026_08_obra ON eventos_2026_08 (obra_id)
  WHERE criado_em >= '2026-08-01' AND criado_em < '2026-09-01';

-- 4. Partitioning for bmi_scores (quarterly)
-- Q3 2026
CREATE TABLE bmi_scores_2026_q3 PARTITION OF bmi_scores
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');

-- Q4 2026
CREATE TABLE bmi_scores_2026_q4 PARTITION OF bmi_scores
  FOR VALUES FROM ('2026-10-01') TO ('2026-12-31');

-- Create indexes on bmi_scores partitions
CREATE INDEX idx_bmi_2026_q3_obra ON bmi_scores_2026_q3 (obra_id)
  WHERE criado_em >= '2026-07-01' AND criado_em < '2026-10-01';

CREATE INDEX idx_bmi_2026_q4_obra ON bmi_scores_2026_q4 (obra_id)
  WHERE criado_em >= '2026-10-01' AND criado_em < '2026-12-31';

-- 5. Create function to auto-create new partitions (future-proofing)
CREATE OR REPLACE FUNCTION create_eventos_partition_if_needed()
RETURNS void AS $$
DECLARE
  v_year INT;
  v_month INT;
  v_next_month INT;
  v_next_year INT;
  v_partition_name VARCHAR(50);
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
BEGIN
  -- Calculate next month
  v_year := EXTRACT(YEAR FROM NOW());
  v_month := EXTRACT(MONTH FROM NOW());

  v_next_month := v_month + 1;
  v_next_year := v_year;

  IF v_next_month > 12 THEN
    v_next_month := 1;
    v_next_year := v_year + 1;
  END IF;

  v_partition_name := 'eventos_' || v_next_year || '_' || LPAD(v_next_month::text, 2, '0');
  v_start_date := (v_next_year || '-' || LPAD(v_next_month::text, 2, '0') || '-01')::timestamp;
  v_end_date := (EXTRACT(YEAR FROM v_start_date + interval '1 month') || '-' ||
                 LPAD(EXTRACT(MONTH FROM v_start_date + interval '1 month')::text, 2, '0') || '-01')::timestamp;

  -- Check if partition already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = v_partition_name
  ) THEN
    EXECUTE 'CREATE TABLE ' || v_partition_name || ' PARTITION OF eventos
              FOR VALUES FROM (''' || v_start_date || ''') TO (''' || v_end_date || ''')';

    RAISE NOTICE 'Created partition: %', v_partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Create procedure for partition maintenance (runs monthly)
CREATE OR REPLACE PROCEDURE maintain_evento_partitions()
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM create_eventos_partition_if_needed();
  RAISE NOTICE 'Partition maintenance completed';
END;
$$;

-- 7. Analyze tables for query planner
ANALYZE eventos;
ANALYZE bmi_scores;

-- 8. Comments
COMMENT ON TABLE eventos_2026_07 IS 'Events from July 2026';
COMMENT ON TABLE eventos_2026_08 IS 'Events from August 2026';
COMMENT ON FUNCTION create_eventos_partition_if_needed() IS 'Automatically creates new monthly partitions for eventos table';
COMMENT ON PROCEDURE maintain_evento_partitions() IS 'Maintenance procedure to ensure partitions exist for upcoming months';

-- 9. Verify partitions created
-- Query to check partitions:
-- SELECT tablename FROM pg_tables WHERE tablename LIKE 'eventos_%' OR tablename LIKE 'bmi_%' ORDER BY tablename;

-- Fim da migration V003
