#!/bin/bash
# smoke-tests.sh - 5 functional smoke tests for Buildly Brain Phase 3
# Tests: health check, search endpoint, DB query, Neo4j pattern, Redis PING
# Exit codes: 0=all pass, 1=test failure

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3000}"
DB_URL="${DATABASE_URL:-}"
REDIS_URL="${REDIS_URL:-}"
NEO4J_URI="${NEO4J_URI:-}"

passed=0
failed=0

log_test() { echo -e "${BLUE}[TEST]${NC} $*"; }
log_pass() { echo -e "${GREEN}[✓]${NC} $*"; ((passed++)); }
log_fail() { echo -e "${RED}[✗]${NC} $*"; ((failed++)); }

test_health_check() {
  log_test "Health check endpoint"
  if response=$(curl -s -w "\n%{http_code}" "$API_URL/brain/health"); then
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" == "200" ]; then
      log_pass "Health check returned 200 OK"
    else
      log_fail "Health check returned $http_code (expected 200)"
    fi
  else
    log_fail "Health check endpoint unreachable"
  fi
}

test_search_endpoint() {
  log_test "Search endpoint (POST /brain/search)"
  local payload='{
    "query": "Chuva em escavação",
    "obra_id": "staging-001",
    "limit": 5
  }'

  if response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/brain/search" \
    -H "Content-Type: application/json" \
    -d "$payload"); then
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
      log_pass "Search endpoint returned $http_code"
    else
      log_fail "Search endpoint returned $http_code (expected 200/201)"
    fi
  else
    log_fail "Search endpoint unreachable"
  fi
}

test_db_query() {
  log_test "PostgreSQL query execution"
  if [ -z "$DB_URL" ]; then
    log_fail "DATABASE_URL not set, skipping"
    return
  fi

  if psql "$DB_URL" -c "SELECT COUNT(*) FROM rdo LIMIT 1" &>/dev/null; then
    count=$(psql "$DB_URL" -tc "SELECT COUNT(*) FROM rdo" | tr -d ' ')
    log_pass "PostgreSQL query OK (found $count RDOs)"
  else
    log_fail "PostgreSQL query failed"
  fi
}

test_redis_ping() {
  log_test "Redis connectivity (PING)"
  if [ -z "$REDIS_URL" ]; then
    log_fail "REDIS_URL not set, skipping"
    return
  fi

  if response=$(redis-cli -u "$REDIS_URL" ping 2>/dev/null); then
    if [ "$response" == "PONG" ]; then
      log_pass "Redis PING returned PONG"
    else
      log_fail "Redis PING returned: $response"
    fi
  else
    log_fail "Redis connection failed"
  fi
}

test_neo4j_pattern() {
  log_test "Neo4j pattern detection (mock)"
  if [ -z "$NEO4J_URI" ]; then
    log_fail "NEO4J_URI not set, skipping"
    return
  fi

  local query='MATCH (l:Lesson) RETURN COUNT(l) AS lesson_count LIMIT 1'
  if curl -s -u neo4j:"${NEO4J_PASSWORD:-}" \
    -X POST "${NEO4J_URI}/db/neo4j/cypher" \
    -H "Content-Type: application/json" \
    -d "{\"statements\": [{\"statement\": \"$query\"}]}" &>/dev/null; then
    log_pass "Neo4j pattern query OK"
  else
    log_fail "Neo4j pattern query failed"
  fi
}

main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  BUILDLY BRAIN - SMOKE TESTS SUITE                ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
  echo
  echo "API URL: $API_URL"
  echo

  test_health_check
  test_search_endpoint
  test_db_query
  test_redis_ping
  test_neo4j_pattern

  echo
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  RESULTS: ${GREEN}$passed passed${NC}${BLUE}, ${RED}$failed failed${NC}${BLUE}                 ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"

  [ $failed -eq 0 ] && return 0 || return 1
}

main "$@"
