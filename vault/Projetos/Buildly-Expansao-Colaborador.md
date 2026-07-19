---
id: "buildly-001"
tipo: "Projeto"
assunto: "Buildly - Expansão de Colaborador com 20 Campos Operacionais"
descricao: "Expansão do módulo Gestão de Equipes do Buildly com 20 campos operacionais de canteiro"
status: "Em Andamento"
criado_em: "2026-07-19T00:00:00Z"
tags: [buildly, projeto, desenvolvimento, colaborador]
---

# 🏗️ Buildly - Expansão de Colaborador

## Informações do Projeto

**Repositório:** `jonacir2023/buildly` (renomeado de `buidly`)
**Caminho Local:** `/workspace/buildly`
**URL:** https://jonacir2023.github.io/buildly/
**Branch:** `claude/serene-einstein-em23qs`

---

## 📋 Objetivo

Expandir o módulo **Gestão de Equipes** (`js/modulos/equipes.js`) com 20 campos operacionais de canteiro para o formulário de cadastro de colaboradores.

### Escopo dos 20 Campos

| # | Campo | Tipo | Notas |
|---|---|---|---|
| 1 | Matrícula | INTEGER | Número único de matrícula |
| 2 | Nome | TEXT | Nome completo (obrigatório) |
| 3 | Admissão | DATE | Data de admissão |
| 4 | Demissão | DATE | Data de demissão (nullable) |
| 5 | Situação | ENUM | ativo/inativo/afastado/licença |
| 6 | Cargo | TEXT | Cargo/função operacional |
| 7 | Mão de obra | ENUM | moi/mod/terceirizado |
| 8 | Estabilidade | TEXT | Status de estabilidade |
| 9 | Cidade | TEXT | Cidade de trabalho |
| 10 | UF | ENUM | Estado/Unidade Federativa |
| 11 | Sexo | ENUM | masculino/feminino/não_informado |
| 12 | Local de Registro | TEXT | Local de registro |
| 13 | Status Mobilização | ENUM | não_iniciado/em_progresso/concluído/cancelado |
| 14 | Término 1ª Experiência | DATE | Data término contrato experiência 1 |
| 15 | Término 2ª Experiência | DATE | Data término contrato experiência 2 |
| 16 | Status Alojamento | ENUM | não_necessário/necessário/fornecido/recusado |
| 17 | Eng. Responsável | UUID | Referência a engenheiro |
| 18 | Encarregado/Supervisor | UUID | Referência a supervisor |
| 19 | Frente de Serviço | TEXT | Frente/seção de trabalho |
| 20 | Empresa | TEXT | Empresa (já existe) |

---

## ✅ Checklist de Implementação

### Fase 1: Database (1-2 dias)
- [x] Criar migration `0004_expand_colaborador_operacional.sql`
- [x] Definir 6 ENUM types
- [x] Adicionar 20 novas colunas à tabela `colaborador`
- [x] Criar índices para performance
- [ ] Testar migration localmente

### Fase 2: Backend API (2-3 dias)
- [ ] Criar endpoints CRUD
- [ ] Implementar validações
- [ ] Adicionar filtros
- [ ] Testar com Postman/curl

### Fase 3: Frontend Form (3-4 dias)
- [x] Criar form com 3 abas
  - [x] Tab 1: Dados Pessoais
  - [x] Tab 2: Temporal
  - [x] Tab 3: Operacional
- [x] Implementar handlers de submit/edit
- [x] Popular dropdowns dinamicamente
- [x] Adicionar validações client-side

### Fase 4: List View (1-2 dias)
- [ ] Redesenhar lista/tabela
- [ ] Adicionar modal de detalhes
- [ ] Implementar ações (editar, remover, detalhes)

### Fase 5: Testes (1-2 dias)
- [ ] E2E workflow (add → list → edit → delete)
- [ ] Validações de data
- [ ] Unicidade de matrícula

