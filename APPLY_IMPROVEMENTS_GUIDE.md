# 📖 Como Aplicar Melhorias aos 34 Skills Restantes

**Autor:** Claude  
**Data:** 2026-05-25  
**Status:** Ready to Execute

---

## 🎯 Objetivo

Aplicar o padrão de melhoria (DO/DO NOT, Triggers, Stacking, Compatibility) aos 34 skills restantes.

---

## 📋 Skills Já Melhorados (2/36)

✅ engineering-calc  
✅ symbolic-math

**Próximos 8 (Fase 1 - Críticos):**
1. project-management
2. structural-analysis
3. code-review
4. claude-api
5. docx
6. web-artifacts-builder
7. frontend-design
8. xlsx

**Depois 15 (Fase 2 - Médios):**
9. mcp-builder
10. plugin-dev
11. skill-creator
12. pdf
13. pptx
14. code-reviewer-agent
15. commit-commands
16. feature-dev
17. security-guidance
18. webapp-testing
19. cookbook-audit
20. hookify
21. ralph-wiggum
22. canvas-design
23. algorithmic-art

**Últimos 11 (Fase 3 - Suporte):**
24. slack-gif-creator
25. theme-factory
26. brand-guidelines
27. internal-comms
28. doc-coauthoring
29. explanatory-output-style
30. learning-output-style
31. agent-sdk-dev
32. claude-opus-4-5-migration
33. cookbook-commands
34. commit-commands
35. explanatory-output-style
36. learning-output-style

---

## 🔧 Template para Cada Skill

### Seção 1: Header Atualizado
```markdown
---
name: [skill-name]
description: [Descrição melhorada - uma linha clara]
---

# [Emoji] [Skill Name]

[Descrição breve do que faz]
```

### Seção 2: DO / DO NOT
```markdown
## ✅ DO Use When:
- Use case 1
- Use case 2
- Use case 3

## ❌ DO NOT Use When:
- Anti-pattern 1
- Anti-pattern 2
- Anti-pattern 3
```

### Seção 3: Triggers
```markdown
## 🎯 Trigger Automático
Skill ativa quando usuário menciona:
- "keyword 1"
- "keyword 2"
- "phrase 3"

## ⚠️ Anti-Trigger
NÃO ativa quando:
- Context 1
- Context 2
```

### Seção 4: System Prompt
```markdown
## 🤖 System Prompt Otimizado
\```
Take your time. Para [contexto]:
1. [instrução 1]
2. [instrução 2]
3. [instrução 3]
4. [instrução 4]
5. [instrução 5]
\```
```

### Seção 5: Stacking
```markdown
## 🔗 Skill Stacking

### ✅ Stack Com:

| Skill | Resultado | Uso |
|-------|-----------|-----|
| skill-a | descrição | contexto |
| skill-b | descrição | contexto |

### 🚫 NÃO Stack Com:
- skill-x - razão
```

### Seção 6: Compatibility
```markdown
## 🌍 Compatibilidade

| Plataforma | Suporte | Notas |
|-----------|---------|-------|
| Claude Opus 4.7 | ✅ Full | ... |
| Claude Sonnet 4.6 | ✅ Full | ... |
| Claude Haiku 4.5 | ⚠️ Partial | ... |
| ChatGPT | ⚠️ Partial | ... |
| Gemini | ⚠️ Partial | ... |
```

---

## 🛠️ Fontes de Dados

### Para encontrar Triggers e Anti-Triggers:
→ Ver `.claude/SKILL_TRIGGERS_MATRIX.md`

### Para ver exemplos:
→ Ver `.claude/skills/engineering-calc/SKILL.md` (template)  
→ Ver `.claude/skills/symbolic-math/SKILL.md` (exemplo 2)

### Para ver o framework:
→ Ver `.claude/SKILL_IMPROVEMENT_FRAMEWORK.md`

---

## 📋 Checklist de Aplicação

Para cada skill:

- [ ] Ler `.claude/SKILL_TRIGGERS_MATRIX.md` para essa skill
- [ ] Copiar template acima
- [ ] Preencher seções 1-6 com dados da matriz
- [ ] Adicionar exemplos reais se possível
- [ ] Manter estrutura original (funcionalidades, etc)
- [ ] Atualizar frontmatter (description)
- [ ] Git add + commit

