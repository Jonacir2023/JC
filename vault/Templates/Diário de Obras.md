<%*
await tp.file.move("/Suzano/Diário/" + tp.date.now("YYYY-MM-DD"))
%>---
date: <% tp.date.now("YYYY-MM-DD") %>
dia_semana: <% tp.date.now("dddd", 0, "pt-BR") %>
semana: <% tp.date.now("W") %>
obra: Suzano
tipo: diario-obras
tags: [diario, suzano, obra]
---

# 📋 Diário de Obras — <% tp.date.now("DD/MM/YYYY") %>

**Obra:** Suzano  
**Data:** <% tp.date.now("DD/MM/YYYY, dddd") %>  
**Responsável:** 

---

## Condições do Dia

| Item | Situação |
|---|---|
| **Clima** | ☀️ / 🌧️ / ⛅ |
| **Temperatura** | °C |
| **Equipe presente** | pessoas |

---

## Atividades Realizadas

### Produção Civil
- 

### Produção Elétrica
- 

### Produção Mecânica
- 

---

## Ocorrências / Não Conformidades

- [ ] Nenhuma ocorrência

> _(Descreva qualquer incidente, acidente, não conformidade ou desvio)_

---

## Equipamentos e Materiais

**Equipamentos em operação:**
- 

**Materiais recebidos:**
- 

**Materiais em falta:**
- 

---

## Visitas / Reuniões

- 

---

## Pendências para Amanhã

- [ ] 
- [ ] 

---

## Fotos / Anexos

> _(Adicione links ou referências para fotos do dia)_

---

## Tarefas abertas

```dataview
TASK
WHERE !completed AND contains(file.tags, "suzano")
```

#diario #suzano #obra
