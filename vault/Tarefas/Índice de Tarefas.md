---
tags: [índice, tarefas]
---

# Índice de Tarefas

Painel de todas as tarefas recebidas via N8N automaticamente.

---

## Em Aberto

```dataview
TABLE assunto, responsavel, setor, prioridade, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE status != "Concluído" AND file.name != "Índice de Tarefas"
SORT prioridade DESC, previsao_termino ASC
```

## Por Setor

```dataview
TABLE assunto, responsavel, prioridade, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE file.name != "Índice de Tarefas"
GROUP BY setor
SORT previsao_termino ASC
```

## Concluídas

```dataview
TABLE assunto, responsavel, setor
FROM "Tarefas"
WHERE status = "Concluído" AND file.name != "Índice de Tarefas"
SORT file.mtime DESC
LIMIT 20
```

#índice #tarefas
