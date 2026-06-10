---
tags: [índice, tarefas]
---

# Índice de Tarefas

Painel de todas as tarefas, check-ins e pautas recebidos via N8N automaticamente.

---

## Tarefas em Aberto

```dataview
TABLE assunto, responsavel, setor, prioridade, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE (tipo = "Tarefa" OR tipo = null) AND status != "Concluído" AND file.name != "Índice de Tarefas"
SORT prioridade DESC, previsao_termino ASC
```

## Check-ins em Aberto

```dataview
TABLE assunto, responsavel, setor, prioridade, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE tipo = "Checkin" AND status != "Concluído" AND file.name != "Índice de Tarefas"
SORT previsao_termino ASC
```

## Pautas em Aberto

```dataview
TABLE assunto, responsavel, setor, prioridade, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE tipo = "Pauta" AND status != "Concluído" AND file.name != "Índice de Tarefas"
SORT previsao_termino ASC
```

## Por Setor

```dataview
TABLE assunto, tipo, responsavel, prioridade, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE file.name != "Índice de Tarefas"
GROUP BY setor
SORT previsao_termino ASC
```

## Concluídos

```dataview
TABLE assunto, tipo, responsavel, setor
FROM "Tarefas"
WHERE status = "Concluído" AND file.name != "Índice de Tarefas"
SORT file.mtime DESC
LIMIT 20
```

#índice #tarefas
