#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STAMP="$(date '+%Y%m%d_%H%M%S')"
REPORT_DIR="$ROOT/relatorios-homologacao"
mkdir -p "$REPORT_DIR"
LOG="$REPORT_DIR/homologacao_${STAMP}.log"
SUMMARY="$REPORT_DIR/homologacao_${STAMP}.md"

exec > >(tee -a "$LOG") 2>&1

status='FAIL'
trap 'code=$?; if [[ $code -eq 0 ]]; then status=PASS; fi; {
  echo "# Relatório de Homologação Local BUILDLy";
  echo;
  echo "- Data local: $(date '+%d/%m/%Y %H:%M:%S')";
  echo "- Versão: 2.2.0-feature-complete";
  echo "- Tag de referência: v2.2.0-feature-complete";
  echo "- Resultado: **$status**";
  echo "- Produção acessada: **NÃO**";
  echo "- Log: $(basename "$LOG")";
  echo;
  if [[ "$status" == PASS ]]; then
    echo "## Conclusão";
    echo "As migrations e os testes locais concluíram sem erro neste ambiente.";
  else
    echo "## Conclusão";
    echo "A homologação local não concluiu. Consulte o log para o ponto exato da falha.";
  fi;
} > "$SUMMARY"; echo; echo "Relatório: $SUMMARY"; exit $code' EXIT

printf '============================================================\n'
printf 'BUILDLy Premium V2.2 FEATURE COMPLETE — HOMOLOGAÇÃO LOCAL COMPLETA\n'
printf '============================================================\n'
printf 'Produção P3: NÃO SERÁ ACESSADA\n'
printf 'Relatório: %s\n\n' "$SUMMARY"

./scripts/verificar_ambiente_mac.sh

printf '\n== Testes estáticos locais antes do banco ==\n'
python3 tests/baseline_check.py
python3 tests/static_check.py
python3 tests/rc_check.py
python3 tests/offline_check.py
if command -v node >/dev/null 2>&1; then
  node tests/smoke.js
  node --check app.js
  node --check data.js
  node --check sw.js
fi

printf '\n== Homologação Supabase local ==\n'
./scripts/preparar_homologacao_local.sh

printf '\n== Validação SQL pós-homologação ==\n'
ENV_OUT="$(supabase status -o env)"
DB_URL="$(printf '%s\n' "$ENV_OUT" | sed -n 's/^DB_URL="\(.*\)"$/\1/p' | tail -1)"
if [[ -n "$DB_URL" ]] && command -v psql >/dev/null 2>&1; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f tests/VALIDACAO_POS_HOMOLOGACAO.sql
else
  printf 'AVISO: psql/DB_URL não disponível; validação adicional SQL foi pulada.\n'
  printf 'Os testes pgTAP do Supabase já foram executados pelo passo anterior.\n'
fi

printf '\nHOMOLOGAÇÃO LOCAL CONCLUÍDA COM SUCESSO.\n'
