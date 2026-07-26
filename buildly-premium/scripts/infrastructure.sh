#!/bin/bash

# Buildly Premium Infrastructure Management
# Usage: ./scripts/infrastructure.sh [command] [options]

set -e

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m'  # No Color

log_info() {
  echo -e "${COLOR_BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${COLOR_GREEN}✅ $1${NC}"
}

log_warn() {
  echo -e "${COLOR_YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${COLOR_RED}❌ $1${NC}"
}

# Command: start
cmd_start() {
  log_info "Starting Buildly Premium infrastructure..."
  docker-compose up -d
  log_success "Services started"

  log_info "Waiting for services to be healthy..."
  sleep 10

  cmd_status
}

# Command: stop
cmd_stop() {
  log_info "Stopping services..."
  docker-compose down
  log_success "Services stopped"
}

# Command: restart
cmd_restart() {
  log_info "Restarting services..."
  docker-compose restart
  log_success "Services restarted"
}

# Command: status
cmd_status() {
  log_info "Service Status:"
  docker-compose ps
  echo ""

  log_info "Health Checks:"

  # Brain ML
  if curl -s http://localhost:3002/ml/health > /dev/null 2>&1; then
    log_success "Brain ML Engine: healthy"
  else
    log_error "Brain ML Engine: unreachable"
  fi

  # Core API
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    log_success "Core API: healthy"
  else
    log_error "Core API: unreachable"
  fi

  # Database
  if docker-compose exec postgres psql -U buildly_user -d buildly_db -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "PostgreSQL: healthy"
  else
    log_error "PostgreSQL: unreachable"
  fi

  # Redis
  if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis: healthy"
  else
    log_error "Redis: unreachable"
  fi
}

# Command: logs
cmd_logs() {
  local service=$1
  if [ -z "$service" ]; then
    docker-compose logs -f
  else
    docker-compose logs -f "$service"
  fi
}

