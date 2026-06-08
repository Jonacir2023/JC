---
criado: 2026-06-08
status: ativo
prazo: 2026-06-30
área: Administração
tags: [projeto, implantação, obsidian, n8n]
---

# Implantação JC — Obsidian + N8N

**Status:** 🟡 Em andamento
**Prazo:** 30/06/2026
**Área:** Administração

---

## Objetivo

Ter o sistema de gestão de tarefas 100% operacional:
- Formulário → N8N → GitHub → Obsidian funcionando de ponta a ponta
- Vault organizado e documentado
- Equipe usando o sistema para registrar e acompanhar tarefas

---

## Tarefas

- [x] Criar estrutura do vault no Obsidian
- [x] Criar workflow N8N (`gestao-tarefas-obsidian.ts`)
- [x] Criar templates (Tarefa, Projeto, Nota, Diário)
- [x] Criar índices das pastas (Tarefas, Projetos, Notas, Recursos)
- [x] Testar criação de tarefas via webhook N8N
- [x] Documentar convenções no CLAUDE.md e no vault
- [ ] Configurar credencial GitHub PAT no N8N (ambiente de produção)
- [ ] Conectar formulário de entrada ao webhook N8N
- [ ] Treinar equipe no uso do Obsidian
- [ ] Configurar sincronização automática Obsidian ↔ GitHub

---

## Notas e decisões

- O GitHub é a fonte de verdade — o Obsidian só lê/exibe os arquivos
- Tarefas são criadas exclusivamente via N8N (não manualmente pelo Obsidian)
- O vault usa Dataview para painéis dinâmicos e Templater para templates

---

## Relacionado

- [[Notas/Sistema JC - Estrutura e Convenções]]
- [[Recursos/N8N - Integração de Tarefas]]
- [[Recursos/Scripts de Manutenção do Vault]]
- [[Tarefas/Índice de Tarefas]]
