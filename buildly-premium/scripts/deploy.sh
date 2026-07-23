#!/bin/bash
# deploy.sh - Main deployment orchestration for Buildly Brain Phase 3
# Orchestrates: validate → build → smoke-tests → deploy → verify → baseline
# Exit codes: 0=success, 1=validation error, 2=build error, 3=deployment error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
MODE="${1:-production}"
DRY_RUN="${2:-false}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_header() {
  echo
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  $1${NC}$(printf '%*s' $((50 - ${#1})) '')${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
  echo
}

log_step() { echo -e "${BLUE}→${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*"; }

load_env() {
  log_step "Loading environment from $ENV_FILE"
  if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    log_success "Environment loaded"
  else
    log_error "Environment file not found: $ENV_FILE"
    return 1
  fi
}

step_validate() {
  log_header "STEP 1: PRE-DEPLOYMENT VALIDATION"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_step "DRY-RUN: Skipping validation"
    return 0
  fi

  if bash "$SCRIPT_DIR/deploy-validate.sh" --dry-run; then
    log_success "Validation passed"
    return 0
  else
    log_error "Validation failed"
    return 1
  fi
}

step_build() {
  log_header "STEP 2: BUILD DOCKER IMAGE"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_step "DRY-RUN: Would build buildly-intelligence:latest"
    return 0
  fi

  cd "$PROJECT_ROOT"
  log_step "Building Docker image..."

  if docker build \
    -t buildly-intelligence:latest \
    -t buildly-intelligence:"$(git rev-parse --short HEAD)" \
    -f Dockerfile . ; then
    log_success "Docker image built"
    return 0
  else
    log_error "Docker build failed"
    return 2
  fi
}

step_smoke_pre() {
  log_header "STEP 3: PRE-DEPLOYMENT SMOKE TESTS"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_step "DRY-RUN: Skipping pre-deployment tests"
    return 0
  fi

  if bash "$SCRIPT_DIR/smoke-tests.sh"; then
    log_success "Pre-deployment smoke tests passed"
    return 0
  else
    log_error "Smoke tests failed"
    return 3
  fi
}

step_deploy() {
  log_header "STEP 4: DEPLOY TO ${MODE^^}"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_step "DRY-RUN: Would deploy to $MODE"
    return 0
  fi

  cd "$PROJECT_ROOT"
  log_step "Starting containers..."

  if [ "$MODE" == "staging" ]; then
    docker-compose -f docker-compose.staging.yml up -d
  else
    docker-compose up -d
  fi

  log_step "Waiting for services to be ready..."
  sleep 10

  log_success "Deployment completed"
  return 0
}

step_smoke_post() {
  log_header "STEP 5: POST-DEPLOYMENT SMOKE TESTS"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_step "DRY-RUN: Skipping post-deployment tests"
    return 0
  fi

  if bash "$SCRIPT_DIR/smoke-tests.sh"; then
    log_success "Post-deployment smoke tests passed"
    return 0
  else
    log_error "Post-deployment smoke tests failed"
    return 3
  fi
}

step_baseline() {
  log_header "STEP 6: CAPTURE PERFORMANCE BASELINE"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_step "DRY-RUN: Skipping baseline capture"
    return 0
  fi

  if bash "$SCRIPT_DIR/perf-baseline.sh" 60 50; then
    log_success "Performance baseline captured"
    return 0
  else
    log_error "Performance baseline capture failed"
    return 3
  fi
}

step_verify() {
  log_header "STEP 7: FINAL VERIFICATION"

  log_step "Checking API health..."
  if curl -s http://localhost:3000/brain/health | grep -q "ok" 2>/dev/null; then
    log_success "API health check passed"
  else
    log_error "API health check failed"
    return 3
  fi

  log_step "Checking database connectivity..."
  if psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null; then
    log_success "Database connectivity verified"
  else
    log_error "Database connectivity check failed"
    return 3
  fi

  log_step "Checking Redis connectivity..."
  if redis-cli -u "$REDIS_URL" ping &>/dev/null; then
    log_success "Redis connectivity verified"
  else
    log_error "Redis connectivity check failed"
    return 3
  fi

  return 0
}

main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  BUILDLY BRAIN - DEPLOYMENT ORCHESTRATION          ║${NC}"
  echo -e "${BLUE}║  Mode: $MODE | DRY-RUN: ${DRY_RUN:-false}${NC}$(printf '%*s' $((27 - ${#MODE})) '')${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"

  load_env || return 1

  step_validate || return 1
  step_build || return 2
  step_smoke_pre || return 3
  step_deploy || return 3
  step_smoke_post || return 3
  step_baseline || return 3
  step_verify || return 3

  echo
  echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ DEPLOYMENT COMPLETED SUCCESSFULLY              ║${NC}"
  echo -e "${GREEN}║  ✓ All systems operational and verified           ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"

  return 0
}

main "$@"
