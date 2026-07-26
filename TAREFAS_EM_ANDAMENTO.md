# 📋 Tarefas em Andamento - Rastreamento Contínuo

**Última atualização:** 2026-07-26 02:34  
**Próxima revisão:** A cada sessão antes de começar  
**Status do Rastreamento:** ✅ ATIVO

---

## 🚨 INSTRUÇÕES CRÍTICAS PARA CLAUDE

**LEIA ISTO PRIMEIRO EM TODA SESSÃO:**

```
1. Abra este arquivo PRIMEIRO
2. Verifique tarefas em andamento
3. Identifique bloqueadores
4. Retome de onde parou
5. ATUALIZE ao final de cada sessão
```

---

## 📌 Tarefas Ativas

### Template (Copie e preencha)
```
## [ID] - [NOME DA TAREFA]
- **Status:** Aberta | Em Andamento | Bloqueada | Concluída
- **Branch Git:** tarefa/[nome]
- **Último Commit:** [hash] - [mensagem]
- **Data Início:** YYYY-MM-DD
- **Previsão:** YYYY-MM-DD
- **Responsável:** [você/alguém]
- **Prioridade:** 🔴 Alta | 🟡 Média | 🟢 Baixa
- **Bloqueador:** [descrição ou "Nenhum"]
- **Próximo Passo:** [exatamente o que fazer]
- **Notas:** [contexto importante]
```

---

## INSTRUÇÕES PARA CLAUDE (GRAVE ISTO!)

### Ao iniciar uma sessão:
```bash
1. cd /home/user/JC
2. git status
3. Abra TAREFAS_EM_ANDAMENTO.md
4. Identifique: git branch --list
5. Pergunte: "Qual tarefa retomo?"
```

### Ao trabalhar em uma tarefa:
```bash
# Sempre faça commits pequenos e frequentes
git commit -m "tarefa: [descrição] — [progresso %]"

# Atualize este arquivo
# Mude status de "Aberta" → "Em Andamento"
# Atualize "Próximo Passo"
```

### Ao terminar uma sessão:
```bash
# 1. Commit final
git commit -m "tarefa: [nome] — sessão encerrada [progresso]"

# 2. UPDATE este arquivo
# Mude status se concluído
# Descreva o bloqueador (se houver)
# Deixe "Próximo Passo" claro

# 3. PUSH para que fique no histórico
git push -u origin [branch]

# 4. Mensagem final para você
echo "✅ Tarefa salva no git. Próximo: [descrição]"
```

---

## 🔄 Protocolo de Continuidade

**Sempre que você retomar após fechar a aba:**

1. **Eu lerei este arquivo primeiro**
2. **Checarem branch atual:** `git branch`
3. **Verificarei últimos 5 commits:** `git log --oneline -5`
4. **Perguntarei:** "Retomo tarefa [X]? Bloqueador: [Y]?"
5. **Só então começarei a trabalhar**

---

## ⚠️ Protocolo de Bloqueadores

Se algo impedir progresso:

```markdown
### [TAREFA] — BLOQUEADA
- **Razão:** [descrição técnica]
- **Aguardando:** [o que precisa]
- **Contingência:** [o que fazer enquanto isso]
- **Data do Bloqueio:** YYYY-MM-DD HH:mm
```

**Ação:** Comento no commit do bloqueador

---

## 📊 Rastreamento de Sessões

| Data | Tarefa | Tempo | Status | Commits |
|------|--------|-------|--------|---------|
| 2026-07-26 | Setup Logging + Docs | 0.5h | ✅ Concluído | 2 |
| [próxima] | | | | |

---

## 🎯 Checklist de Cada Sessão (para mim)

- [ ] Ler TAREFAS_EM_ANDAMENTO.md
- [ ] Verificar git status
- [ ] Identificar tarefa a retomar
- [ ] Revisar últimos commits
- [ ] Confirmar bloqueador atual
- [ ] Começar trabalho
- [ ] Fazer commits frequentes
- [ ] Atualizar este arquivo
- [ ] PUSH no final

---

## 📝 Notas Globais

- **Idioma:** Português (PT-BR)
- **Convention de Commits:** `tarefa: [descrição] ({id})` ou `status: [file] → [novo status]`
- **Obsidian Vault:** `/home/user/JC/vault/`
- **N8N Workflow:** `/home/user/JC/n8n/gestao-tarefas-obsidian.ts`

---

**Gerado por:** Claude Code  
**Propósito:** Continuidade entre sessões  
**Frequência de Update:** Toda sessão
