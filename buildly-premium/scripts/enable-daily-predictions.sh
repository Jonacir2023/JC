#!/bin/bash

# 🚀 Enable Daily Prediction Scheduler for Soft Launch (Phase 4.4)
# This script sets up automated daily prediction generation starting at 6:00 AM

set -e

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${COLOR_BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${COLOR_GREEN}✅ $1${NC}"
}

log_warn() {
  echo -e "${COLOR_YELLOW}⚠️  $1${NC}"
}

echo ""
log_info "=========================================="
log_info "Soft Launch — Daily Prediction Scheduler"
log_info "=========================================="
echo ""

# ============================================
# STEP 1: Verify Phase 4.3 Week 1 Completed
# ============================================

log_info "Step 1: Verifying Phase 4.3 Week 1 completion..."

PILOT_TABLES=$(docker compose exec -T postgres psql -U buildly_user -d buildly_db -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'pilot_%';" 2>/dev/null | tr -d ' ')

if [ "$PILOT_TABLES" -lt 8 ]; then
  echo ""
  log_warn "⚠️  Phase 4.3 Week 1 not fully initialized (found $PILOT_TABLES tables, expected 8+)"
  log_warn "Please run: ./scripts/week1-execute.sh first"
  exit 1
fi

log_success "Pilot infrastructure verified ($PILOT_TABLES tables found)"

# ============================================
# STEP 2: Deploy V012 Migration
# ============================================

log_info "Step 2: Deploying soft launch observation schema (V012)..."

docker compose exec -T postgres psql -U buildly_user -d buildly_db << 'EOF' 2>/dev/null
-- Soft Launch Observation Tracking (V012)
CREATE TABLE IF NOT EXISTS pilot_soft_launch_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  observation_date DATE NOT NULL,

  -- Prediction metrics
  predictions_generated INT DEFAULT 0,
  avg_confidence_score NUMERIC(3,2),
  critical_count INT DEFAULT 0,
  high_count INT DEFAULT 0,
  medium_count INT DEFAULT 0,
  low_count INT DEFAULT 0,

  -- Accuracy metrics
  actual_delays_observed INT DEFAULT 0,
  true_positives INT DEFAULT 0,
  false_positives INT DEFAULT 0,
  true_negatives INT DEFAULT 0,
  false_negatives INT DEFAULT 0,

  -- Calculated rates
  false_positive_rate NUMERIC(5,2),
  false_negative_rate NUMERIC(5,2),
  precision_rate NUMERIC(5,2),
  recall_rate NUMERIC(5,2),

  -- System health
  prediction_pipeline_latency_ms INT,
  system_uptime_percent NUMERIC(5,2),
  cache_hit_rate NUMERIC(5,2),

  -- Gestor feedback
  gestor_notes TEXT,
  issues_reported TEXT,

  -- Audit
  recorded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_observation UNIQUE(site_id, observation_date)
);

CREATE INDEX IF NOT EXISTS idx_soft_launch_obs_date
  ON pilot_soft_launch_observations(observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_soft_launch_obs_site
  ON pilot_soft_launch_observations(site_id, observation_date DESC);

-- Daily aggregate view
CREATE OR REPLACE VIEW v_soft_launch_daily_aggregate AS
SELECT
  DATE(recorded_at) as observation_date,
  COUNT(DISTINCT site_id) as sites_observed,
  SUM(predictions_generated) as total_predictions,
  ROUND(AVG(avg_confidence_score)::NUMERIC, 4) as avg_confidence_overall,
  SUM(false_positives) as total_fp,
  SUM(true_positives) as total_tp,
  ROUND((SUM(false_positives)::NUMERIC / NULLIF(SUM(false_positives) + SUM(true_positives), 0) * 100)::NUMERIC, 2) as fp_rate_overall,
  ROUND(AVG(system_uptime_percent)::NUMERIC, 2) as avg_uptime,
  ROUND(AVG(cache_hit_rate)::NUMERIC, 2) as avg_cache_hit
FROM pilot_soft_launch_observations
GROUP BY DATE(recorded_at)
ORDER BY observation_date DESC;

GRANT SELECT ON v_soft_launch_daily_aggregate TO buildly_user;
EOF

log_success "Soft launch schema deployed"

# ============================================
# STEP 3: Update Pilot Sites to Observation Mode
# ============================================

log_info "Step 3: Transitioning pilot sites to observation mode..."

docker compose exec -T postgres psql -U buildly_user -d buildly_db << 'EOF' 2>/dev/null
UPDATE pilot_sites
SET phase = 'soft_launch',
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM pilot_sites ORDER BY id LIMIT 5
);