### Fase 6: Documentação (1 dia)
- [ ] Atualizar CLAUDE.md
- [ ] Documentar API
- [ ] Exemplos de uso

---

## 📅 Cronograma

| Fase | Duração | Status |
|---|---|---|
| Fase 1: Database | 1-2 dias | ⏳ Próxima |
| Fase 2: Backend API | 2-3 dias | ⏳ |
| Fase 3: Frontend Form | 3-4 dias | ⏳ |
| Fase 4: List View | 1-2 dias | ⏳ |
| Fase 5: Testes | 1-2 dias | ⏳ |
| Fase 6: Docs | 1 dia | ⏳ |
| **TOTAL** | **10-16 dias** | |

---

## 📁 Estrutura de Arquivos

```
/workspace/buildly/
├── supabase/migrations/
│   ├── 0001_schema_inicial.sql          ✅ Lido
│   ├── 0002_rls_autenticado.sql         ✅ Referência
│   ├── 0003_seed_obra_inicial.sql       ✅ Referência
│   └── 0004_expand_colaborador_operacional.sql    📝 NOVO
│
├── js/modulos/
│   └── equipes.js                        📝 MODIFICAR
│       - Linha 21-26: Form atual (3 campos)
│       - Linha 29-36: List view atual
│       - Linha 41-58: Submit handler
│
├── api/routes/
│   └── colaboradores.js                 📝 NOVO
│
└── CLAUDE.md                             ✅ Criado
```

---

## 🔑 Decisões de Design

### Organização do Formulário
- **3 Abas:** Pessoal | Temporal | Operacional
- **Motivo:** Evitar overwhelming do usuário com 20 campos simultâneos

### Tuplas ENUM (6 tipos)
1. `situacao_enum`: ativo, inativo, afastado, licença
2. `tipo_mao_obra_enum`: moi, mod, terceirizado
3. `sexo_enum`: masculino, feminino, não_informado
4. `estado_enum`: 27 estados brasileiros + DF
5. `status_mobilizacao_enum`: não_iniciado, em_progresso, concluído, cancelado
6. `status_alojamento_enum`: não_necessário, necessário, fornecido, recusado

### Backward Compatibility
- Todas as 20 novas colunas com DEFAULT NULL
- Tabela existente não quebrada
- Dados históricos preservados

### List View
- Mostrar apenas 8 colunas essenciais
- Modal "Detalhes" com os 20 campos (read-only)

---

## 📝 Histórico de Progresso

### 2026-07-19 — Sessão de Implementação

#### Manhã
- ✅ Adicionado repositório `buildly` à sessão
- ✅ Criado CLAUDE.md do projeto com referências
- ✅ Planificação concluída
- ✅ Nota de projeto criada no Obsidian

#### Tarde
- ✅ **FASE 1 CONCLUÍDA: Database Migration**
  - Criada migration `0004_expand_colaborador_operacional.sql`
  - 6 ENUM types definidos (situacao, tipo_mao_obra, sexo, estado, status_mobilizacao, status_alojamento)
  - 20 colunas adicionadas à tabela colaborador
  - 6 índices criados para performance
  - Foreign keys configuradas (supervisor_id auto-referência)
  - Comentários de documentação inline
  - Commit: `67db85a`

- ✅ **FASE 3 CONCLUÍDA: Frontend Form**
  - Reescrito módulo `equipes.js` completamente
  - Modal com 3 abas de navegação (Pessoal | Temporal | Operacional)
  - Formulário com todos 20 campos
  - Funcionalidades: novo, editar, detalhes, remover
  - Validações: campo obrigatório, lógica de datas
  - Tabela com 7 colunas essenciais (matrícula, nome, empresa, cargo, frente, situação, ações)
  - Estilos CSS para modal, abas, formulário e tabela
  - Commit: `7b53f50`

- ⏳ **Próximo:** Fase 4 (List View - melhorias)

---

## 🔗 Links Relacionados

- [[Buildly]]
- [[Desenvolvimentos em Andamento]]

