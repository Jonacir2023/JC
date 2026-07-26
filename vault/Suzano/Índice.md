---
projeto: Suzano
tags: [projeto, suzano, obra]
---

# 🏗️ Projeto Suzano

## Estrutura

- [[Suzano/Diário]] — Diário de obras diário
- [[Tarefas/Índice de Tarefas]] — Tarefas da obra

## Informações da Obra

| Campo | Valor |
|---|---|
| **Obra** | Suzano |
| **Início** | |
| **Previsão de Término** | |
| **Contratante** | |
| **Contrato** | |

---

## Últimas entradas do diário

```dataview
TABLE file.day AS "Data", assunto AS "Assunto"
FROM "Suzano/Diário"
SORT file.day DESC
LIMIT 10
```