-- Log transition to audit
INSERT INTO pilot_audit_log (event_type, event_data, created_at)
VALUES (
  'SOFT_LAUNCH_ACTIVATED',
  jsonb_build_object('sites_count', 5, 'timestamp', NOW()),
  NOW()
);
EOF

log_success "Pilot sites transitioned to soft_launch phase"

# ============================================
# STEP 4: Initialize Daily Metrics
# ============================================

log_info "Step 4: Initializing daily metrics collection..."

docker compose exec -T postgres psql -U buildly_user -d buildly_db << 'EOF' 2>/dev/null
-- Pre-populate observation records for Week 2-3 (14 days)
-- This ensures metrics tracking starts immediately

INSERT INTO pilot_soft_launch_observations
  (site_id, observation_date, predictions_generated, recorded_at)
SELECT
  ps.id,
  CURRENT_DATE + (n * interval '1 day'),
  0,
  NOW()
FROM pilot_sites ps
CROSS JOIN generate_series(0, 13) AS t(n)
ON CONFLICT (site_id, observation_date) DO NOTHING;
EOF

log_success "Daily metrics tracking initialized"

# ============================================
# STEP 5: Setup Cron Job for Daily Predictions
# ============================================

log_info "Step 5: Configuring daily prediction cron job..."

CRON_JOB="0 6 * * * cd $(pwd) && npx ts-node scripts/generate-daily-predictions.ts >> logs/daily-predictions.log 2>&1"

# Check if already exists
if crontab -l 2>/dev/null | grep -q "generate-daily-predictions.ts"; then
  log_warn "Cron job already exists, skipping..."
else
  (crontab -l 2>/dev/null || echo ""; echo "$CRON_JOB") | crontab - 2>/dev/null
  log_success "Cron job scheduled (6:00 AM daily)"
fi

# ============================================
# STEP 6: Verify Scheduler
# ============================================

log_info "Step 6: Verifying scheduler configuration..."

SITE_COUNT=$(docker compose exec -T postgres psql -U buildly_user -d buildly_db -t -c \
  "SELECT COUNT(*) FROM pilot_sites WHERE phase = 'soft_launch';" 2>/dev/null | tr -d ' ')

OBSERVATION_ROWS=$(docker compose exec -T postgres psql -U buildly_user -d buildly_db -t -c \
  "SELECT COUNT(*) FROM pilot_soft_launch_observations;" 2>/dev/null | tr -d ' ')

log_success "Configuration verified:"
echo "  • Sites in soft_launch: $SITE_COUNT"
echo "  • Observation records pre-loaded: $OBSERVATION_ROWS"

# ============================================
# SUMMARY
# ============================================

echo ""
log_success "=========================================="
log_success "Soft Launch Scheduler Enabled!"
log_success "=========================================="
echo ""
echo "✅ Phase 4.4 Week 2-3 infrastructure ready"
echo ""
echo "Daily predictions will run at: 6:00 AM (system time)"
echo "Logs will be written to: logs/daily-predictions.log"
echo ""
echo "Monitoring:"
echo "  • Query daily metrics: docker compose exec postgres psql -U buildly_user -d buildly_db -c \"SELECT * FROM v_soft_launch_daily_aggregate LIMIT 7;\""
echo ""
log_warn "Next: Send 'Soft Launch Week 2' notification email to all 5 gestores"
echo ""
