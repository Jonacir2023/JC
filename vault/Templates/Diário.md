---
date: <% tp.date.now("YYYY-MM-DD") %>
semana: <% tp.date.now("W") %>
---

# <% tp.date.now("DD/MM/YYYY") %>

## Como estou

> _(uma linha sobre o estado de espírito)_

## Prioridades do dia

- [ ] 
- [ ] 
- [ ] 

## Notas e pensamentos

## Revisão do dia

**O que foi bem:**

**O que pode melhorar:**

**Captura para o inbox:**

---

### Tarefas abertas de ontem
```dataview
TASK
WHERE !completed AND file.day = date("<% tp.date.yesterday("YYYY-MM-DD") %>")
```

#diário
