# NavAIgate Session Brain Skill — Guia Completo

**Data:** 2026-07-29  
**Versão:** v1.0  
**Dependência:** NotebookLM Skill (deve estar instalada)

---

## O que é a Skill Session Brain?

A skill **NavAIgate Session Brain** captura o contexto de cada sessão e o persiste em um notebook NotebookLM chamado "AI Brain", criando **memória semântica de longo prazo** sobre:

- Decisões tomadas
- Trabalho concluído
- Aprendizados importantes
- Tópicos em aberto
- Preferências do usuário reveladas

### Objetivo

Transformar conversas isoladas em uma **base de conhecimento contínua** que você pode pesquisar, consultar e gerar relatórios ao longo do tempo.

---

## Como Funciona

### Fluxo em 5 Passos

```
┌─────────────────────────────────────────┐
│ Step 0: Verificar AI Brain Notebook     │
│ (criar se não existir)                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Step 1: Revisar Sessão                  │
│ (decisões, trabalho, aprendizados)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Step 2: Salvar Memórias Localmente      │
│ (feedback, projeto, user, reference)    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Step 3: Criar Sumário da Sessão         │
│ (/tmp/session-summary-YYYY-MM-DD.md)    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Step 4: Enviar para AI Brain             │
│ (notebooklm source add)                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Step 5: Confirmar ao Usuário            │
│ (memórias salvas, status)               │
└─────────────────────────────────────────┘
```

---

## Step 0: Preparar o Notebook AI Brain

### Verificar Notebook Existente

```bash
# Listar notebooks
notebooklm list --json

# Procurar por "AI Brain" ou similar
```

### Se não existir, criar um novo:

```bash
notebooklm create "[Seu Nome]'s AI Brain" --json
```

### Salvar ID do Notebook

Criar arquivo `reference_brain_notebook.md`:

```markdown
# AI Brain Notebook Reference

**Notebook ID:** abc123def456...
**Nome:** Jonacir's AI Brain
**Data de Criação:** 2026-07-29
**Descrição:** Memória semântica de longo prazo de todas as sessões

Este ID é usado pela skill Session Brain para adicionar resumos de sessão.
```

---

## Step 1: Revisar a Sessão

Identificar durante a revisão:

### 🎯 Decisões Tomadas
- O que foi decidido?
- Por quê foi importante?
- Quais eram as alternativas?

**Exemplo:**
> "Decidimos usar NotebookLM CLI ao invés de API direta porque oferece abstrações de melhor nível e suporta autenticação via browser."

### ✅ Trabalho Concluído
- O que foi construído, corrigido, configurado?
- Qual foi o resultado final?

**Exemplo:**
> "Instalação completa do NotebookLM CLI v0.7.3, configuração do environment virtual, documentação de setup."

### 💡 Aprendizados Importantes
- O que foi inesperado?
- Qual insight não era óbvio?

**Exemplo:**
> "Ambientes remoto sem display X11 requerem xvfb para autenticação Playwright. Proxy corporativo pode bloquear downloads de Chromium."

### ⏳ Tópicos em Aberto
- O que ficou pendente?
- O que retomar na próxima sessão?

**Exemplo:**
> "Autenticação Google do NotebookLM pendente (requer display gráfico). Testar geração de podcast após auth."

### 👤 Preferências do Usuário Reveladas
- Como o usuário quer trabalhar?
- Qual é seu fluxo preferido?

**Exemplo:**
> "Usuário prefere documentação detalhada com exemplos de código. Aprecia sumários estruturados em fim de sessão."

---

## Step 2: Salvar Memórias Localmente

### Estrutura de Memória

Manter arquivo de memórias com este índice:

```
MEMORY.md
├── feedback.md       # Correções e abordagens confirmadas
├── project.md        # Contexto, goals, deadlines
├── user.md          # Papel, preferências, conhecimento
└── reference.md     # Recursos externos, tools, sistemas
```

### Cada Memória Deve Incluir

- **Por quê:** Contexto de onde veio
- **Como aplicar:** Ação específica para próximas sessões
- **Data:** Quando foi descoberto
- **Relacionado a:** Links para outras memórias

### Exemplo de Memória

```markdown
# Feedback: Documentação Estruturada Preferida

**Quando:** 2026-07-29 — Session NotebookLM Skill Execution  
**Por quê:** Usuário aprecia guias passo-a-passo com exemplos  
**Como aplicar:** Criar docs com: visão geral → passos numerados → exemplos → troubleshooting  
**Relacionado a:** user.md (preferências de comunicação)

Sempre incluir exemplos de código reais e casos de uso práticos.
```

### Regras Importantes

✓ Não duplicar memórias existentes — atualizar  
✓ Não salvar informações deriváveis de git/código  
✓ Converter datas relativas para absolutas  
✓ Incluir "Por quê" e "Como aplicar"  
✗ Evitar notas genéricas

---

## Step 3: Criar Sumário da Sessão

### Formato Padrão

```markdown
# Session Summary — YYYY-MM-DD

## What We Did
- Instalação do NotebookLM CLI v0.7.3
- Configuração de virtual environment
- Documentação de setup e troubleshooting

## Decisions Made
- Usar NotebookLM CLI em vez de API direta
- Armazenar autenticação em storage_state.json
- Documentar problema de display X11 para referência

## Key Learnings
- Ambientes remoto requerem xvfb para Playwright
- Chromium pré-instalado em /opt/pw-browsers
- Proxy corporativo afeta downloads

## Open Threads
- [ ] Completar autenticação Google
- [ ] Testar geração de artefatos (podcast, vídeo)
- [ ] Instalar session-brain-skill

## Tools & Systems Touched
- GitHub (repositório skyremote/claude-code-notebooklm-skills)
- NotebookLM CLI v0.7.3
- Playwright + Chromium
- Python 3.11 + Virtual Environments
```

