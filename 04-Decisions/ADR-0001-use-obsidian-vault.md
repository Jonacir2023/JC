# ADR-0001: Use Obsidian Vault for Knowledge Management

## Status
✅ **Accepted**

## Contexto

Quando trabalhando com Claude Code, contexto e decisões precisam ser acessíveis e reutilizáveis. Sem um sistema de conhecimento estruturado, informações importantes são perdidas entre sessões, forcing repeated re-explanation.

**Problema**: Como manter contexto consistente e permitir que Claude recupere decisões sem começar do zero a cada sessão?

## Decisão

Usar um **Obsidian Vault** como camada de conhecimento acoplada ao repositório Git. O vault armazena:

- Decisões arquiteturais (ADRs)
- Documentação de projeto
- Componentes e APIs
- Prompts reutilizáveis
- Tarefas e contexto em andamento

## Alternativas Consideradas

### ❌ Opção A: Apenas README.md
Insuficiente para linkagem e navegação em projetos complexos. Sem grafo de relacionamentos.

### ❌ Opção B: Wiki em GitHub Pages
Mais burocrático, requer setup CI/CD, menos rápido para atualizar.

### ✅ Opção C: Obsidian Vault (Escolhida)
- Markdown nativo (já entendido por Claude)
- Linking poderoso com `[[references]]`
- Graph view mostra relacionamentos
- Local-first, versionado em Git
- Integração natural com Claude Code
- Zero custo, totalmente offline-capable

## Consequências

### ✅ Positivas
- **Melhor retenção de contexto** entre sessões
- **Navegação rápida** via links e graph
- **Documentação viva** sempre próxima ao código
- **Rastreabilidade** de decisões com ADRs
- **Reutilização** de prompts e padrões

### ⚠️ Negativas
- Requer disciplina para manter vault atualizado
- Precisa de revisão semanal (limpeza de 08-Notes)
- Conhecimento humano necessário além de código
- Learning curve para Obsidian plugins

### 🔄 Neutras
- Adiciona 200KB ao repositório
- Requer instalação local de Obsidian para edição visual

## Implementação

✅ Estrutura criada: `00-Home` até `08-Notes`  
✅ CLAUDE.md atualizado com convenções  
✅ Este ADR como referência  

Próximos passos:
- [ ] Abrir em Obsidian localmente
- [ ] Explorar graph view
- [ ] Criar primeiro ADR customizado para seu projeto

## Referências

- [[CLAUDE.md]] — Guia principal
- [[00-Home/README|Home]] — Entry point
- [[02-Architecture/README|Architecture]] — Design do sistema

---

**Data**: 2026-06-06  
**Proposto por**: Claude  
**Revisor**: [Team review needed]  
**Links**: [[OBSIDIAN-SETUP.md|Setup instructions]]
