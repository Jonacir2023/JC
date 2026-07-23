#!/bin/bash
# perf-baseline.sh - Capture performance baselines for Buildly Brain
# Measures: API latency (p95), throughput, DB query time, memory usage
# Exit codes: 0=success, 1=measurement error

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
DATABASE_URL="${DATABASE_URL:-}"
DURATION="${1:-60}"
REQUESTS="${2:-100}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_metric() { echo -e "${GREEN}[METRIC]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

measure_api_latency() {
  log_info "Measuring API latency ($REQUESTS requests)"

  local payload='{
    "query": "Atraso em escavação",
    "obra_id": "staging-001",
    "limit": 5
  }'

  local total_time=0
  local min_time=9999
  local max_time=0
  local times=()

  for i in $(seq 1 $REQUESTS); do
    local start=$(date +%s%N)
    if curl -s -X POST "$API_URL/brain/search" \
      -H "Content-Type: application/json" \
      -d "$payload" > /dev/null 2>&1; then
      local end=$(date +%s%N)
      local elapsed=$(( (end - start) / 1000000 ))  # Convert to ms
      times+=($elapsed)
      total_time=$((total_time + elapsed))

      if [ $elapsed -lt $min_time ]; then min_time=$elapsed; fi
      if [ $elapsed -gt $max_time ]; then max_time=$elapsed; fi
    fi

    if [ $((i % 20)) -eq 0 ]; then
      echo -n "."
    fi
  done
  echo

  local avg=$((total_time / REQUESTS))

  # Calculate P95 percentile
  IFS=$'\n' sorted_times=($(sort -n <<<"${times[*]}"))
  local p95_index=$(( (REQUESTS * 95 / 100) ))
  local p95=${sorted_times[$p95_index]:-0}

  log_metric "API Latency - Min: ${min_time}ms, Max: ${max_time}ms, Avg: ${avg}ms, P95: ${p95}ms"

  # Thresholds
  if [ $p95 -gt 500 ]; then
    log_error "P95 latency ($p95ms) exceeds threshold (500ms)"
    return 1
  fi
}

measure_throughput() {
  log_info "Measuring API throughput (${DURATION}s load test)"

  local payload='{
    "query": "Padrão temporal",
    "obra_id": "staging-001"
  }'

  local start=$(date +%s)
  local count=0

  while [ $(($(date +%s) - start)) -lt $DURATION ]; do
    if curl -s -X POST "$API_URL/brain/search" \
      -H "Content-Type: application/json" \
      -d "$payload" > /dev/null 2>&1; then
      count=$((count + 1))
    fi
  done

  local elapsed=$(($(date +%s) - start))
  local throughput=$((count / elapsed))

  log_metric "Throughput: $throughput requests/sec"

  if [ $throughput -lt 100 ]; then
    log_error "Throughput ($throughput req/s) below threshold (100 req/s)"
    return 1
  fi
}

measure_db_query() {
  log_info "Measuring database query performance"

  if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not set, skipping DB measurement"
    return 0
  fi

  local start=$(date +%s%N)
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM rdo;" > /dev/null
  local end=$(date +%s%N)
  local elapsed=$(( (end - start) / 1000000 ))

  log_metric "Database query time: ${elapsed}ms"

  if [ $elapsed -gt 1000 ]; then
    log_error "DB query time ($elapsed ms) exceeds threshold (1000ms)"
    return 1
  fi
}

measure_memory() {
  log_info "Measuring memory usage"

  if command -v docker &> /dev/null; then
    local mem=$(docker stats --no-stream buildly-intelligence 2>/dev/null | tail -1 | awk '{print $4}')
    if [ -n "$mem" ]; then
      log_metric "Container memory usage: $mem"
    else
      log_error "Could not measure container memory"
    fi
  else
    log_error "Docker not available for memory measurement"
  fi
}

main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  BUILDLY BRAIN - PERFORMANCE BASELINE             ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
  echo
  echo "API URL: $API_URL"
  echo "Duration: ${DURATION}s | Requests: $REQUESTS"
  echo

  measure_api_latency || return 1
  measure_throughput || return 1
  measure_db_query || return 0
  measure_memory || return 0

  echo
  echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ PERFORMANCE BASELINE CAPTURED                 ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
  return 0
}

main "$@"