### Localização do Arquivo

```bash
/tmp/session-summary-YYYY-MM-DD.md

# Se houver múltiplas sessões no mesmo dia:
/tmp/session-summary-YYYY-MM-DD-2.md
/tmp/session-summary-YYYY-MM-DD-3.md
```

---

## Step 4: Enviar para AI Brain

### Comando

```bash
notebooklm source add /tmp/session-summary-YYYY-MM-DD.md \
  --notebook <BRAIN_NOTEBOOK_ID>
```

### Se CLI não estiver no PATH

```bash
~/.notebooklm-venv/bin/notebooklm source add \
  /tmp/session-summary-YYYY-MM-DD.md \
  --notebook <BRAIN_NOTEBOOK_ID>
```

### Verificar Adição

```bash
notebooklm sources list --notebook <BRAIN_NOTEBOOK_ID>
```

---

## Step 5: Confirmar Conclusão

Mensagem simples confirmando:

✅ **Memórias salvas:** X novas, Y atualizadas  
✅ **Sumário adicionado:** "Session Summary — 2026-07-29"  
✅ **Status do Brain:** Pronto para próxima sessão

Se houver erro de autenticação:  
⚠️ **Memórias salvas localmente** (offline mode)  
⏳ **Brain notebook:** Será sincronizado quando auth funcionar

---

## Tratamento de Erros

### Notebook AI Brain Não Existe

```bash
# Criar novo
notebooklm create "[Nome]'s AI Brain"

# Salvar ID em reference_brain_notebook.md
```

### Autenticação NotebookLM Falha

→ Salvar memórias **localmente** de qualquer forma  
→ Pular push para notebook  
→ Informar usuário que será sincronizado depois

### CLI Not Found

Tentar: `~/.notebooklm-venv/bin/notebooklm`  
Se falhar: instruir usuário a instalar com `pip install notebooklm-py`

### Nada de Significativo para Salvar

Apenas informar que a sessão não teve aprendizados novos  
Não forçar memórias vazias

---

## Pré-requisitos

### ✅ Obrigatório

1. **NotebookLM CLI** instalado
   ```bash
   pip install "notebooklm-py[browser]"
   playwright install chromium
   ```

2. **Autenticação NotebookLM**
   ```bash
   notebooklm login
   ```

3. **Skill NotebookLM** funcionando
   (Ver: NOTEBOOKLM-SKILL-SETUP.md)

### ℹ️ Recomendado

- Arquivo `reference_brain_notebook.md` com ID do notebook
- Estrutura de memórias (feedback.md, project.md, etc)
- Cronograma: executar ao final de cada sessão

---

## Exemplo de Uso Completo

### Fluxo de Fim de Sessão

```bash
# 1. Ativar skill (em Claude Code)
# Usuario diz: "wrap up" ou "/navaigate-session-brain"

# 2. Claude verifica notebook
# Se não existir, cria: "Jonacir's AI Brain"

# 3. Claude revisa sessão
# Identifica: decisões, trabalho, aprendizados, threads

# 4. Claude salva memórias
# Atualiza: feedback.md, project.md, user.md, reference.md

# 5. Claude cria sumário
# Arquivo: /tmp/session-summary-2026-07-29.md

# 6. Claude envia para Brain
notebooklm source add /tmp/session-summary-2026-07-29.md \
  --notebook abc123def456

# 7. Claude confirma
# "✅ 3 memórias salvas (1 nova, 2 atualizadas).
#  ✅ Sumário adicionado ao AI Brain.
#  📌 Open thread: completar auth Google."
```

---

## Integração com Outras Skills

### Com NotebookLM Skill

**NotebookLM** = Criar artefatos (podcasts, vídeos)  
**Session Brain** = Memorizar sessões para contexto futuro

**Fluxo:**
1. Use NotebookLM para gerar conteúdo
2. Ao final, Session Brain captura que isso foi feito
3. Próxima sessão tem contexto dessa geração

### Com Memória Local

**Memory Files** = Conhecimento persistente  
**Session Brain** = Indexação semântica em NotebookLM

**Fluxo:**
1. Session Brain atualiza memory files
2. Session Brain também envia para Brain notebook
3. Você pode pesquisar histórico em NotebookLM

---

## Boas Práticas

### ✅ Faça

- ✅ Executar Session Brain ao final de cada sessão
- ✅ Ser específico em decisões e aprendizados
- ✅ Incluir "Por quê" em cada memória
- ✅ Converter datas relativas para absolutas
- ✅ Atualizar memórias existentes, não criar duplicatas
- ✅ Deixar threads em aberto para retomar depois

### ❌ Evite

- ❌ Memórias genéricas ou vagas
- ❌ Salvar coisas deriváveis do git/código
- ❌ Memórias muito longas (1-3 parágrafos é ideal)
- ❌ Duplicação entre feedback/project/user
- ❌ Esquecer de atualizar reference_brain_notebook.md

---

## Recursos

- **Repositório:** https://github.com/skyremote/claude-code-notebooklm-skills
- **Skill File:** `skills/session-brain-skill.md`
- **Dependência:** NOTEBOOKLM-SKILL-SETUP.md
- **Memory Index:** MEMORY.md (será criado)

---

**Status:** ✅ Documentação Completa — Pronta para Usar

A skill Session Brain transforma conversas isoladas em **memória persistente e pesquisável**.

Próximo passo: Completar autenticação NotebookLM e criar seu "AI Brain" notebook.
