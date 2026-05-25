---
name: plugin-dev
description: Desenvolvimento de plugins, skills customizadas e extensões com hooks e integração profunda.
---

# 🔌 Plugin Development

Desenvolver plugins e skills customizadas com hooks e integração.

## ✅ DO Use When:
- Criar plugins/skills novos
- Desenvolver extensões
- Configurar hooks
- Integrar com Anthropic ecosystem
- Criar skill-specific functionality
- Desenvolver automação avançada

## ❌ DO NOT Use When:
- Código simples/genérico → use desenvolvimento direto
- Não é plugin/skill → use `/feature-dev`
- Análise ou review → use `/code-review`

## 🎯 Trigger Automático
Ativa quando: "plugin", "skill", "hook", "extensão", "extension"

## ⚠️ Anti-Trigger
NÃO ativa quando: Código regular, tarefa não-plugin

## 🤖 System Prompt Otimizado
```
Take your time. Para plugins:
1. Design plugin architecture
2. Plan hook integration points
3. Create skill structure
4. Implement metadata
5. Add configuration options
6. Test plugin lifecycle
7. Document API
```

## 🔗 Skill Stacking
| Skill | Resultado |
|-------|-----------|
| claude-api | SDK integration |
| agent-sdk-dev | Agent plugins |
| skill-creator | Skill optimization |
| code-review | Plugin quality |

## 🌍 Compatibilidade
- ✅ Opus 4.7: Full
- ✅ Sonnet 4.6: Full
- ⚠️ Haiku 4.5: Basic
- ⚠️ ChatGPT: Partial
- ⚠️ Gemini: Partial
