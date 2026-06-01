#!/bin/bash

# Sincroniza as tarefas do GitHub para o Obsidian Vault (iCloud)
# Uso: bash ~/Documents/JC/scripts/sync-tarefas.sh

REPO="$HOME/Documents/JC"
OBSIDIAN_VAULT="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault"
DESTINO="$OBSIDIAN_VAULT/Tarefas"

# Verifica se o repo local existe
if [ ! -d "$REPO/.git" ]; then
  echo "❌ Repositório não encontrado em $REPO"
  echo "   Execute primeiro: git clone https://github.com/Jonacir2023/JC.git ~/Documents/JC"
  exit 1
fi

# Verifica se o vault do Obsidian existe
if [ ! -d "$OBSIDIAN_VAULT" ]; then
  echo "❌ Vault do Obsidian não encontrado em:"
  echo "   $OBSIDIAN_VAULT"
  echo ""
  echo "   Verifique o nome exato do seu vault com:"
  echo "   ls ~/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/"
  exit 1
fi

echo "🔄 Buscando tarefas novas do GitHub..."
cd "$REPO" && git pull --quiet

echo "📂 Sincronizando para o Obsidian..."
mkdir -p "$DESTINO"
cp -r "$REPO/vault/Tarefas/." "$DESTINO/"

QTDE=$(ls "$DESTINO"/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "✅ Concluído — $QTDE tarefa(s) disponíveis no Obsidian"
echo "   Pasta: $DESTINO"
