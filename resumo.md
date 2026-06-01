# Resumo do Projeto JC

> Use este arquivo para retomar o contexto em novas sessões do Claude.

---

## Repositório

- **GitHub:** `jonacir2023/jc`
- **Branch de desenvolvimento:** `claude/resumo-md-review-5FZpY`
- **Branch principal:** `main`

---

## O que é este projeto

Sistema integrado de gestão de tarefas. Um único formulário web dispara a criação automática em três destinos:

1. **Vault Obsidian** (`vault/`) — nota `.md` criada via GitHub API (sincroniza com Obsidian via plugin `obsidian-git`)
2. **Google Sheets** — linha adicionada na planilha `Tarefas` para acompanhamento
3. **Notion Kanban** — card criado no banco `📋 Tarefas` para gestão visual por status

Também existe um webhook separado que atualiza o status da tarefa no GitHub quando arrastado no Kanban.

---

## Estrutura do Repositório

```
JC/
├── vault/                        # Cofre Obsidian
│   ├── .obsidian/                # Configurações do Obsidian
│   ├── Início.md                 # Painel principal com Dataview
│   ├── Inbox/Entrada.md          # Captura rápida de ideias
│   ├── Tarefas/                  # Tarefas criadas pelo n8n
│   │   ├── Índice de Tarefas.md  # Painel Dataview de tarefas
│   │   ├── TAREFA-1-compra-de-blocos-de-concreto.md
│   │   └── TAREFA-2-liberacao-de-acesso.md
│   ├── Notas/                    # Notas permanentes (Zettelkasten)
│   ├── Projetos/                 # Projetos ativos
│   ├── Recursos/                 # Referências e materiais
│   ├── Templates/                # Templates (Nota, Tarefa, Diário, Projeto)
│   └── Diário/                   # Registro diário
├── n8n/
│   ├── gestao-tarefas-obsidian.ts    # Workflow 1 original (só GitHub)
│   └── atualiza-status-tarefa.ts     # Workflow 2 — Atualiza Status via webhook
├── scripts/
│   └── obsidian_tools.py         # Utilitários Python para o vault
├── resumo.md                     # Este arquivo
├── CLAUDE.md
└── README.md
```

---

## Workflows n8n

### Workflow 1 — Formulário Completo (ID: `Gd1NFdWTxZHXNPYR`) ✅ ATIVO

**Fluxo (7 nós):**
```
FormTrigger (nova-tarefa)
  → Code: gera .md com frontmatter YAML + prepara dados
  → HTTP PUT (GitHub): cria arquivo em vault/Tarefas/
  → Google Sheets: adiciona linha na planilha Tarefas
  → Code: monta payload JSON para Notion API
  → HTTP POST (Notion): cria card no banco 📋 Tarefas
  → Form Completion: exibe confirmação com ID e assunto
```

**URL do formulário:** `https://jonacircazelli.app.n8n.cloud/form/nova-tarefa`

**Campos do formulário:**
| Label | Chave | Obrigatório |
|---|---|---|
| ID da Tarefa | `id` | Sim (incrementar manualmente) |
| Assunto | `assunto` | Sim |
| Descrição | `descricao` | Não |
| Criador | `criador` | Sim |
| Responsável | `responsavel` | Sim |
| Prioridade | `prioridade` | Sim (dropdown: Alta/Média/Baixa) |
| Setor | `setor` | Sim (dropdown: 19 opções) |
| Data de Lançamento | `data_lancamento` | Sim |
| Previsão de Término | `previsao_termino` | Sim |

**Credenciais necessárias (verificar no n8n UI):**
- Nó `HTTP Request` (GitHub PUT) → `Bearer Auth account` (WhCpxC32BntVxpfd) — httpBearerAuth
- Nó `Google Sheets` → `Google Sheets OAuth2 API` (96aqw9aGfS4g49f0) — auto-atribuída
- Nó `HTTP Request 1` (Notion POST) → `Notion account` (ywVPmjRrlcTNtLTy) — predefinedCredentialType

---

### Workflow 2 — Atualiza Status (ID: `IdB16tNSCsm42Yke`) ✅ ATIVO

**Fluxo:**
```
Webhook POST /atualiza-status
  → HTTP GET: busca arquivo no GitHub (obtém SHA)
  → Code: atualiza frontmatter status + adiciona ao histórico
  → HTTP PUT: salva arquivo atualizado no GitHub
  → Set: retorna confirmação ao chamador
```

**Body esperado:** `{ "arquivo": "TAREFA-1-nome.md", "novoStatus": "Em Andamento" }`
**Webhook URL:** `https://jonacircazelli.app.n8n.cloud/webhook/atualiza-status`
**Credencial:** Bearer Auth account (WhCpxC32BntVxpfd) — httpBearerAuth

---

## Destinos de Dados

### Google Sheets

- **ID da planilha:** `1-ef1308cpQcYfCEHJIhPIqYwEfKGusyqbULBRMlUiVU`
- **Aba:** `Tarefas`
- **Colunas:** ID | Assunto | Descrição | Criador | Responsável | Setor | Prioridade | Data de Lançamento | Previsão de Término | Status | Criado em | Arquivo GitHub
- **Credencial n8n:** `Google Sheets OAuth2 API` (96aqw9aGfS4g49f0)

> **Atenção:** A aba `Tarefas` precisa existir com a linha de cabeçalho acima antes da primeira execução.

