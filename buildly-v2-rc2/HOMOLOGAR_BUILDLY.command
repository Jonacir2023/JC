#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

clear 2>/dev/null || true
printf 'BUILDLy Premium V2.1 RC2\n'
printf 'Homologação local segura — produção não será acessada\n'
printf '=====================================================\n\n'

./scripts/homologar_local_completo.sh
CODE=$?

printf '\n'
if [[ "$CODE" -eq 0 ]]; then
  printf 'SUCESSO: homologação local concluída.\n'
else
  printf 'HOMOLOGAÇÃO NÃO CONCLUÍDA (código %s).\n' "$CODE"
  printf 'Veja a pasta relatorios-homologacao para o log detalhado.\n'
fi

printf '\nPressione ENTER para fechar esta janela... '
read -r _
exit "$CODE"
