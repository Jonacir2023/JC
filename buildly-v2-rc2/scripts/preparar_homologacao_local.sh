#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail(){ echo "ERRO: $*" >&2; exit 1; }
command -v supabase >/dev/null 2>&1 || fail "Supabase CLI não instalado."
command -v docker >/dev/null 2>&1 || fail "runtime Docker-compatible não está expondo o comando docker."
docker info >/dev/null 2>&1 || fail "runtime de containers não está iniciado."

if [[ ! -f supabase/config.toml ]]; then
  supabase init
fi

mkdir -p supabase/migrations supabase/tests
rm -f supabase/migrations/*.sql supabase/tests/*.sql

files=(
  00_v1_schema_baseline.sql
  01_seguranca.sql
  02_hardening.sql
  03_rls_multiobra.sql
  04a_permissoes.sql
  04b_rbac.sql
  05_eap_cbs_orcamento.sql
  06_contratos_premium.sql
  07_motor_compromissos.sql
  08_posicao_financeira.sql
  09_planejamento.sql
  10_documentos_premium.sql
  11_auditoria.sql
  12_rls_premium.sql
  13_workflows_financeiros.sql
  14_suprimentos.sql
)

n=0
for f in "${files[@]}"; do
  [[ -f "sql/$f" ]] || fail "arquivo ausente: sql/$f"
  printf -v stamp '20260906%06d' "$n"
  cp "sql/$f" "supabase/migrations/${stamp}_${f}"
  n=$((n+1))
done
cp tests/seed_homologacao.sql supabase/seed.sql
cp tests/pgtap/*.sql supabase/tests/

printf '\n== Iniciando Supabase local ==\n'
supabase start
printf '\n== Reconstruindo banco do zero ==\n'
supabase db reset
printf '\n== Criando usuários artificiais ==\n'
./scripts/criar_usuarios_teste.sh
printf '\n== Testes pgTAP ==\n'
supabase test db
printf '\n== Lint do banco ==\n'
supabase db lint --level warning || true
printf '\n== Status local ==\n'
supabase status
printf '\nHOMOLOGAÇÃO LOCAL PREPARADA. Produção não foi acessada nem alterada.\n'
