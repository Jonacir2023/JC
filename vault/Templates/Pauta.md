---
id: <% tp.file.title %>
tipo: Pauta
assunto: 
descricao: 
criador: 
responsavel: 
setor: 
prioridade: 
data_lancamento: <% tp.date.now("YYYY-MM-DD") %>
previsao_termino: 
status: Aberta
tags: [pauta]
---

# 📋 <% tp.file.title %>

| Campo | Valor |
|---|---|
| **Tipo** | Pauta |
| **Setor** | |
| **Prioridade** | |
| **Criador** | |
| **Responsável** | |
| **Data** | <% tp.date.now("DD/MM/YYYY") %> |
| **Prazo** | |

---

## Descrição



---

## Tópicos Discutidos



## Decisões



## Encaminhamentos

- [ ] 

## Anotações



---

## Tarefas Originadas desta Pauta

```dataview
TABLE assunto, responsavel, prioridade, status, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE pauta_ref = this.file.name
SORT data_lancamento ASC
```

## Histórico

- <% tp.date.now("DD/MM/YYYY HH:mm") %> — Pauta criada
