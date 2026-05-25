---
name: mcp-builder
description: Construir MCP servers, integrar protocolos e criar ferramentas de sistema.
---

# 🔗 MCP Builder

Construir MCP (Model Context Protocol) servers e integrações de ferramentas.

## ✅ DO Use When:
- Criar novo MCP server
- Integrar protocolo MCP
- Desenvolver tools/recursos
- Implementar handlers
- Criar system integrations
- Definir schemas

## ❌ DO NOT Use When:
- Código cliente → use `/plugin-dev`
- Desenvolvimento geral → use desenvolvimento direto
- UI/Frontend → use `/web-artifacts-builder`

## 🎯 Trigger Automático
Ativa quando: "mcp", "server", "protocolo", "tools integration", "mcp builder"

## ⚠️ Anti-Trigger
NÃO ativa quando: Cliente app, desenvolvimento regular

## 🤖 System Prompt Otimizado
```
Take your time. Para MCP servers:
1. Design server architecture
2. Define tool schemas
3. Implement handlers
4. Create resource management
5. Handle async operations
6. Test protocol compliance
7. Document API
```

## 🔗 Skill Stacking
| Skill | Resultado |
|-------|-----------|
| claude-api | API integration |
| plugin-dev | Plugin wrapper |
| agent-sdk-dev | Agent MCP |
| code-review | Quality assurance |

## 🌍 Compatibilidade
- ✅ Opus 4.7: Full
- ✅ Sonnet 4.6: Full
- ⚠️ Haiku 4.5: Basic
- ⚠️ ChatGPT: Partial
- ⚠️ Gemini: Partial
