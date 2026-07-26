#!/bin/bash
# Script de inicialização de sessão - Executar ao começar
# Propósito: Sincronizar estado, verificar tarefas, alertar bloqueadores

set -e

REPO_ROOT="/home/user/JC"
TAREFAS_FILE="$REPO_ROOT/TAREFAS_EM_ANDAMENTO.md"

echo "🔍 === VERIFICAÇÃO DE SESSÃO ==="
echo ""

# 1. Status do Git
echo "📊 Status do Git:"
cd "$REPO_ROOT"
git status --short
echo ""

# 2. Branch atual
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🌳 Branch atual: $CURRENT_BRANCH"
echo ""

# 3. Últimos commits
echo "📝 Últimos 3 commits:"
git log --oneline -3
echo ""

# 4. Tarefas em andamento
echo "📋 Tarefas em Andamento:"
if [ -f "$TAREFAS_FILE" ]; then
    grep -E "^##\s\[|Status:|Próximo Passo:" "$TAREFAS_FILE" | head -20
else
    echo "⚠️  TAREFAS_EM_ANDAMENTO.md não encontrado!"
fi

echo ""
echo "✅ Verificação completa. Você está pronto para continuar."
echo ""
