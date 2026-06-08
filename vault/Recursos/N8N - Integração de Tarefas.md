---
criado: 2026-06-08
tags: [recurso, n8n, automação, integração]
---

# N8N — Integração de Tarefas

Documentação do workflow N8N que automatiza a criação de tarefas no Obsidian via GitHub.

---

## Arquivo do Workflow

`n8n/gestao-tarefas-obsidian.ts`

---

## Fluxo do Workflow

```
1. Webhook POST /gestao-tarefas
   ↓
2. Mapear campos do formulário
   ↓
3. Validar Prioridade (Baixa | Média | Alta)
   ↓
4. Validar Setor (Suprimentos | Transporte | Planejamento | Administração | Segurança)
   ↓
5. Gerar nota Markdown com frontmatter completo
   ↓
6. Criar arquivo em vault/Tarefas/ via GitHub Contents API (PUT)
   ↓
7. Retornar { status: "ok", mensagem, arquivo }
```

---

## Configuração no N8N

**Credencial necessária:** `httpHeaderAuth`
- Chave: `Authorization`
- Valor: `Bearer <GitHub PAT>`
- Escopo do PAT: `contents:write` no repositório `Jonacir2023/JC`

**Endpoint do webhook:**
```
POST <n8n-base-url>/webhook/gestao-tarefas
```

---

## Payload de Entrada

```json
{
  "Id": "10",
  "Assunto": "Compra de Cimento",
  "Descrição do Assunto": "50 sacos de cimento CP II",
  "Criador": "Jonacir",
  "Responsável": "Aline",
  "Prioridade": "Alta",
  "Setor": "Suprimentos",
  "Data de lançamento": "2026-06-08",
  "Previsão de Término": "2026-06-15"
}
```

---

## Resposta de Sucesso

```json
{
  "status": "ok",
  "mensagem": "Tarefa \"Compra de Cimento\" criada no Obsidian com sucesso.",
  "arquivo": "TAREFA-10-compra-de-cimento.md"
}
```

---

## Como Atualizar o Workflow

1. Edite `n8n/gestao-tarefas-obsidian.ts`
2. Valide com a ferramenta N8N MCP `validate_workflow`
3. Atualize via `update_workflow` (MCP) ou cole o JSON compilado direto no N8N

---

## Relacionado

- [[Notas/Sistema JC - Estrutura e Convenções]]
- [[Tarefas/Índice de Tarefas]]
- [[Projetos/Implantação JC - Obsidian + N8N]]
