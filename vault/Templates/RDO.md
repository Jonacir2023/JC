<%*
const filtro = await tp.system.suggester(
  ["Filtro 1","Filtro 2","Filtro 3","Filtro 4","Filtro 5","Filtro 6","Filtro 7","Filtro 8","Filtro 9","Filtro 10"],
  ["Filtro 1","Filtro 2","Filtro 3","Filtro 4","Filtro 5","Filtro 6","Filtro 7","Filtro 8","Filtro 9","Filtro 10"],
  false,
  "Selecione o Filtro"
);
const num = filtro.replace("Filtro ", "");
const fileName = "RDO F" + num + " - " + tp.date.now("YYYY-MM-DD");
await tp.file.move("/Suzano/" + filtro + "/" + fileName);
%>---
date: <% tp.date.now("YYYY-MM-DD") %>
filtro: <% filtro %>
obra: Suzano
tipo: rdo
responsavel: 
tags: [rdo, suzano, <% filtro.toLowerCase().replace(" ", "-") %>]
---

# 📋 RDO — <% filtro %> — <% tp.date.now("DD/MM/YYYY") %>

**Obra:** Suzano | **<% filtro %>** | **<% tp.date.now("DD/MM/YYYY, dddd") %>**

---

## Condições Climáticas

| Período | Condição | Temperatura |
|---|---|---|
| Manhã | | °C |
| Tarde | | °C |

---

## Efetivo em Campo

| Função | Qtd | Empresa |
|---|---|---|
| | | |
| | | |
| | | |
| **Total** | | |

---

## Atividades Realizadas

- 
- 
- 

---

## Equipamentos em Operação

| Equipamento | Qtd | Horas |
|---|---|---|
| | | |
| | | |

---

## Materiais

**Recebidos:**
- 

**Consumidos:**
- 

**Em falta:**
- 

---

## Ocorrências / Não Conformidades

- [ ] Nenhuma ocorrência

> _(Descreva incidentes, acidentes, não conformidades ou desvios)_

---

## Visitas / Reuniões

- 

---

## Pendências para Amanhã

- [ ] 
- [ ] 

---

## Fotos do Dia

> _(Cole links ou referências das fotos)_

---

## Aprovações

| Função | Nome | Assinatura |
|---|---|---|
| Responsável Técnico | | |
| Fiscal | | |

#rdo #suzano
