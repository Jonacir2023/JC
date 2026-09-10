#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "ERRO: Supabase CLI não encontrado." >&2
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "ERRO: curl não encontrado." >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "ERRO: python3 não encontrado." >&2
  exit 1
fi

ENV_OUT="$(supabase status -o env)"
get_env(){ printf '%s\n' "$ENV_OUT" | sed -n "s/^$1=\"\(.*\)\"$/\1/p" | tail -1; }
API_URL="$(get_env API_URL)"
SERVICE_ROLE_KEY="$(get_env SERVICE_ROLE_KEY)"

if [[ -z "$API_URL" || -z "$SERVICE_ROLE_KEY" ]]; then
  echo "ERRO: não foi possível obter API_URL/SERVICE_ROLE_KEY de 'supabase status -o env'." >&2
  exit 1
fi

PASSWORD='Teste123!Buildly'
OBRA_A='10000000-0000-0000-0000-000000000001'
OBRA_B='10000000-0000-0000-0000-000000000002'

find_user_id(){
  local email="$1"
  curl -fsS "$API_URL/auth/v1/admin/users?page=1&per_page=1000" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" |
  python3 -c 'import json,sys; email=sys.argv[1]; d=json.load(sys.stdin); users=d.get("users",d if isinstance(d,list) else []); print(next((u.get("id","") for u in users if u.get("email")==email),""))' "$email"
}

create_user(){
  local email="$1" nome="$2"
  local payload
  payload="$(python3 -c 'import json,sys; print(json.dumps({"email":sys.argv[1],"password":sys.argv[2],"email_confirm":True,"user_metadata":{"nome":sys.argv[3]}}))' "$email" "$PASSWORD" "$nome")"
  curl -fsS -X POST "$API_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' \
    -d "$payload" |
  python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'
}

patch_profile(){
  local id="$1" papel="$2" obra="$3" global="$4"
  local obra_json payload
  if [[ "$obra" == "null" ]]; then obra_json='null'; else obra_json="\"$obra\""; fi
  payload="{\"papel\":\"$papel\",\"obra_id\":$obra_json,\"acesso_global\":$global,\"ativo\":true}"
  curl -fsS -X PATCH "$API_URL/rest/v1/perfis?id=eq.$id" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' \
    -H 'Prefer: return=minimal' \
    -d "$payload" >/dev/null
}

ensure_user(){
  local email="$1" nome="$2" papel="$3" obra="$4" global="$5"
  local id
  id="$(find_user_id "$email")"
  if [[ -z "$id" ]]; then
    id="$(create_user "$email" "$nome")"
    echo "Criado: $email"
  else
    echo "Existe: $email"
  fi
  patch_profile "$id" "$papel" "$obra" "$global"
}

ensure_user 'proprietario@teste.local' 'Proprietário TESTE' 'gestor' null true
ensure_user 'gestor.a@teste.local' 'Gestor TESTE A' 'gestor' "$OBRA_A" false
ensure_user 'gestor.b@teste.local' 'Gestor TESTE B' 'gestor' "$OBRA_B" false
ensure_user 'engenheiro.a@teste.local' 'Engenheiro TESTE A' 'engenheiro' "$OBRA_A" false
ensure_user 'tecnico.a@teste.local' 'Técnico TESTE A' 'tecnico' "$OBRA_A" false
ensure_user 'analista.a@teste.local' 'Analista TESTE A' 'analista' "$OBRA_A" false
ensure_user 'encarregado.a@teste.local' 'Encarregado TESTE A' 'encarregado' "$OBRA_A" false
ensure_user 'apontador.a@teste.local' 'Apontador TESTE A' 'apontador' "$OBRA_A" false
ensure_user 'administrativo.a@teste.local' 'Administrativo TESTE A' 'administrativo' "$OBRA_A" false
ensure_user 'eng.medicoes.a@teste.local' 'Eng. Medições TESTE A' 'engenheiro' "$OBRA_A" false
ensure_user 'eng.planejamento.a@teste.local' 'Eng. Planejamento TESTE A' 'engenheiro' "$OBRA_A" false
ensure_user 'eng.completo.a@teste.local' 'Eng. Completo TESTE A' 'engenheiro' "$OBRA_A" false

echo
echo "Usuários locais TESTE preparados. Senha comum: $PASSWORD"
echo "A senha é exclusivamente para a homologação local e nunca deve ser reutilizada fora dela."
