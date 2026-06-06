#!/bin/bash
# Daily Vault Sync — Sincroniza mudanças do vault com Git
# Commit automático + push diário

VAULT_PATH="/home/user/JC"
BRANCH="claude/vibrant-ptolemy-F3b5L"
MAX_RETRIES=4

cd "$VAULT_PATH" || exit 1

echo "📤 Iniciando Sync Diário do Vault..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1️⃣ Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "⚠️  Branch diferente: $CURRENT_BRANCH (esperado: $BRANCH)"
  git checkout "$BRANCH" 2>/dev/null || {
    echo "❌ Não foi possível fazer checkout para $BRANCH"
    exit 1
  }
fi

# 2️⃣ Verificar se há mudanças
CHANGES=$(git status --porcelain | wc -l)
if [ "$CHANGES" -eq 0 ]; then
  echo "✅ Nenhuma mudança para sincronizar"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi

echo "📝 Mudanças detectadas: $CHANGES arquivo(s)"

# 3️⃣ Mostrar o que vai ser commitado
echo ""
echo "Arquivos modificados:"
git status --short | sed 's/^/  /'

# 4️⃣ Fetch para verificar remote
echo ""
echo "🔄 Atualizando informações do remote..."
git fetch origin "$BRANCH" 2>/dev/null || {
  echo "⚠️  Não conseguiu fazer fetch (network issue?)"
}

# 5️⃣ Adicionar arquivos
echo ""
echo "📦 Adicionando mudanças..."
git add . || {
  echo "❌ Erro ao adicionar arquivos"
  exit 1
}

# 6️⃣ Criar commit com mensagem
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="docs: daily vault sync ($TIMESTAMP)"

echo "✏️  Commitando: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" -m "https://claude.ai/code/session_019gGa5uyJrcJFS8viyRh5Th" || {
  echo "❌ Erro ao criar commit"
  exit 1
}

# 7️⃣ Push com retry
echo ""
echo "🚀 Enviando para remote (com retry logic)..."

RETRY_COUNT=0
BACKOFF=2

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if git push origin "$BRANCH" 2>/dev/null; then
    echo "✅ Push realizado com sucesso!"
    RETRY_COUNT=$MAX_RETRIES
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "⚠️  Push falhou. Tentando novamente em ${BACKOFF}s... (tentativa $RETRY_COUNT/$MAX_RETRIES)"
      sleep $BACKOFF
      BACKOFF=$((BACKOFF * 2))
    else
      echo "❌ Push falhou após $MAX_RETRIES tentativas"
      echo "   Você pode fazer push manualmente com: git push origin $BRANCH"
      exit 1
    fi
  fi
done

# 8️⃣ Mostrar status final
echo ""
echo "📊 Status Final:"
echo "  Branch: $(git branch --show-current)"
echo "  Commits a enviar: $(git rev-list --count @{u}..HEAD 2>/dev/null || echo '0')"
echo "  Commits a receber: $(git rev-list --count HEAD..@{u} 2>/dev/null || echo '0')"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Sync Diário Concluído!"
echo ""
echo "Próxima sincronização: $(date -d '+1 day' '+%Y-%m-%d %H:%M:%S')"
