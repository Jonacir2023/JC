#!/bin/bash
# Weekly Vault Review — Limpeza e organização do vault
# Executa: Revisa 08-Notes, move insights, deleta temporárias, cria sumário

VAULT_PATH="/home/user/JC"
NOTES_DIR="$VAULT_PATH/08-Notes"
HOME_DIR="$VAULT_PATH/00-Home"
ARCHIVE_DIR="$NOTES_DIR/Archive"

echo "🔄 Iniciando Review Semanal do Vault..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1️⃣ Contar notas
NOTES_COUNT=$(find "$NOTES_DIR" -name "*.md" -type f | grep -v README | grep -v Archive | wc -l)
echo "📝 Notas temporárias encontradas: $NOTES_COUNT"

# 2️⃣ Listar notas por idade
echo ""
echo "📅 Notas por data (últimas 2 semanas):"
find "$NOTES_DIR" -name "20*.md" -type f -mtime -14 -exec ls -lh {} \; | awk '{print "  " $9 " (" $5 ")"}'

# 3️⃣ Verificar notas antigas (> 2 semanas)
OLD_NOTES=$(find "$NOTES_DIR" -name "20*.md" -type f -mtime +14)
if [ ! -z "$OLD_NOTES" ]; then
  echo ""
  echo "⚠️  Notas antigas (> 2 semanas) para arquivar:"
  echo "$OLD_NOTES" | while read note; do
    echo "  - $(basename $note)"
  done

  # Criar Archive se não existir
  mkdir -p "$ARCHIVE_DIR"

  # Mover para Archive
  echo "$OLD_NOTES" | while read note; do
    mv "$note" "$ARCHIVE_DIR/" 2>/dev/null
    echo "  ✅ Arquivada: $(basename $note)"
  done
fi

# 4️⃣ Verificar tamanho total
VAULT_SIZE=$(du -sh "$VAULT_PATH" | cut -f1)
echo ""
echo "📦 Tamanho do vault: $VAULT_SIZE"

# 5️⃣ Listar arquivos não-markdown na raiz (lixo?)
echo ""
echo "🧹 Verificando arquivos soltos na raiz:"
find "$VAULT_PATH" -maxdepth 1 -type f ! -name "*.md" ! -name ".gitignore*" ! -name "CLAUDE*" | while read file; do
  if [ "$(basename $file)" != "README.md" ]; then
    echo "  ⚠️  Potencial arquivo de lixo: $(basename $file)"
  fi
done

# 6️⃣ Gerar sumário semanal
WEEK=$(date +"%V")
YEAR=$(date +"%Y")
SUMMARY_FILE="$HOME_DIR/Weekly-Summary-W$WEEK.md"

cat > "$SUMMARY_FILE" << EOF
# 📊 Weekly Summary — Semana $WEEK/$YEAR

**Data**: $(date '+%Y-%m-%d')

## 📝 Atividades da Semana

### Notas Processadas
- Total de notas: $NOTES_COUNT
- Notas arquivadas: $(echo "$OLD_NOTES" | wc -l)

### Status do Vault
- Tamanho: $VAULT_SIZE
- Última revisão: $(date '+%Y-%m-%d %H:%M:%S')

## 🎯 Próximos Passos

- [ ] Revisar notas em [[08-Notes/README|08-Notes]]
- [ ] Promover insights para [[04-Decisions/README|04-Decisions]]
- [ ] Atualizar [[07-Tasks/README|07-Tasks]]
- [ ] Revisar [[CLAUDE.md|CLAUDE.md]]

## 📎 Links
- [[00-Home/README|Home]]
- [[04-Decisions/README|Decisions]]

---
*Gerado automaticamente por weekly-vault-review.sh*
EOF

echo ""
echo "✅ Sumário criado: $(basename $SUMMARY_FILE)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Review Semanal Concluído!"
echo ""
echo "Próximas ações recomendadas:"
echo "1. Abra $SUMMARY_FILE no editor"
echo "2. Revise e promova notas importantes"
echo "3. Delete notas completamente obsoletas"
echo "4. Commit e push: git add . && git commit -m 'docs: weekly vault review'"
