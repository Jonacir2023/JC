#!/bin/bash
# Publicar RC2 DEMO Release no GitHub
# Uso: ./scripts/publicar_rc2_release.sh
# Requer: git, GitHub token em GITHUB_TOKEN

set -e

REPO_OWNER="Jonacir2023"
REPO_NAME="JC"
TAG="v2.2.0-rc2-demo"
RELEASE_TITLE="BUILDLy Premium V2.2.0 RC2 DEMO"
RELEASE_FILE="ENTREGA_BUILDLY_PREMIUM_V2_2_RC2.md"
STANDALONE_FILE="BUILDLy_Premium_V2_STANDALONE.html"

echo "🚀 Publicando RC2 DEMO Release..."
echo "   Repo: $REPO_OWNER/$REPO_NAME"
echo "   Tag: $TAG"
echo ""

# Verificar GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN não configurado."
  echo "   Configure: export GITHUB_TOKEN=ghp_xxxxx..."
  exit 1
fi

# Verificar arquivos existem
if [ ! -f "$RELEASE_FILE" ]; then
  echo "❌ $RELEASE_FILE não encontrado"
  exit 1
fi

if [ ! -f "$STANDALONE_FILE" ]; then
  echo "❌ $STANDALONE_FILE não encontrado"
  exit 1
fi

# Criar tag local
echo "✓ Criando tag local: $TAG"
git tag -d "$TAG" 2>/dev/null || true
git tag "$TAG"

# Ler release notes
RELEASE_BODY=$(cat "$RELEASE_FILE")

# Criar release via GitHub API
echo "✓ Publicando release no GitHub..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases" \
  -d "{
    \"tag_name\": \"$TAG\",
    \"target_commitish\": \"claude/wonderful-brown-1g6oil\",
    \"name\": \"$RELEASE_TITLE\",
    \"body\": $(echo "$RELEASE_BODY" | jq -R -s .),
    \"draft\": false,
    \"prerelease\": true
  }" > /tmp/release_response.json

# Verificar resposta
if grep -q '"id"' /tmp/release_response.json; then
  RELEASE_ID=$(jq -r '.id' /tmp/release_response.json)
  UPLOAD_URL=$(jq -r '.upload_url' /tmp/release_response.json | sed 's/{?name,label}//')

  echo "✓ Release criada (ID: $RELEASE_ID)"
  echo "✓ Fazendo upload de $STANDALONE_FILE..."

  # Upload arquivo
  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@$STANDALONE_FILE" \
    "$UPLOAD_URL?name=$STANDALONE_FILE" > /dev/null

  echo "✓ Upload concluído"
  echo ""
  echo "✅ RC2 DEMO Release publicada com sucesso!"
  echo "   URL: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$TAG"
  echo ""
  echo "🎉 Próximos passos:"
  echo "   1. Compartilhar link com stakeholders"
  echo "   2. Solicitar feedback estruturado"
  echo "   3. Coordenar homologação local quando Docker/Supabase CLI disponível"
else
  echo "❌ Erro ao criar release:"
  cat /tmp/release_response.json
  exit 1
fi
