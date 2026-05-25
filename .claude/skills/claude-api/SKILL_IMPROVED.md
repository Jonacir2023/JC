---
name: claude-api
description: Build, debug e otimize Claude API e Anthropic SDK apps com prompt caching.
---

# 🔌 Claude API & SDK

Build e otimize aplicações com Claude API e Anthropic SDK.

## ✅ DO Use When:
- Código importa `anthropic` ou `@anthropic-ai/sdk`
- Usuário pede "Claude API", "Anthropic SDK"
- Build de apps com Claude
- Otimizar prompt caching
- Migrar entre versões Claude
- Tool use, batch processing, files API

## ❌ DO NOT Use When:
- Código usa OpenAI/ChatGPT
- É código genérico não-Claude
- Python scripts simples
- HTML/CSS/JS puro (sem IA)

## 🎯 Trigger Automático
Ativa quando: "anthropic", "claude api", "sdk", "prompt caching", "tool use"

## ⚠️ Anti-Trigger
NÃO ativa quando: "openai", "chatgpt", "generic code"

## 🤖 System Prompt Otimizado
```
Take your time. Para Claude API:
1. Use latest claude-opus-4-7 model
2. Implement prompt caching when applicable
3. Show tool_use patterns
4. Optimize for latency
5. Handle streaming properly
6. Document migrations
```

## 🔗 Skill Stacking
| Skill | Resultado |
|-------|-----------|
| mcp-builder | Criar MCP servers |
| agent-sdk-dev | Build agents |
| plugin-dev | Desenvolver plugins |
| code-review | Review code |

## 🌍 Compatibilidade
- ✅ Opus 4.7: Full
- ✅ Sonnet 4.6: Full
- ⚠️ Haiku 4.5: Basic
- ❌ ChatGPT: Not applicable
- ❌ Gemini: Not applicable
