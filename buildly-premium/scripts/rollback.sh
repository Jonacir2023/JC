#!/bin/bash
# rollback.sh - Rollback procedure for Buildly Brain deployment
# Reverts git commits, docker images, and restarts services
# Exit codes: 0=success, 1=rollback error, 2=verification error

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMIT_TO_REVERT="${1:-HEAD}"
DRY_RUN="${2:-false}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

rollback_git() {
  log_info "Rolling back git commit: $COMMIT_TO_REVERT"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_info "DRY-RUN: Would revert $COMMIT_TO_REVERT"
    git -C "$PROJECT_ROOT" log -1 "$COMMIT_TO_REVERT"
    return 0
  fi

  if git -C "$PROJECT_ROOT" revert -n "$COMMIT_TO_REVERT"; then
    git -C "$PROJECT_ROOT" commit -m "rollback: revert deployment commit $COMMIT_TO_REVERT"
    log_success "Git rollback completed"
    return 0
  else
    log_error "Git rollback failed"
    return 1
  fi
}

rollback_docker() {
  log_info "Rolling back Docker containers"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_info "DRY-RUN: Would stop containers"
    docker ps | grep buildly || true
    return 0
  fi

  cd "$PROJECT_ROOT"
  if docker-compose down; then
    log_success "Containers stopped"
  else
    log_error "Failed to stop containers"
    return 1
  fi

  # Pull previous stable image
  log_info "Pulling previous stable image"
  if docker pull buildly-intelligence:stable; then
    log_success "Previous image pulled"
  else
    log_warn "Could not pull stable image, using latest"
    docker pull buildly-intelligence:latest || true
  fi
}

restart_services() {
  log_info "Restarting services"

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_info "DRY-RUN: Would start containers"
    return 0
  fi

  cd "$PROJECT_ROOT"
  if docker-compose up -d; then
    log_success "Services restarted"
    sleep 5
    return 0
  else
    log_error "Failed to restart services"
    return 1
  fi
}

verify_rollback() {
  log_info "Verifying rollback..."

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_info "DRY-RUN: Would verify health"
    return 0
  fi

  local retries=5
  for i in $(seq 1 $retries); do
    if curl -s http://localhost:3000/brain/health | grep -q "ok"; then
      log_success "Health check passed"
      return 0
    fi
    if [ $i -lt $retries ]; then
      log_info "Health check attempt $i/$retries, retrying..."
      sleep 2
    fi
  done

  log_error "Health check failed after $retries attempts"
  return 2
}

main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  BUILDLY BRAIN - ROLLBACK PROCEDURE               ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
  echo

  if [ "$DRY_RUN" == "--dry-run" ]; then
    log_warn "Running in DRY-RUN mode (no changes)"
    echo
  fi

  echo "Commit to revert: $COMMIT_TO_REVERT"
  echo "Project root: $PROJECT_ROOT"
  echo

  rollback_git || return 1
  echo

  rollback_docker || return 1
  echo

  restart_services || return 1
  echo

  verify_rollback || return 2
  echo

  echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ ROLLBACK COMPLETED SUCCESSFULLY               ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
  return 0
}

main "$@"
