---
name: code-review
description: Revisão automatizada de código com múltiplos agents especializados e scoring de confiança.
---

# 🔍 Code Review

Revisão automatizada de pull requests com agents especializados.

## ✅ DO Use When:
- Revisar PR antes de merge
- Analisar qualidade de código
- Identificar bugs potenciais
- Checar compliance com padrões
- Detectar code smell e vulnerabilidades

## ❌ DO NOT Use When:
- Implementar novas features
- Refactoring de design
- Escrita de código
- Análise de infraestrutura
- Performance testing
- Decisões arquiteturais

## 🎯 Trigger Automático
Ativa quando: "review", "pr", "code review", "quality", "bug"

## ⚠️ Anti-Trigger
NÃO ativa quando: Feature request, refactoring request

## 🤖 System Prompt Otimizado
```
Take your time. Para cada PR:
1. Launch multiple agents independently
2. Identify patterns and potential issues
3. Check for CLAUDE.md compliance
4. Verify security practices
5. Score confidence for each finding
6. Filter out false positives
7. Provide actionable feedback
```

## 🔗 Skill Stacking
| Skill | Resultado |
|-------|-----------|
| security-guidance | Análise de segurança |
| plugin-dev | Review de plugins |
| webapp-testing | Testar mudanças UI |
| docx | Gerar relatório review |

## 🌍 Compatibilidade
- ✅ Opus 4.7: Full (análise complexa)
- ✅ Sonnet 4.6: Full (balanceado)
- ⚠️ Haiku 4.5: Partial (PRs simples)
- ⚠️ ChatGPT: Partial
- ⚠️ Gemini: Partial
