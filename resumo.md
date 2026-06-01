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

## Estado Atual

- Workflow n8n atualizado: FormTrigger mobile + ID automático via Static Data
- Tarefas de exemplo no vault: TAREFA-1 (Blocos de Concreto) e TAREFA-009 (Teste de Energia)
- Script Python de utilitários concluído
- Estrutura do vault Obsidian configurada com templates e índices Dataview

---

## Como Retomar em Nova Sessão

Cole isto no início da nova conversa:

> "Estou trabalhando no repositório `jonacir2023/jc`, branch `claude/resumo-md-review-5FZpY`. Leia o arquivo `resumo.md` na raiz para entender o contexto do projeto e continue de onde parou."