# Command: test-workflow
cmd_test_workflow() {
  log_info "Testing complete workflow..."

  log_info "1. Fetching predictions from Brain..."
  PREDICTIONS=$(curl -s -H "X-Tenant-ID: obra-test-001" \
    http://localhost:3002/ml/predict/delays?forecast_days=7)

  if echo "$PREDICTIONS" | jq -e '.data.predictions' > /dev/null; then
    COUNT=$(echo "$PREDICTIONS" | jq '.data.predictions | length')
    log_success "Retrieved $COUNT predictions"
  else
    log_error "Failed to fetch predictions"
    return 1
  fi

  log_info "2. Getting alerts via Core API..."
  ALERTS=$(curl -s http://localhost:3001/alerts/obras/obra-test-001/delay-alerts?forecast_days=7)

  if echo "$ALERTS" | jq -e '.alerts' > /dev/null; then
    COUNT=$(echo "$ALERTS" | jq '.alerts | length')
    log_success "Retrieved $COUNT alerts via Core API"
  else
    log_error "Failed to fetch alerts"
    return 1
  fi

  log_info "3. Testing approval workflow..."
  PRED_ID=$(echo "$PREDICTIONS" | jq -r '.data.predictions[0].id')

  FEEDBACK=$(curl -s -X POST http://localhost:3001/alerts/alerts/$PRED_ID/approve \
    -H "Content-Type: application/json" \
    -d '{"obra_id":"obra-test-001"}')

  if echo "$FEEDBACK" | jq -e '.status == "success"' > /dev/null; then
    log_success "Approval workflow functional"
  else
    log_error "Approval workflow failed"
    return 1
  fi

  log_success "Full workflow test passed!"
}

# Command: db-backup
cmd_db_backup() {
  local filename="backup-$(date +%Y%m%d-%H%M%S).sql"
  log_info "Creating database backup: $filename"

  docker-compose exec postgres pg_dump -U buildly_user buildly_db > "$filename"

  log_success "Backup created: $filename"
  ls -lh "$filename"
}

# Command: db-restore
cmd_db_restore() {
  local file=$1
  if [ -z "$file" ]; then
    log_error "Usage: ./scripts/infrastructure.sh db-restore <backup-file>"
    return 1
  fi

  if [ ! -f "$file" ]; then
    log_error "File not found: $file"
    return 1
  fi

  log_warn "This will restore from $file. Continue? (y/N)"
  read -r confirm

  if [ "$confirm" != "y" ]; then
    log_info "Cancelled"
    return 0
  fi

  log_info "Restoring database..."
  cat "$file" | docker-compose exec -T postgres psql -U buildly_user buildly_db
  log_success "Database restored"
}

# Command: clear-cache
cmd_clear_cache() {
  log_info "Clearing Redis cache..."
  docker-compose exec redis redis-cli FLUSHDB
  log_success "Cache cleared"
}

# Command: metrics
cmd_metrics() {
  log_info "Docker Resource Usage:"
  docker stats buildly-postgres buildly-redis buildly-brain-ml buildly-core-api
}

# Command: help
cmd_help() {
  cat << EOF
Buildly Premium Infrastructure Management

Usage: ./scripts/infrastructure.sh [command] [options]

Commands:
  start                   Start all services
  stop                    Stop all services
  restart                 Restart all services
  status                  Show service status & health checks
  logs [service]          Show logs (optional service name)
  test-workflow           Run complete workflow test
  db-backup               Create database backup
  db-restore <file>       Restore from backup
  clear-cache             Clear Redis cache
  metrics                 Show Docker resource usage

Pilot Validation (Phase 4):
  pilot-setup             Initialize pilot infrastructure & schema
  pilot-load-data         Load historical material data for 5 sites
  pilot-generate-baseline Generate baseline predictions (Phase 4.1)
  pilot-enable-soft-launch Enable Phase 4.2 daily predictions
  pilot-enable-decisions  Enable Phase 4.3 approval workflow
  pilot-retrain-model     Retrain model using gestor feedback
  pilot-status            Display pilot sites & metrics status
  pilot-weekly-report     Generate weekly summary report
  help                    Show this help message

Examples:
  ./scripts/infrastructure.sh start
  ./scripts/infrastructure.sh logs brain-ml
  ./scripts/infrastructure.sh pilot-setup
  ./scripts/infrastructure.sh pilot-load-data
  ./scripts/infrastructure.sh pilot-generate-baseline
  ./scripts/infrastructure.sh pilot-enable-soft-launch
  ./scripts/infrastructure.sh pilot-weekly-report

Services:
  - postgres        PostgreSQL database
  - redis           Redis cache
  - brain-ml        Brain ML Engine
  - core-api        Buildly Core API
  - pgadmin         Database UI (http://localhost:5050)
  - redis-commander Cache UI (http://localhost:8081)

Pilot Sites (Phase 4.3):
  - SP (Camargo Corrêa)          São Paulo Commercial (950 records)
  - MG (Odebrecht)               Belo Horizonte Residential (650 records)
  - RJ (Queiroz Galvão)          Rio Waterfront (1,200 records)
  - DF (governo do Brasil)       Brasília Government (800 records)
  - AM (SUFRAMA)                 Manaus Industrial (450 records)

EOF
}

# Main
main() {
  local command=$1

  case "$command" in
    start)
      cmd_start
      ;;
    stop)
      cmd_stop
      ;;
    restart)
      cmd_restart
      ;;
    status)
      cmd_status
      ;;
    logs)
      cmd_logs "$2"
      ;;
    test-workflow)
      cmd_test_workflow
      ;;
    db-backup)
      cmd_db_backup
      ;;
    db-restore)
      cmd_db_restore "$2"
      ;;
    clear-cache)
      cmd_clear_cache
      ;;
    metrics)
      cmd_metrics
      ;;
    pilot-setup)
      cmd_pilot_setup
      ;;
    pilot-load-data)
      cmd_pilot_load_data
      ;;
    pilot-generate-baseline)
      cmd_pilot_generate_baseline
      ;;
    pilot-status)
      cmd_pilot_status
      ;;
    pilot-enable-soft-launch)
      cmd_pilot_enable_soft_launch
      ;;
    pilot-enable-decisions)
      cmd_pilot_enable_decisions
      ;;
    pilot-retrain-model)
      cmd_pilot_retrain_model
      ;;
    pilot-weekly-report)
      cmd_pilot_weekly_report
      ;;
    help|"")
      cmd_help
      ;;
    *)
      log_error "Unknown command: $command"
      cmd_help
      exit 1
      ;;
  esac
}

# Pilot-specific commands

cmd_pilot_setup() {
  log_info "Setting up pilot infrastructure..."

  log_info "1. Applying pilot data migrations..."
  docker-compose exec -T postgres psql -U buildly_user -d buildly_db -f /docker-entrypoint-initdb.d/V011__create_pilot_infrastructure.sql
  log_success "Pilot schema created"

  log_info "2. All systems ready for data loading"
}

cmd_pilot_load_data() {
  log_info "Loading historical material data for 5 pilot sites..."

  if [ ! -f "scripts/load-pilot-data.sql" ]; then
    log_error "Script not found: scripts/load-pilot-data.sql"
    return 1
  fi

  log_info "Executing data load (this may take 30-60 seconds)..."
  docker-compose exec -T postgres psql -U buildly_user -d buildly_db -f /docker-entrypoint-initdb.d/load-pilot-data.sql

  log_success "Pilot data loaded successfully"
  log_info "  • 950+ records: São Paulo (Camargo Corrêa)"
  log_info "  • 650+ records: Belo Horizonte (Odebrecht)"
  log_info "  • 1,200+ records: Rio de Janeiro (Queiroz Galvão)"
  log_info "  • 800+ records: Brasília (governo do Brasil)"
  log_info "  • 450+ records: Manaus (SUFRAMA)"
}

