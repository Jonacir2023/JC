# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Repository Overview

**JC** is a task and project management system built on Obsidian as the knowledge vault, with N8N automating task ingestion from forms/webhooks into Markdown notes. The repository serves as the single source of truth synced to the Obsidian vault via GitHub.

**Language:** Portuguese (PT-BR) — all notes, field names, commit messages, and status values are in Portuguese.

---

## Directory Structure

```
JC/
├── vault/                  # Obsidian vault (the actual notes)
│   ├── Início.md           # Dashboard / home page
│   ├── Inbox/              # Quick capture (Entrada.md)
│   ├── Tarefas/            # Tasks created automatically via N8N
│   ├── Projetos/           # Active projects
│   ├── Notas/              # Permanent/atomic notes (Zettelkasten)
│   ├── Recursos/           # References and attachments
│   ├── Diário/             # Daily notes
│   └── Templates/          # Templater templates
│       ├── Tarefa.md
│       ├── Projeto.md
│       ├── Nota.md
│       └── Diário.md
├── n8n/
│   └── gestao-tarefas-obsidian.ts   # N8N workflow (SDK format)
├── scripts/
│   └── obsidian_tools.py   # CLI vault maintenance tools
└── CLAUDE.md
```

---

## Obsidian Vault Conventions

### Task Files (`vault/Tarefas/`)

Tasks are created automatically by N8N via GitHub API. File naming:

```
TAREFA-{id}-{assunto-em-kebab-case-sem-acentos}.md
```

Examples: `TAREFA-1-compra-de-blocos-de-concreto.md`, `TAREFA-009-teste-de-energia.md`

**Frontmatter fields (mandatory):**

```yaml
---
id: "string"
assunto: "string"
descricao: "string"
criador: "string"
responsavel: "string"
setor: "Suprimentos|Transporte|Planejamento|Administração|Segurança"
prioridade: "Baixa|Média|Alta"
data_lancamento: "YYYY-MM-DD"
previsao_termino: "YYYY-MM-DD"
status: "Aberta|Em Andamento|Concluído"
criado_em: "ISO 8601 timestamp"
tags: [tarefa, {setor_lowercase}, {prioridade_lowercase}]
---
```

**Status values:** `Aberta` → `Em Andamento` → `Concluído`

**Priority emojis:** 🔴 Alta · 🟡 Média · 🟢 Baixa

### Updating Task Status

When changing `status` in a task file, always append an entry to the **Histórico** section:

```
- {DD/MM/YYYY, HH:mm:ss} — Status alterado para "{novo status}"
```

### Commit Messages for Task Files

```
tarefa: adiciona {Assunto} ({id})          # new task
status: {filename} → {new status}          # status update
tarefa: atualiza {Assunto} ({id})          # general update
```

---

## N8N Workflow (`n8n/gestao-tarefas-obsidian.ts`)

The workflow receives a POST webhook at `/gestao-tarefas` and:

1. Maps form fields to normalized internal names
2. Validates `prioridade` (Baixa | Média | Alta)
3. Validates `setor` (Suprimentos | Transporte | Planejamento | Administração | Segurança)
4. Generates a Markdown note with full frontmatter and body
5. Creates the file in `vault/Tarefas/` via GitHub Contents API (PUT)
6. Returns a JSON confirmation `{ status: "ok", mensagem, arquivo }`

**Credential required in N8N:** `httpHeaderAuth` credential with key `Authorization` and value `Bearer <GitHub PAT>` (needs `contents:write` scope on `Jonacir2023/JC`).

**Webhook path:** `POST <n8n-base-url>/webhook/gestao-tarefas`

**Input payload example:**

```json
{
  "Id": "10",
  "Assunto": "Compra de Cimento",
  "Descrição do Assunto": "50 sacos de cimento CP II",
  "Criador": "Jonacir",
  "Responsável": "Aline",
  "Prioridade": "Alta",
  "Setor": "Suprimentos",
  "Data de lançamento": "2026-06-08",
  "Previsão de Término": "2026-06-15"
}
```

To deploy/update the workflow in N8N, use the N8N MCP tools (`create_workflow_from_code` or `update_workflow`).

---

## Obsidian Plugins Required

The vault relies on these community plugins:

- **Dataview** — powers all `dataview` query blocks in index files
- **Templater** — powers `<% tp.* %>` expressions in `vault/Templates/`

---

## Python Maintenance Scripts (`scripts/obsidian_tools.py`)

CLI tool for vault health checks:

```bash
python scripts/obsidian_tools.py vault/ check-links    # detect broken [[wikilinks]]
python scripts/obsidian_tools.py vault/ list-tags      # list all #tags
python scripts/obsidian_tools.py vault/ find-orphans   # notes with no incoming links
python scripts/obsidian_tools.py vault/ export-html --out export/  # static HTML export
```

---

## Working with This Repository

### Adding a New Task Manually

1. Create `vault/Tarefas/TAREFA-{id}-{kebab-assunto}.md` following the template above.
2. Commit: `tarefa: adiciona {Assunto} ({id})`

### Changing Task Status

1. Edit the `status:` frontmatter field in the task file.
2. Append a line to the **Histórico** section.
3. Commit: `status: {filename} → {new status}`

### Adding Vault Notes

Place notes in the appropriate folder: `Notas/` for permanent notes, `Projetos/` for project files, `Recursos/` for references. Use `[[wikilinks]]` to cross-reference.

### Updating N8N Workflow

Edit `n8n/gestao-tarefas-obsidian.ts`, then deploy via N8N MCP or paste the compiled JSON into N8N. Validate the workflow logic with `validate_workflow` before deploying.
