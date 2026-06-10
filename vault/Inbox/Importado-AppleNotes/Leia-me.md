---
tipo: "Indice"
assunto: "Staging de importação do Apple Notes"
tags: [importacao, apple-notes]
---

# 🍎 Importado do Apple Notes

Pasta de **staging** para notas importadas do app **Notas** do Mac via plugin
**Importer** do Obsidian.

> ⚠️ A importação do Apple Notes só funciona no **Obsidian para Mac** (o
> plugin lê o banco de dados local do app Notas). É uma migração pontual —
> não há sincronização contínua.

## Como importar

1. No Obsidian (no Mac): `Cmd+P → Importer → Apple Notes`.
2. Em **Output folder**, escolha esta pasta: `Inbox/Importado-AppleNotes`.
3. Conclua a importação e sincronize o vault (commit no GitHub).

## Fluxo de triagem

Trate estas notas como **captura rápida** (mesmo espírito de `Inbox/Entrada.md`):

1. Leia cada nota importada.
2. Se for tarefa → crie em `Tarefas/` no padrão `TAREFA-{id}-{assunto}.md`
   (ou envie pelo webhook do N8N `/gestao-tarefas`).
3. Se for conhecimento permanente → reescreva em `Notas/`.
4. Se for referência → mova para `Recursos/`.
5. Apague daqui o que já foi processado.

## Captura contínua (recomendado)

Em vez de continuar usando o Apple Notes, crie um **Atalho (Shortcuts)** no
iPhone/Mac que faça um POST no webhook do N8N
(`<n8n-base-url>/webhook/gestao-tarefas`) — a tarefa cai direto em
`Tarefas/` já formatada.

## Notas em triagem

```dataview
LIST
FROM "Inbox/Importado-AppleNotes"
WHERE file.name != "Leia-me"
SORT file.name ASC
```
