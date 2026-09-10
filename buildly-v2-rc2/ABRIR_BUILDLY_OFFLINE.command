#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
HTML="$DIR/BUILDLy_Premium_V2_STANDALONE_OFFLINE.html"

if [ ! -f "$HTML" ]; then
  echo "ERRO: arquivo HTML do BUILDLy não encontrado."
  echo "$HTML"
  read -n 1 -s -r -p "Pressione uma tecla para fechar..."
  exit 1
fi

echo "Abrindo BUILDLy Premium V2.1 RC2 em modo OFFLINE..."
echo "Arquivo local: $HTML"
open "$HTML"