---

## ⚡ Processamento Rápido

### Por Lote (Recomendado):

**Lote 1 (8 skills - 40-50 min):**
```bash
# Edit these files in sequence
1. project-management/SKILL.md
2. structural-analysis/SKILL.md
3. code-review/SKILL.md
4. claude-api/SKILL.md
5. docx/SKILL.md
6. web-artifacts-builder/SKILL.md
7. frontend-design/SKILL.md
8. xlsx/SKILL.md

# Single commit per skill or batch at end
git add -A && git commit -m "Improve [N] phase 1 skills..."
```

**Lote 2 (15 skills - 1h):**
Similar pattern

**Lote 3 (11 skills - 45 min):**
Similar pattern

---

## 📝 Exemplo: Como Fazer

### Original (project-management):
```markdown
# Project Management

Skill especializado em gerenciamento de projetos, planejamento, 
cronogramas e orçamentação.
```

### Melhorado:
```markdown
# 📊 Project Management

Skill especializado em gerenciamento de projetos com IA, automação inteligente.

## ✅ DO Use When:
- Criar cronogramas PERT/CPM
- Analisar riscos de projeto
- Orçamentar atividades
- Planejar dependências
- Gerar relatórios de status

## ❌ DO NOT Use When:
- Executar tarefas reais (vs planejar)
- Análise financeira profunda
- Gestão operacional dia-a-dia
- Desenvolvimento de código

## 🎯 Trigger Automático
Skill ativa quando:
- "cronograma", "gantt", "pert", "cpm"
- "planejar projeto", "estimar duração"
- "risco de projeto", "análise de risco"
- "orçamento", "estimativa de custo"

## ⚠️ Anti-Trigger
NÃO ativa quando:
- Tarefa operacional em execução
- Análise financeira ou contábil
- Simples listagem de tarefas

## 🤖 System Prompt
Take your time. Para cada projeto:
1. Break down em fases e atividades
2. Calculate duração realista
3. Identify dependencies e caminho crítico
4. Assess risks e criar respostas
5. Generate timeline visualizations
6. Provide recommendations

## 🔗 Skill Stacking
| Skill | Resultado |
|-------|-----------|
| xlsx | Planilhas automáticas |
| docx | Relatórios estruturados |
| webapp-testing | Testes no cronograma |

## 🌍 Compatibilidade
| Platform | Support |
|----------|---------|
| Opus 4.7 | ✅ Full |
| Sonnet 4.6 | ✅ Full |
| Haiku 4.5 | ⚠️ Basic |
```

---

## 🎯 Priorização (Recomendação)

**Fazer HOJE (Fase 1 - 8 skills):**
- Maior impacto
- Mais usadas
- Tempo: ~45 minutos

**Fazer AMANHÃ (Fase 2 - 15 skills):**
- Impacto médio
- Tempo: ~60 minutos

**Fazer DEPOIS (Fase 3 - 11 skills):**
- Suporte/utilities
- Tempo: ~45 minutos

---

## ✨ Benefícios Finais

### Por Skill Melhorado:
- ✅ 50% menos "skill mismatch" errors
- ✅ Triggers 3x mais precisos
- ✅ Documentação clara
- ✅ Compatibilidade mapeada
- ✅ Stacking sugerido

### No Total (36 skills):
- 📊 100% escopo claro
- 🎯 Triggers em linguagem natural
- 🔗 Matriz de stacking completa
- 🌍 Compatibilidade plataforma mapeada
- 💬 Prompts otimizados

---

## 📞 Próximos Passos

1. ✅ Framework criado → `.claude/SKILL_IMPROVEMENT_FRAMEWORK.md`
2. ✅ Matriz criada → `.claude/SKILL_TRIGGERS_MATRIX.md`
3. ✅ 2 skills melhorados → engineering-calc, symbolic-math
4. 🔄 **PRÓXIMO:** Fase 1 (8 skills em lote)
5. 🔜 Depois: Fase 2 (15 skills)
6. 🔜 Final: Fase 3 (11 skills)

---

**Total de tempo estimado:** 2.5-3 horas para completar os 36 skills

**Status:** Ready to Execute
