#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ok=1
line(){ printf '%-28s %s\n' "$1" "$2"; }
has(){ command -v "$1" >/dev/null 2>&1; }

printf 'BUILDLy Premium V2.2.0-fc1 — Verificação de ambiente macOS\n'
printf '=========================================================\n\n'

OS="$(uname -s 2>/dev/null || echo desconhecido)"
ARCH="$(uname -m 2>/dev/null || echo desconhecida)"
line 'Sistema' "$OS"
line 'Arquitetura' "$ARCH"

if [[ "$OS" != "Darwin" ]]; then
  line 'macOS' 'FALHA — este launcher foi preparado para macOS'
  ok=0
else
  line 'macOS' 'OK'
fi

if has brew; then line 'Homebrew' "OK — $(brew --version | head -1)"; else line 'Homebrew' 'OPCIONAL — não encontrado'; fi
if has python3; then line 'Python 3' "OK — $(python3 --version 2>&1)"; else line 'Python 3' 'FALHA'; ok=0; fi
if has node; then line 'Node.js' "OK — $(node --version 2>&1)"; else line 'Node.js' 'AVISO — não encontrado'; fi
if has curl; then line 'curl' 'OK'; else line 'curl' 'FALHA'; ok=0; fi

if has supabase; then
  line 'Supabase CLI' "OK — $(supabase --version 2>&1 | head -1)"
else
  line 'Supabase CLI' 'FALHA — comando supabase não encontrado'
  ok=0
fi

if has docker; then
  if docker info >/dev/null 2>&1; then
    line 'Runtime Docker API' 'OK — ativo'
  else
    line 'Runtime Docker API' 'FALHA — comando existe, runtime não está iniciado'
    ok=0
  fi
else
  line 'Runtime Docker API' 'FALHA — comando docker não encontrado'
  ok=0
fi

printf '\n'
if [[ "$ok" -eq 1 ]]; then
  printf 'RESULTADO: PASS — ambiente pronto para homologação local.\n'
  exit 0
fi

printf 'RESULTADO: BLOQUEADO — ambiente ainda não está pronto.\n\n'
printf 'Este kit NÃO instala software automaticamente. Isso evita alterar seu Mac\n'
printf 'sem consentimento e evita escolher por você um runtime/licença.\n\n'
printf 'Pré-requisitos que precisam estar disponíveis no PATH:\n'
printf '  • Supabase CLI\n'
printf '  • runtime compatível com Docker API iniciado\n'
printf '  • Python 3\n'
printf '  • curl\n'
printf '\nDepois de preparar o ambiente, execute novamente HOMOLOGAR_BUILDLY.command.\n'
exit 2
