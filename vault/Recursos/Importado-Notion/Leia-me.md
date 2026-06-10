---
tipo: "Indice"
assunto: "Staging de importação do Notion"
tags: [importacao, notion]
---

# 📥 Importado do Notion

Pasta de **staging** para conteúdo importado do Notion via plugin **Importer** do Obsidian.

## Como importar

1. No Notion: `Settings → Export` do workspace em formato **HTML** (gera um ZIP).
2. No Obsidian (no seu computador): `Ctrl/Cmd+P → Importer → Notion`.
3. Em **Output folder**, escolha esta pasta: `Recursos/Importado-Notion`.
4. Conclua a importação e sincronize o vault (commit no GitHub).

## Fluxo de triagem

Depois de importar, mova cada nota para o destino correto:

| Conteúdo | Destino |
|---|---|
| Tarefas / pendências | `Tarefas/` (no padrão `TAREFA-{id}-{assunto}.md`) |
| Notas permanentes / conhecimento | `Notas/` |
| Projetos | `Projetos/` |
| Referências e anexos | `Recursos/` |

## Normalização automática de tarefas

Notas de databases do Notion chegam com frontmatter próprio. Para converter
para o padrão JC, use o script:

```bash
python scripts/normalize_notion.py "vault/Recursos/Importado-Notion" --dry-run   # pré-visualizar
python scripts/normalize_notion.py "vault/Recursos/Importado-Notion"             # converter
```

O script gera arquivos `TAREFA-{id}-{assunto}.md` em `vault/Tarefas/` com o
frontmatter padronizado (`id`, `tipo`, `assunto`, `setor`, `prioridade`,
`status`, etc.).

## Notas em triagem

```dataview
LIST
FROM "Recursos/Importado-Notion"
WHERE file.name != "Leia-me"
SORT file.name ASC
```
