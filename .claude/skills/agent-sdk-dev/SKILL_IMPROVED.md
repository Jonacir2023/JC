---
name: agent-sdk-dev
description: Desenvolvimento de agents usando Agent SDK, automação de workflows e IA autônoma.
---

# 🤖 Agent SDK Development

Desenvolver agents autônomos com Agent SDK e automação de workflows.

## ✅ DO Use When:
- Criar novo agent Claude
- Desenvolver automação autônoma
- Implementar workflow agents
- Integrar agent SDK
- Criar multi-turn interactions
- Agent orchestration

## ❌ DO NOT Use When:
- Código simples/genérico → use desenvolvimento direto
- UI/Frontend → use `/web-artifacts-builder`
- Apenas integrações → use `/mcp-builder`

## 🎯 Trigger Automático
Ativa quando: "agent", "agent sdk", "autônomo", "workflow", "autonomous"

## ⚠️ Anti-Trigger
NÃO ativa quando: Função única, UI, integração básica

## 🤖 System Prompt Otimizado
```
Take your time. Para agents:
1. Design agent goals
2. Plan tool/resource access
3. Define decision logic
4. Create error handling
5. Implement feedback loops
6. Add monitoring
7. Test autonomy
```

## 🔗 Skill Stacking
| Skill | Resultado |
|-------|-----------|
| claude-api | API integration |
| plugin-dev | Plugin agents |
| mcp-builder | Agent tools |
| code-review | Agent quality |

## 🌍 Compatibilidade
- ✅ Opus 4.7: Full
- ✅ Sonnet 4.6: Full
- ⚠️ Haiku 4.5: Basic
- ⚠️ ChatGPT: Partial
- ⚠️ Gemini: Partial