### Notion — Kanban de Tarefas

- **Banco de dados:** `📋 Tarefas` em `🏗️ Gestão de Obras`
- **Database ID:** `303b3e907f7b4dcf927957ca44367947`
- **URL:** https://www.notion.so/303b3e907f7b4dcf927957ca44367947
- **Credencial n8n:** `Notion account` (ywVPmjRrlcTNtLTy) — notionOAuth2Api

**Views criadas:**
| View | Tipo | Configuração |
|---|---|---|
| `🗂️ Kanban` | Board | Agrupado por Status (Aberta / Em Andamento / Concluída) |
| `📄 Tabela` | Table | Ordenada por Prazo |
| `📅 Por Prazo` | Calendar | Por campo Prazo |
| `🗓️ Timeline` | Timeline | Data de Lançamento → Prazo, agrupado por Setor |

**Campos do banco:**
| Campo | Tipo | Valores |
|---|---|---|
| Assunto | Title | — |
| ID Tarefa | Text | número gerado |
| Status | Select | Aberta / Em Andamento / Concluída |
| Prioridade | Select | 🔴 Alta / 🟡 Média / 🟢 Baixa |
| Setor | Select | 19 opções |
| Responsável | Text | — |
| Criador | Text | — |
| Descrição | Text | — |
| Data de Lançamento | Date | — |
| Prazo | Date | data previsao_termino |
| Arquivo GitHub | Text | nome do .md no repo |

### Vault Obsidian (GitHub)

- **Pasta no repo:** `vault/Tarefas/`
- **Padrão de nome:** `TAREFA-{id}-{assunto-slug}.md`
- **Sincronização local:** Plugin `obsidian-git` aponta para `jonacir2023/jc` branch `main`
- **Frontmatter gerado:** id, assunto, descricao, criador, responsavel, setor, prioridade, data_lancamento, previsao_termino, status, criado_em, tags

---

## Script Python (`scripts/obsidian_tools.py`)

```bash
python scripts/obsidian_tools.py vault/ check-links    # Verifica links quebrados
python scripts/obsidian_tools.py vault/ list-tags      # Lista todas as #tags
python scripts/obsidian_tools.py vault/ find-orphans   # Notas sem links de entrada
python scripts/obsidian_tools.py vault/ export-html    # Exporta notas para HTML
```

---

## Estado Atual (2026-06-01)

| Componente | Estado |
|---|---|
| Workflow 1 (Formulário → GitHub + Sheets + Notion) | ✅ ATIVO — aguarda teste com credenciais verificadas |
| Workflow 2 (Atualiza Status via webhook) | ✅ ATIVO — testado e funcionando (exec 25) |
| Kanban Notion | ✅ Criado com 4 views |
| Google Sheets | ⚠️ Planilha existe, mas aba `Tarefas` precisa de cabeçalho |
| Vault Obsidian | ✅ Estrutura criada — sincronização local requer plugin obsidian-git |
| Script Python | ✅ Concluído |

### Pendente

1. **Verificar credenciais no n8n UI** — Abrir workflow `Gd1NFdWTxZHXNPYR`, confirmar que `HTTP Request` (GitHub) usa "Bearer Auth account" e `HTTP Request 1` (Notion) usa "Notion account"
2. **Criar cabeçalho no Google Sheets** — Na aba `Tarefas`, linha 1: `ID | Assunto | Descrição | Criador | Responsável | Setor | Prioridade | Data de Lançamento | Previsão de Término | Status | Criado em | Arquivo GitHub`
3. **Instalar obsidian-git** — No Obsidian local, instalar plugin Community "obsidian-git" e apontar para o repo `jonacir2023/jc` branch `main`
4. **Testar ciclo completo** — Preencher formulário → verificar arquivo em vault/Tarefas/ no GitHub, linha na planilha e card no Notion
5. **Backfill tarefas antigas** — TAREFA-1 e TAREFA-2 existem no GitHub mas não no Sheets/Notion; adicionar manualmente se necessário
6. **Limpar Notion** — Deletar manualmente páginas vazias: Team Members, OKRs (×2), Recent Decisions, Página Inicial do Espaço de Equipe

---

## Ciclo Completo de uma Tarefa

```
Líder acessa → https://jonacircazelli.app.n8n.cloud/form/nova-tarefa
        ↓
  Preenche o formulário (ID, assunto, datas, setor, prioridade...)
        ↓
  n8n executa automaticamente:
    1. Gera TAREFA-{id}-{slug}.md com frontmatter completo
    2. Cria arquivo em vault/Tarefas/ via GitHub API    → Obsidian sincroniza
    3. Adiciona linha na planilha Google Sheets          → histórico tabular
    4. Cria card no Notion Kanban (status: Aberta)       → visão de equipe
        ↓
  Tela mostra: "✅ Tarefa #X — Assunto criada no GitHub, Planilha e Notion."
        ↓
  Reunião: arrastar card no Kanban (Aberta → Em Andamento → Concluída)
        ↓
  (Futuro) Webhook /atualiza-status → atualiza status no .md do GitHub
```

---

## Como Retomar em Nova Sessão

Cole isto no início da nova conversa:

> "Estou trabalhando no repositório `jonacir2023/jc`, branch `claude/resumo-md-review-5FZpY`. Leia o arquivo `resumo.md` na raiz para entender o contexto do projeto e continue de onde parou."
