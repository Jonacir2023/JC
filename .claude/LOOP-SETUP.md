# 🔄 Loop Setup — Automação do Vault JC

Este arquivo explica como configurar e usar os 3 loops automáticos para manutenção do vault.

## 📦 Scripts Disponíveis

### 1️⃣ Weekly Vault Review (Semanal)
**Arquivo**: `.claude/scripts/weekly-vault-review.sh`

**O que faz**:
- ✅ Revisa notas em `08-Notes/`
- ✅ Arquiva notas antigas (> 2 semanas)
- ✅ Conta notas temporárias
- ✅ Gera sumário semanal em `00-Home/Weekly-Summary-WXX.md`

**Como usar**:
```bash
/loop 7d bash .claude/scripts/weekly-vault-review.sh
```

**Saída esperada**:
```
📊 Weekly Summary criado em 00-Home/
- Número de notas: X
- Notas arquivadas: Y
- Tamanho do vault: Z
```

---

### 2️⃣ Daily Vault Sync (Diário)
**Arquivo**: `.claude/scripts/daily-vault-sync.sh`

**O que faz**:
- ✅ Detecta mudanças no vault
- ✅ Faz commit automático com timestamp
- ✅ Push para remote com retry logic (até 4x com backoff)
- ✅ Mostra status de sincronização

**Como usar**:
```bash
/loop 1d bash .claude/scripts/daily-vault-sync.sh
```

**Saída esperada**:
```
📤 Sync Diário
- Mudanças detectadas: X arquivo(s)
- Commit: docs: daily vault sync (2026-06-06 16:00:00)
- Push: ✅ Sucesso
```

---

### 3️⃣ Audit Decisions & Tasks (Semanal)
**Arquivo**: `.claude/scripts/audit-decisions.sh`

**O que faz**:
- ✅ Audita ADRs em `04-Decisions/`
- ✅ Verifica status de tasks em `07-Tasks/`
- ✅ Valida integridade de arquivos críticos
- ✅ Gera relatório em `00-Home/Audit-Report-YYYYMMDD.md`

**Como usar**:
```bash
/loop 7d bash .claude/scripts/audit-decisions.sh
```

**Saída esperada**:
```
🔍 Auditoria
- ADRs totais: X
- Tasks To Do: Y
- Tasks Done: Z
- Relatório: Audit-Report-20260606.md
```

---

## 🎯 Recomendação de Cronograma

```
Segunda-feira 09:00    → /loop 7d audit-decisions.sh (começa na segunda)
Todos os dias 20:00    → /loop 1d daily-vault-sync.sh (sincroniza)
Sexta-feira 18:00      → /loop 7d weekly-vault-review.sh (prepara fim de semana)
```

---

## 🚀 Como Configurar os Loops

### Opção 1: Executar no Terminal
```bash
# Para testar primeiro
bash /home/user/JC/.claude/scripts/weekly-vault-review.sh
bash /home/user/JC/.claude/scripts/daily-vault-sync.sh
bash /home/user/JC/.claude/scripts/audit-decisions.sh

# Para ativar loops (requer /loop skill)
/loop 7d bash .claude/scripts/weekly-vault-review.sh
/loop 1d bash .claude/scripts/daily-vault-sync.sh
/loop 7d bash .claude/scripts/audit-decisions.sh
```

### Opção 2: Configurar em `.claude/settings.json`
```json
{
  "loops": [
    {
      "name": "Weekly Vault Review",
      "command": "bash .claude/scripts/weekly-vault-review.sh",
      "interval": "7d"
    },
    {
      "name": "Daily Vault Sync",
      "command": "bash .claude/scripts/daily-vault-sync.sh",
      "interval": "1d"
    },
    {
      "name": "Audit Decisions",
      "command": "bash .claude/scripts/audit-decisions.sh",
      "interval": "7d"
    }
  ]
}
```

---

## 📊 Saída dos Scripts

Cada script gera:

### Weekly Review
- **Arquivo**: `00-Home/Weekly-Summary-WXX.md`
- **Contém**: Notas processadas, status do vault, próximas ações
- **Exemplo**:
  ```
  # 📊 Weekly Summary — Semana 23/2026
  - Total de notas: 7
  - Notas arquivadas: 3
  - Tamanho: 4.9MB
  ```

### Daily Sync
- **Console output** mostrando:
  - Mudanças detectadas
  - Commit criado
  - Push resultado
- **Git commit** com timestamp automático

### Audit Report
- **Arquivo**: `00-Home/Audit-Report-YYYYMMDD.md`
- **Contém**: Status de ADRs, tasks, integridade
- **Exemplo**:
  ```
  | ADR-0001 | Accepted | 2026-06-06 | OK |
  | ADR-0002 | ❓ Not Defined | - | Define status |
  ```

---

## 🔧 Troubleshooting

### Script não executa
```bash
# Verificar permissões
ls -l .claude/scripts/

# Tornar executável
chmod +x .claude/scripts/*.sh

# Testar manualmente
bash .claude/scripts/weekly-vault-review.sh
```

### Sync falha no push
- O script tenta 4 vezes com backoff exponencial (2s, 4s, 8s, 16s)
- Se falhar, você pode fazer push manual:
  ```bash
  git push origin claude/vibrant-ptolemy-F3b5L
  ```

### Audit não encontra tasks
- Verifique se `07-Tasks/README.md` tem format correto:
  ```markdown
  - [ ] Task não feita
  - [x] Task completa
  ```

---

## 💡 Dicas

1. **Antes de ativar loops**: Teste manualmente uma vez cada
2. **Monitor os logs**: Veja resultados em `git log`
3. **Review semanal**: Abra os relatórios gerados
4. **Ajuste frequência**: Mude intervalos conforme necessário
   - `1d` = 1 dia
   - `7d` = 7 dias
   - `30d` = 30 dias

---

## ✅ Checklist de Setup

- [ ] Scripts estão em `.claude/scripts/`
- [ ] Scripts são executáveis (`chmod +x *.sh`)
- [ ] Testou cada script manualmente
- [ ] Configurou `/loop` para cada automação
- [ ] Verificou que relatórios são gerados em `00-Home/`
- [ ] Commitou os scripts com `git push`

---

**Próximo passo**: Execute `/loop 1d bash .claude/scripts/daily-vault-sync.sh` para começar! 🚀

Referência: [[CLAUDE.md|CLAUDE.md]] | [[00-Home/README|Home]]
