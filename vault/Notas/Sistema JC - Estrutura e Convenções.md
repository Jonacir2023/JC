---
criado: 2026-06-08
tags: [nota, sistema, convenções]
---

# Sistema JC — Estrutura e Convenções

Documentação do sistema de gestão de tarefas e projetos construído sobre o Obsidian + N8N + GitHub.

---

## Visão Geral

O repositório **JC** é a fonte única de verdade. O Obsidian lê os arquivos `.md` diretamente do GitHub via sincronização. O N8N automatiza a criação de tarefas via webhook.

```
Formulário → N8N → GitHub API → vault/Tarefas/ → Obsidian
```

---

## Estrutura de Pastas

| Pasta | Finalidade |
|---|---|
| `Tarefas/` | Tarefas criadas automaticamente via N8N |
| `Projetos/` | Projetos ativos com prazo definido |
| `Notas/` | Conhecimento permanente (Zettelkasten) |
| `Recursos/` | Referências, scripts, documentação técnica |
| `Diário/` | Registros diários |
| `Inbox/` | Captura rápida de ideias |
| `Templates/` | Templates do Templater |

---

## Convenções de Tarefas

### Nomenclatura de arquivos

```
TAREFA-{id}-{assunto-em-kebab-case-sem-acentos}.md
```

Exemplos:
- `TAREFA-1-compra-de-blocos-de-concreto.md`
- `TAREFA-009-teste-de-energia.md`

### Campos obrigatórios (frontmatter)

```yaml
id, assunto, descricao, criador, responsavel
setor, prioridade, data_lancamento, previsao_termino
status, criado_em, tags
```

### Valores válidos

| Campo | Valores |
|---|---|
| `setor` | Suprimentos · Transporte · Planejamento · Administração · Segurança |
| `prioridade` | Baixa · Média · Alta |
| `status` | Aberta · Em Andamento · Concluído |

### Emojis de prioridade

🔴 Alta · 🟡 Média · 🟢 Baixa

---

## Plugins Obsidian necessários

- **Dataview** — painéis dinâmicos (queries `dataview`)
- **Templater** — templates com `<% tp.* %>`

---

## Relacionado

- [[Recursos/N8N - Integração de Tarefas]]
- [[Recursos/Scripts de Manutenção do Vault]]
- [[Projetos/Implantação JC - Obsidian + N8N]]
- [[Tarefas/Índice de Tarefas]]