cmd_pilot_generate_baseline() {
  log_info "Generating baseline predictions from historical data..."

  if [ ! -f "scripts/generate-baseline-predictions.ts" ]; then
    log_error "Script not found: scripts/generate-baseline-predictions.ts"
    return 1
  fi

  log_info "Building and running baseline prediction generator..."
  npx ts-node scripts/generate-baseline-predictions.ts

  if [ $? -eq 0 ]; then
    log_success "Baseline predictions generated successfully"
  else
    log_error "Failed to generate baseline predictions"
    return 1
  fi
}

cmd_pilot_status() {
  log_info "Pilot Sites Status:"
  echo ""

  docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
    \x
    SELECT
      site_name,
      client_name,
      location_state,
      status,
      expected_historical_records,
      (SELECT COUNT(*) FROM pilot_material_history WHERE site_id = pilot_sites.id) as loaded_records,
      (SELECT COUNT(*) FROM pilot_baseline_predictions WHERE site_id = pilot_sites.id) as baseline_predictions,
      updated_at
    FROM pilot_sites
    ORDER BY created_at;
EOF

  echo ""
  log_info "Material Delay Statistics:"
  docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
    SELECT
      COUNT(DISTINCT site_id) as sites_loaded,
      COUNT(*) as total_records,
      COUNT(CASE WHEN delay_days > 0 THEN 1 END) as delayed_shipments,
      ROUND(100.0 * COUNT(CASE WHEN delay_days > 0 THEN 1 END) / COUNT(*), 2) as delay_rate_percent,
      ROUND(AVG(CASE WHEN delay_days > 0 THEN delay_days END)::NUMERIC, 2) as avg_delay_days,
      MAX(delay_days) as max_delay_days
    FROM pilot_material_history;
EOF
}

cmd_pilot_enable_soft_launch() {
  log_info "Enabling Phase 4.2 (Soft Launch) - Daily Predictions..."

  log_info "1. Deploying V012 migration (soft_launch_observations table)..."
  docker-compose exec -T postgres psql -U buildly_user -d buildly_db -f /docker-entrypoint-initdb.d/V012__init_soft_launch_observations.sql

  log_info "2. Setting up daily prediction cron jobs..."
  log_info "   • 6:00 AM: generate-daily-predictions.ts"
  log_info "   • 8:00 PM: collect-daily-observations.ts"

  log_success "Phase 4.2 (Soft Launch) enabled"
  log_info "Gestores will receive daily predictions starting 2026-08-02 at 6:00 AM"
}

cmd_pilot_enable_decisions() {
  log_info "Enabling Phase 4.3 (Active Phase) - Approval Workflow..."

  log_info "1. Deploying V013 migration (approval_decisions + retraining_log tables)..."
  docker-compose exec -T postgres psql -U buildly_user -d buildly_db -f /docker-entrypoint-initdb.d/V013__init_approval_workflow.sql

  log_info "2. Starting decision recording API (port 3003)..."
  log_info "   • POST /api/decisions — Record gestor decision"
  log_info "   • GET  /api/decisions/:siteId — List decisions"
  log_info "   • PUT  /api/decisions/:decisionId/outcome — Record actual outcome"

  log_info "3. Setting up nightly model retraining cron job..."
  log_info "   • 11:00 PM: retrain-model-nightly.ts"

  log_success "Phase 4.3 (Active Phase) enabled"
  log_info "Gestores can now approve/reject predictions starting 2026-08-19"
}

cmd_pilot_retrain_model() {
  log_info "Running model retraining with recent gestor feedback..."

  if [ ! -f "scripts/retrain-model-nightly.ts" ]; then
    log_error "Script not found: scripts/retrain-model-nightly.ts"
    return 1
  fi

  npx ts-node scripts/retrain-model-nightly.ts

  if [ $? -eq 0 ]; then
    log_success "Model retraining completed successfully"
  else
    log_error "Model retraining failed"
    return 1
  fi
}

cmd_pilot_weekly_report() {
  log_info "Generating weekly pilot validation report..."

  docker-compose exec -T postgres psql -U buildly_user -d buildly_db << EOF
    -- Weekly Summary Report
    SELECT
      ps.site_name,
      (DATE_TRUNC('week', pso.observation_date))::DATE as week_start,
      COUNT(DISTINCT pso.observation_date) as days_observed,
      SUM(pso.predictions_generated) as total_predictions,
      ROUND(AVG(pso.precision_rate)::NUMERIC, 2) as avg_precision,
      ROUND(AVG(pso.recall_rate)::NUMERIC, 2) as avg_recall,
      ROUND(AVG(pso.system_uptime_percent)::NUMERIC, 2) as avg_uptime,
      ROUND(SUM(pso.total_cost_exposure_brl) / 1000000, 2) as cost_exposure_m
    FROM pilot_soft_launch_observations pso
    JOIN pilot_sites ps ON pso.site_id = ps.id
    WHERE pso.observation_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY ps.id, ps.site_name, DATE_TRUNC('week', pso.observation_date)
    ORDER BY ps.site_name, week_start DESC;
EOF

  log_success "Weekly report generated"
}

main "$@"
