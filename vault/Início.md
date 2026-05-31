# Início

Bem-vindo ao seu cofre. Use esta página como painel principal.

---

## Acesso Rápido

- [[Inbox/Entrada|Caixa de Entrada]] — captura rápida de ideias
- [[Tarefas/Índice de Tarefas|Tarefas]] — recebidas via N8N
- [[Projetos/Índice de Projetos|Projetos]] — tudo em andamento
- [[Recursos/Índice de Recursos|Recursos]] — referências e materiais

---

## Tarefas em Aberto (N8N)

```dataview
TABLE assunto, responsavel, setor, prioridade, previsao_termino AS "Prazo"
FROM "Tarefas"
WHERE status != "Concluído" AND file.name != "Índice de Tarefas"
SORT prioridade DESC
LIMIT 5
```

---

## Áreas

| Área | Descrição |
|------|-----------|
| [[Notas/Índice de Notas\|Notas]] | Conhecimento permanente |
| [[Projetos/Índice de Projetos\|Projetos]] | Projetos ativos |
| [[Tarefas/Índice de Tarefas\|Tarefas]] | Tarefas recebidas do N8N |
| Diário | Registro diário |
| [[Recursos/Índice de Recursos\|Recursos]] | Referências e anexos |

---

## Escrever Agora

> Use `Ctrl+N` para criar uma nova nota ou abra o [[Inbox/Entrada|Inbox]] para captura rápida.

#índice
