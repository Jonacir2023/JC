---
name: security-guidance
description: Análise de segurança, vulnerabilidades, OWASP e best practices de segurança.
---

# 🔒 Security Guidance

Análise de segurança, vulnerabilidades e best practices.

## ✅ DO Use When:
- Revisar segurança de código
- Identificar vulnerabilidades
- Avaliar riscos OWASP
- Dar diretrizes de segurança
- Implementar proteções
- Revisar configurações

## ❌ DO NOT Use When:
- Desenvolvimento regular → use `/feature-dev`
- Análise não-security → use `/code-review`
- Infraestrutura DevOps → use diretamente

## 🎯 Trigger Automático
Ativa quando: "segurança", "vulnerabilidade", "owasp", "security", "breach"

## ⚠️ Anti-Trigger
NÃO ativa quando: Preocupação não-security, desenvolvimento regular

## 🤖 System Prompt Otimizado
```
Take your time. Para security:
1. Identify threat vectors
2. Analyze OWASP categories
3. Review authentication
4. Check authorization
5. Assess data protection
6. Evaluate encryption
7. Provide mitigations
```

## 🔗 Skill Stacking
| Skill | Resultado |
|-------|-----------|
| code-review | Security review |
| plugin-dev | Plugin security |
| claude-api | API security |
| webapp-testing | Security testing |

## 🌍 Compatibilidade
- ✅ Opus 4.7: Full
- ✅ Sonnet 4.6: Full
- ✅ Haiku 4.5: Full
- ⚠️ ChatGPT: Partial
- ⚠️ Gemini: Partial
