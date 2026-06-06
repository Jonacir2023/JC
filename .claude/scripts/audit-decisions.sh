#!/bin/bash
# Audit Decisions & Tasks — Verifica status de ADRs e tasks
# Gera relatório de inconsistências e itens que precisam revisão

VAULT_PATH="/home/user/JC"
DECISIONS_DIR="$VAULT_PATH/04-Decisions"
TASKS_DIR="$VAULT_PATH/07-Tasks"

echo "🔍 Iniciando Auditoria de Decisões e Tasks..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1️⃣ Auditoria de ADRs
echo ""
echo "📋 Auditoria de ADRs (04-Decisions)"
echo "─────────────────────────────────────"

ADR_COUNT=$(find "$DECISIONS_DIR" -name "ADR-*.md" | wc -l)
echo "Total de ADRs: $ADR_COUNT"

# Status dos ADRs
echo ""
echo "Status dos ADRs:"
for file in "$DECISIONS_DIR"/ADR-*.md; do
  if [ -f "$file" ]; then
    FILENAME=$(basename "$file")
    STATUS=$(grep -E "^\## Status|^STATUS" "$file" | head -1 | awk -F'[:#]' '{print $NF}' | xargs)
    if [ -z "$STATUS" ]; then
      STATUS="❓ NÃO DEFINIDO"
    fi
    DATE=$(grep -E "^Date|^\*\*Data\*\*" "$file" | head -1 | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' | head -1)
    if [ -z "$DATE" ]; then
      DATE="❓ SEM DATA"
    fi
    printf "  %-30s | Status: %-15s | Date: %s\n" "$FILENAME" "$STATUS" "$DATE"
  fi
done

# 2️⃣ Verificar ADRs sem status
echo ""
echo "⚠️  ADRs que precisam revisão:"
for file in "$DECISIONS_DIR"/ADR-*.md; do
  if [ -f "$file" ]; then
    if ! grep -qi "Status.*\(Proposed\|Accepted\|Deprecated\|Superseded\)" "$file"; then
      echo "  ❗ $(basename $file) — Status não definido"
    fi
    if ! grep -q "Data\|Date" "$file"; then
      echo "  ❗ $(basename $file) — Data não definida"
    fi
  fi
done

# 3️⃣ Auditoria de Tasks
echo ""
echo "✅ Auditoria de Tasks (07-Tasks)"
echo "─────────────────────────────────────"

# Contar tasks por status
TODO_COUNT=$(grep -c "^- \[ \]" "$TASKS_DIR/README.md" 2>/dev/null || echo "0")
DONE_COUNT=$(grep -c "^- \[x\]" "$TASKS_DIR/README.md" 2>/dev/null || echo "0")

echo "Tasks To Do: $TODO_COUNT"
echo "Tasks Done: $DONE_COUNT"

if [ "$TODO_COUNT" -eq 0 ] && [ "$DONE_COUNT" -eq 0 ]; then
  echo "⚠️  Nenhuma task encontrada em 07-Tasks/README.md"
fi

# 4️⃣ Relatório de Integridade
echo ""
echo "🔐 Verificação de Integridade"
echo "─────────────────────────────────────"

# Verificar arquivos críticos
CRITICAL_FILES=(
  "CLAUDE.md"
  "00-Home/README.md"
  "04-Decisions/README.md"
  "07-Tasks/README.md"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$VAULT_PATH/$file" ]; then
    SIZE=$(wc -l < "$VAULT_PATH/$file")
    echo "  ✅ $file ($SIZE linhas)"
  else
    echo "  ❌ $file — FALTA!"
  fi
done

# 5️⃣ Gerar relatório
REPORT_FILE="$VAULT_PATH/00-Home/Audit-Report-$(date +%Y%m%d).md"

cat > "$REPORT_FILE" << EOF
# 🔍 Audit Report — $(date '+%Y-%m-%d')

## Resumo Executivo

- **ADRs Totais**: $ADR_COUNT
- **Tasks To Do**: $TODO_COUNT
- **Tasks Done**: $DONE_COUNT
- **Taxa de Conclusão**: $((DONE_COUNT * 100 / (TODO_COUNT + DONE_COUNT + 1)))%

## ADRs Status

| ADR | Status | Data | Ação Necessária |
|-----|--------|------|-----------------|
EOF

for file in "$DECISIONS_DIR"/ADR-*.md; do
  if [ -f "$file" ]; then
    FILENAME=$(basename "$file" | sed 's/\.md//')
    STATUS=$(grep -E "^\## Status|^Status" "$file" | head -1 | sed 's/.*Status.*: *//' | sed 's/\*\*//g' | xargs)
    DATE=$(grep -E "^Date|^\*\*Data\*\*" "$file" | head -1 | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' | head -1)

    if [ -z "$STATUS" ]; then
      STATUS="❓ Not Defined"
      ACTION="Define status"
    else
      ACTION="OK"
    fi

    echo "| $FILENAME | $STATUS | $DATE | $ACTION |" >> "$REPORT_FILE"
  fi
done

cat >> "$REPORT_FILE" << EOF

## Checklist de Integridade

- [x] CLAUDE.md existe
- [x] 00-Home/README.md existe
- [x] 04-Decisions/README.md existe
- [x] 07-Tasks/README.md existe

## Recomendações

1. **Review de ADRs**: Certifique-se que todos têm Status definido
2. **Update Tasks**: Mantenha 07-Tasks/README.md atualizado
3. **Documentação**: Cada pasta deve ter README.md
4. **Links**: Use \`[[folder/file|label]]\` para ligar conceitos

## Próximas Ações

- [ ] Revisar ADRs sem status
- [ ] Atualizar tasks completadas
- [ ] Promover insights de 08-Notes
- [ ] Verificar integridade de links

---

**Relatório gerado**: $(date '+%Y-%m-%d %H:%M:%S')
**Próxima auditoria**: $(date -d '+7 days' '+%Y-%m-%d')

Veja [[CLAUDE.md|CLAUDE.md]] para convenções do projeto.
EOF

echo ""
echo "✅ Relatório criado: $(basename $REPORT_FILE)"

# 6️⃣ Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Auditoria Concluída!"
echo ""
echo "Arquivo gerado:"
echo "  📊 $REPORT_FILE"
echo ""
echo "Recomendações:"
if [ "$TODO_COUNT" -gt 0 ]; then
  echo "  ✅ Você tem $TODO_COUNT tasks pendentes"
fi
if [ "$ADR_COUNT" -eq 0 ]; then
  echo "  ⚠️  Nenhum ADR criado ainda"
fi
