# NotebookLM — Guia de Autenticação Google

**Status:** ⏳ Pendente  
**Data:** 2026-07-29  
**Necessário para:** Session Brain + Geração de Artefatos (podcasts, vídeos, etc)

---

## ⚠️ Pré-requisitos

Você **DEVE fazer isso em um computador com:**
- ✅ Display gráfico (monitor/tela)
- ✅ Navegador web (Chrome, Firefox, Safari)
- ✅ Conexão com internet
- ✅ Conta Google ativa (jonacir70@icloud.com ou equivalente)

**NÃO funciona em:**
- ❌ Servidor remoto sem display
- ❌ iPhone/iPad
- ❌ Ambiente headless

---

## Passo a Passo — Autenticação Local

### 1. Ativar o Virtual Environment

```bash
source ~/.notebooklm-venv/bin/activate
```

**Você deve ver algo assim no terminal:**
```
(.notebooklm-venv) user@machine:~$
```

### 2. Executar o Login

```bash
notebooklm login
```

**O que vai acontecer:**
- ✅ Um navegador vai abrir automaticamente
- ✅ Será redirecionado para Google Login
- ✅ Você vê a tela: "Sign in with Google"

### 3. Fazer Login na Conta Google

1. Digite seu email Google (ex: `jonacir70@icloud.com`)
2. Digite sua senha
3. Se tiver 2FA, complete a verificação
4. **IMPORTANTE:** Quando pedir permissões, clique em **"Allow"** para NotebookLM acessar sua conta

### 4. Aguardar Confirmação

O terminal deve exibir:
```
✓ Autenticado com sucesso como: seu-email@gmail.com
✓ Credenciais salvas em: ~/.notebooklm/profiles/default/storage_state.json
```

### 5. Sair do Virtual Environment (Opcional)

```bash
deactivate
```

---

## ✅ Verificar se Funcionou

Depois da autenticação, execute:

```bash
source ~/.notebooklm-venv/bin/activate
notebooklm auth check
```

**Sucesso:**
```
✓ Autenticado como: seu-email@gmail.com
```

**Falha:**
```
✗ Não autenticado - Execute: notebooklm login
```

---

## 🎯 Próximas Ações Após Autenticação

### 1. Criar o Notebook AI Brain

```bash
notebooklm create "Jonacir's AI Brain" --json
```

Isso vai retornar algo como:
```json
{
  "id": "abc123def456...",
  "name": "Jonacir's AI Brain",
  "created": "2026-07-29T15:30:00Z"
}
```

### 2. Salvar o ID do Notebook

Copie o `id` retornado e crie o arquivo `reference_brain_notebook.md`:

```bash
cat > reference_brain_notebook.md << 'EOF'
# AI Brain Notebook Reference

**Notebook ID:** abc123def456...
**Nome:** Jonacir's AI Brain
**Data de Criação:** 2026-07-29
**Descrição:** Memória semântica de longo prazo de todas as sessões

Este ID é usado pela skill Session Brain para adicionar resumos de sessão automaticamente.
EOF
```

### 3. Listar Notebooks (Verificação)

```bash
notebooklm list --json
```

Você deve ver seu "Jonacir's AI Brain" na lista.

---

## 🧪 Teste Final — Geração de Artefato

Após confirmar que está autenticado, teste a geração de um podcast simples:

```bash
# Criar notebook de teste
notebooklm create "Test Podcast"

# Adicionar uma fonte simples
notebooklm add "https://en.wikipedia.org/wiki/Artificial_intelligence"

# Gerar podcast (isso vai levar ~2-3 minutos)
notebooklm generate podcast --output "test.mp3" --language pt-BR
```

Se o arquivo `test.mp3` foi criado com sucesso, **tudo está funcionando!** 🎉

---

## ⚠️ Troubleshooting

### "Missing X server" / "No display found"
→ Você está em um servidor remoto. Faça isso em computador local.

### "Browser could not open"
→ Abra manualmente: `https://notebooklm.google.com`

### "Authentication timeout"
→ Você tem 10 minutos para completar o login. Se exceder, execute `notebooklm login` novamente.

### "Invalid credentials"
→ Verifique se está usando a conta Google correta.

### "Permission denied"
→ Certifique-se de clicar em **"Allow"** quando NotebookLM pedir permissões.

---

## 📋 Checklist de Conclusão

- [ ] Executei `notebooklm login` em computador com display
- [ ] Fiz login na conta Google com sucesso
- [ ] `notebooklm auth check` retorna "Autenticado"
- [ ] Criei o notebook "Jonacir's AI Brain"
- [ ] Copiei o ID do notebook
- [ ] Criei `reference_brain_notebook.md` com o ID
- [ ] Testei a geração de um podcast/artefato
- [ ] Fiz commit das alterações no Git

---

## 🚀 Após Completar

Uma vez autenticado:

1. **Session Brain vai funcionar automaticamente** quando você digitar "wrap up"
2. **Memórias serão enviadas para AI Brain** notebook
3. **Você pode gerar podcasts, vídeos, apresentações**, etc via NotebookLM CLI
4. **Próxima sessão** terá acesso ao histórico no AI Brain

---

**Status após conclusão:** ✅ Sistema completamente funcional  
**Próximo passo:** Usar Session Brain ao final de cada sessão

