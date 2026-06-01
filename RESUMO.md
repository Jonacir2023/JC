# Resumo do Projeto — Sistema de Gestão de Tarefas (Obra)

## O que foi construído

Sistema completo para criar, registrar e visualizar tarefas de obra, integrando **N8N → GitHub (Obsidian) → Google Sheets → Kanban HTML**.

---

## Arquitetura

```
Líder preenche formulário
        ↓
   N8N (Form Trigger)
        ↓
   Gera nota .md (frontmatter YAML)
        ↓
   GitHub API → vault/Tarefas/TAREFA-{id}-{slug}.md
        ↓
   Google Sheets → aba "Tarefas" (append row)
        ↓
   Tela de confirmação
```

---

## Arquivos no repositório `Jonacir2023/JC` — branch `claude/obsidian-bFFNC`

| Arquivo | Descrição |
|---|---|
| `vault/Recursos/formulario-tarefas.html` | Formulário HTML backup (envia para webhook) com datalist de setores e pessoas |
| `vault/Recursos/kanban-tarefas.html` | Kanban que lê tarefas diretamente do GitHub API |
| `n8n/formulario-tarefas-obsidian.ts` | Cópia de referência do workflow N8N em TypeScript SDK |

---

## N8N — Workflow ativo

- **ID:** `Gd1NFdWTxZHXNPYR`
- **Nome:** Formulário de Tarefas → Obsidian
- **URL pública:** `https://jonacircazelli.app.n8n.cloud/form/nova-tarefa`
- **Webhook backup:** `https://jonacircazelli.app.n8n.cloud/webhook/gestao-tarefas`
- **Credenciais:** Bearer Auth (GitHub Token) + Google Sheets OAuth2

---

## Campos da tarefa

`id` · `assunto` · `descricao` · `criador` · `responsavel` · `setor` · `prioridade` · `data_lancamento` · `previsao_termino` · `status` · `criado_em`

## Status do Kanban (5 colunas)

⬜ Sem Status → 🔵 Aberta → 🟡 Em Andamento → 🟢 Concluída / 🔴 Cancelada

## Setores (19, em ordem alfabética)

Administração, Administração Contratual, Engenharia, Financeiro, Gestão, Jurídico, Medição, Meio Ambiente, Orçamento, Planejamento, Produção Civil, Produção Elétrica, Produção Mecânica, Qualidade, Recursos Humanos, Segurança, Suprimentos, TI, Transporte

---

## Pendente

- Adicionar os ~20 nomes da equipe na lista `PESSOAS` do formulário HTML (campo datalist de Criador/Responsável — atualmente vazio)
- Atualizar a URL da planilha Google Sheets no workflow (está como `COLE_A_URL_DA_PLANILHA_AQUI`)
