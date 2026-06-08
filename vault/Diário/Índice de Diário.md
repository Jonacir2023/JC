---
tags: [índice, diário]
---

# Índice de Diário de Obras

Registro diário das atividades de obra, criados automaticamente via N8N + Supabase.

---

## Registros Recentes

```dataview
TABLE obra, responsavel, setor, clima, efetivo, status
FROM "Diário"
WHERE file.name != "Índice de Diário"
SORT data DESC
LIMIT 10
```

---

## Por Obra

```dataview
TABLE data, responsavel, status
FROM "Diário"
WHERE file.name != "Índice de Diário"
GROUP BY obra
SORT data DESC
```

---

## Em Aberto

```dataview
TABLE obra, responsavel, setor, data
FROM "Diário"
WHERE status != "Concluído" AND file.name != "Índice de Diário"
SORT data DESC
```

---

## Concluídos

```dataview
TABLE obra, responsavel, setor, data
FROM "Diário"
WHERE status = "Concluído" AND file.name != "Índice de Diário"
SORT data DESC
LIMIT 20
```

#índice #diário
