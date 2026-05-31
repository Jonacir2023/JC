---
criado: 2026-05-31
tags: [dataview, guia]
---

# Guia do Dataview

O Dataview transforma o cofre em um banco de dados consultável. Você escreve queries em blocos de código `dataview` e o resultado é renderizado dinamicamente.

---

## Exemplos prontos para usar

### Todos os projetos ativos

```dataview
TABLE prazo, área
FROM "Projetos"
WHERE status = "ativo"
SORT prazo ASC
```

### Notas criadas esta semana

```dataview
LIST
FROM ""
WHERE file.ctime >= date(today) - dur(7 days)
SORT file.ctime DESC
```

### Tarefas abertas em todo o cofre

```dataview
TASK
WHERE !completed
GROUP BY file.link
```

### Notas por tag

```dataview
TABLE file.tags AS Tags, file.ctime AS Criado
FROM ""
WHERE length(file.tags) > 0
SORT file.ctime DESC
```

---

## Sintaxe básica

| Palavra-chave | Uso |
|---|---|
| `TABLE` | Mostra colunas |
| `LIST` | Lista simples |
| `TASK` | Lista tarefas |
| `FROM` | Pasta ou tag de origem |
| `WHERE` | Filtro |
| `SORT` | Ordenação |
| `GROUP BY` | Agrupamento |

## Campos úteis automáticos

- `file.name` — nome do arquivo
- `file.link` — link clicável
- `file.ctime` — data de criação
- `file.mtime` — data de modificação
- `file.tags` — lista de tags
- `file.size` — tamanho em bytes

## Relacionado

- [[Notas/Como fazer notas atômicas]]

#dataview #guia
