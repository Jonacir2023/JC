#!/bin/bash
# deploy-validate.sh - Pre-deployment validation for Buildly Brain Phase 3
# Validates: env vars, connectivity, schema, docker images, disk space
# Exit codes: 0=success, 1=env error, 2=connectivity error, 3=schema error, 4=disk error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DRY_RUN="${1:-false}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[✓]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

validate_env_vars() {
  log_info "Validating environment variables..."
  local required_vars=("DATABASE_URL" "NEO4J_URI" "REDIS_URL" "QDRANT_URL")

  for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      log_error "Missing required environment variable: $var"
      return 1
    fi
  done
  log_success "All required environment variables set"
  return 0
}

validate_connectivity() {
  log_info "Validating database connectivity..."

  if ! psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null; then
    log_error "PostgreSQL connection failed"
    return 2
  fi
  log_success "PostgreSQL connected"

  if ! redis-cli -u "$REDIS_URL" ping &>/dev/null; then
    log_error "Redis connection failed"
    return 2
  fi
  log_success "Redis connected"

  if ! curl -s "${QDRANT_URL}/health" &>/dev/null; then
    log_error "Qdrant connection failed"
    return 2
  fi
  log_success "Qdrant connected"

  return 0
}

validate_schema() {
  log_info "Validating database schema..."
  local tables=("rdo" "lesson" "event")

  for table in "${tables[@]}"; do
    if ! psql "$DATABASE_URL" -tc "SELECT 1 FROM information_schema.tables WHERE table_name='$table'" | grep -q 1; then
      log_error "Missing table: $table"
      return 3
    fi
  done
  log_success "All required database tables present"
  return 0
}

validate_docker_images() {
  log_info "Validating Docker images..."
  local required_images=("buildly-intelligence:latest" "postgres:15" "neo4j:5.12" "redis:7")

  for image in "${required_images[@]}"; do
    if ! docker image inspect "$image" &>/dev/null; then
      log_error "Missing Docker image: $image"
      return 1
    fi
  done
  log_success "All required Docker images present"
  return 0
}

validate_disk_space() {
  log_info "Validating disk space..."
  local available_gb=$(df "$PROJECT_ROOT" | tail -1 | awk '{printf "%d", $4 / 1024 / 1024}')
  local required_gb=5

  if [ "$available_gb" -lt "$required_gb" ]; then
    log_error "Insufficient disk space: ${available_gb}GB available (need ${required_gb}GB)"
    return 4
  fi
  log_success "Disk space OK: ${available_gb}GB available"
  return 0
}

validate_docker_daemon() {
  log_info "Checking Docker daemon..."
  if ! docker ps &>/dev/null; then
    log_error "Docker daemon not running"
    return 1
  fi
  log_success "Docker daemon running"
  return 0
}

validate_node_dependencies() {
  log_info "Validating Node.js dependencies..."
  if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    log_error "node_modules not found, run: pnpm install"
    return 1
  fi
  log_success "Node.js dependencies installed"
  return 0
}

main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  BUILDLY BRAIN - PRE-DEPLOYMENT VALIDATION        ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
  echo

  [ "$DRY_RUN" == "--dry-run" ] && log_info "DRY-RUN mode (no changes)"

  validate_env_vars || return 1
  validate_docker_daemon || return 1
  validate_disk_space || return 4
  validate_connectivity || return 2
  validate_schema || return 3
  validate_docker_images || return 1
  validate_node_dependencies || return 1

  echo
  echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ ALL VALIDATION CHECKS PASSED                  ║${NC}"
  echo -e "${GREEN}║  ✓ System ready for deployment                   ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
  return 0
}

main "$@"
