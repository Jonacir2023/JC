# Resumo do Projeto JC

> Use este arquivo para retomar o contexto em novas sessões do Claude.

---

## Repositório

- **GitHub:** `jonacir2023/jc`
- **Branch de desenvolvimento:** `claude/resumo-md-review-5FZpY`
- **Branch principal:** `main`

---

## O que é este projeto

Sistema pessoal de gestão de tarefas e conhecimento, com duas partes integradas:

1. **Vault Obsidian** (`vault/`) — cofre de notas no padrão Zettelkasten, com Dataview para consultas dinâmicas
2. **Automação n8n** (`n8n/`) — workflow que recebe tarefas via webhook e cria notas Markdown automaticamente no vault via GitHub API

---

## Estrutura do Repositório

```
JC/
├── vault/                        # Cofre Obsidian
│   ├── .obsidian/                # Configurações do Obsidian
│   ├── Início.md                 # Painel principal com Dataview
│   ├── Inbox/Entrada.md          # Captura rápida de ideias
│   ├── Tarefas/                  # Tarefas criadas pelo n8n
│   │   ├── Índice de Tarefas.md  # Painel Dataview de tarefas
│   │   ├── TAREFA-1-compra-de-blocos-de-concreto.md
│   │   └── TAREFA-009-teste-de-energia.md
│   ├── Notas/                    # Notas permanentes (Zettelkasten)
│   ├── Projetos/                 # Projetos ativos
│   ├── Recursos/                 # Referências e materiais
│   ├── Templates/                # Templates (Nota, Tarefa, Diário, Projeto)
│   └── Diário/                   # Registro diário
├── n8n/
│   └── gestao-tarefas-obsidian.ts  # Workflow n8n (SDK)
├── scripts/
│   └── obsidian_tools.py         # Utilitários Python para o vault
├── resumo.md                     # Este arquivo
├── CLAUDE.md
└── README.md
```

---

## Workflow n8n (`gestao-tarefas-obsidian.ts`)

**Fluxo completo:**

```
FormTrigger (URL pública, abre no celular)
  → Code: gera ID sequencial via $getWorkflowStaticData (sem banco externo)
  → Set: mapeia campos para nomes internos padronizados
  → If: valida Prioridade (Baixa | Média | Alta)
  → If: valida Setor (Suprimentos | Transporte | Planejamento | Administração | Segurança)
  → Code: gera nota Markdown com frontmatter YAML
  → HTTP Request: cria arquivo em vault/Tarefas/ via GitHub API (PUT)
  → Set: exibe confirmação na tela do formulário
```

**Campos do formulário (preenchidos pelo usuário — ID é automático):**
| Label no Formulário | Chave interna | Obrigatório |
|---|---|---|
| Assunto | `assunto` | Sim |
| Descricao | `descricao` | Não |
| Criador | `criador` | Sim |
| Responsavel | `responsavel` | Sim |
| Prioridade | `prioridade` | Sim (dropdown) |
| Setor | `setor` | Sim (dropdown) |
| DataLancamento | `data_lancamento` | Sim |
| PrevisaoTermino | `previsao_termino` | Sim |

**ID automático:** gerado pelo n8n via `$getWorkflowStaticData('global').lastId` (incremento sequencial persistente).

**Nome do arquivo gerado:** `TAREFA-{id}-{assunto-slugificado}.md`

---

## Script Python (`scripts/obsidian_tools.py`)

Utilitário CLI para manutenção do vault:

```bash
python scripts/obsidian_tools.py vault/ check-links    # Verifica links quebrados
python scripts/obsidian_tools.py vault/ list-tags      # Lista todas as #tags
python scripts/obsidian_tools.py vault/ find-orphans   # Notas sem links de entrada
python scripts/obsidian_tools.py vault/ export-html    # Exporta notas para HTML
```

---

## Frontmatter das Tarefas

```yaml
---
id: "1"
assunto: "Título da tarefa"
descricao: "Descrição detalhada"
criador: "Nome"
responsavel: "Nome"
setor: "Suprimentos"
prioridade: "Média"          # Alta | Média | Baixa
data_lancamento: "2026-05-31"
previsao_termino: "2026-06-12"
status: Aberta               # Aberta | Concluído
criado_em: "2026-06-01T..."
tags: [tarefa, suprimentos, média]
---
```

---

## Notion — Kanban de Reunião

**Banco de dados:** `📋 Tarefas` dentro de `🏗️ Gestão de Obras`
- **Database ID:** `303b3e907f7b4dcf927957ca44367947`
- **Data Source ID:** `a96d3c71-bd9c-4473-9b4b-13f92894abca`
- **URL:** https://www.notion.so/303b3e907f7b4dcf927957ca44367947

**Views criadas:**
- `🗂️ Kanban` — board agrupado por Status (Aberta / Em Andamento / Concluída)
- `📄 Tabela` — tabela ordenada por Prazo

**Campos do banco:**
| Campo | Tipo | Valores |
|---|---|---|
| Assunto | Title | — |
| ID Tarefa | Text | número gerado pelo n8n |
| Status | Select | Aberta / Em Andamento / Concluída |
| Prioridade | Select | 🔴 Alta / 🟡 Média / 🟢 Baixa |
| Setor | Select | Suprimentos / Transporte / Planejamento / Administração / Segurança |
| Responsável | Text | — |
| Criador | Text | — |
| Descrição | Text | — |
| Data de Lançamento | Date | — |
| Prazo | Date | — |
| Arquivo GitHub | Text | nome do .md no repo |
| Criado em | Created Time | automático |

**Fluxo durante reunião:**
1. Abrir Notion → `🏗️ Gestão de Obras` → `📋 Tarefas` → view `🗂️ Kanban`
2. Arrastar cards entre colunas para atualizar status
3. Todos com acesso à página veem as mudanças em tempo real

**Credencial n8n necessária:** `notionToken` (Notion Integration Token)

---

## Estado Atual

- Workflow n8n: FormTrigger mobile + ID automático + cria em GitHub E Notion
- Kanban Notion criado e configurado em `🏗️ Gestão de Obras`
- Tarefas de exemplo no vault: TAREFA-1 (Blocos de Concreto) e TAREFA-009 (Teste de Energia)
- Script Python de utilitários concluído
- Estrutura do vault Obsidian configurada com templates e índices Dataview

---

## Como Retomar em Nova Sessão

Cole isto no início da nova conversa:

> "Estou trabalhando no repositório `jonacir2023/jc`, branch `claude/resumo-md-review-5FZpY`. Leia o arquivo `resumo.md` na raiz para entender o contexto do projeto e continue de onde parou."
