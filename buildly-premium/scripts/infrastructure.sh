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
  start              Start all services
  stop               Stop all services
  restart            Restart all services
  status             Show service status & health checks
  logs [service]     Show logs (optional service name)
  test-workflow      Run complete workflow test
  db-backup          Create database backup
  db-restore <file>  Restore from backup
  clear-cache        Clear Redis cache
  metrics            Show Docker resource usage
  help               Show this help message

Examples:
  ./scripts/infrastructure.sh start
  ./scripts/infrastructure.sh logs brain-ml
  ./scripts/infrastructure.sh db-backup
  ./scripts/infrastructure.sh test-workflow

Services:
  - postgres        PostgreSQL database
  - redis           Redis cache
  - brain-ml        Brain ML Engine
  - core-api        Buildly Core API
  - pgadmin         Database UI (http://localhost:5050)
  - redis-commander Cache UI (http://localhost:8081)

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

main "$@"
