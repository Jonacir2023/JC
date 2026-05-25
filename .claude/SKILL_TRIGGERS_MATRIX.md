# 🎯 Complete Skills Triggers & Anti-Triggers Matrix

## Legenda
- ✅ DO - Use neste contexto
- ❌ DO NOT - Não use neste contexto
- 🔗 STACK - Skills para combinar com
- ⚠️ CONFLICT - Skills que conflitam

---

## 🔧 DEVELOPMENT & ENGINEERING

### engineering-calc
| Aspecto | Valores |
|---------|---------|
| **DO** | Vigas, colunas, fundações, resistência de materiais |
| **DO NOT** | Física pura, análise dinâmica, projeto gráfico |
| **Trigger** | "calcular", "tensão", "momento", "dimensionar" |
| **Anti-trigger** | Cálculos não-estruturais, projeto gráfico |
| **Stack** | symbolic-math, structural-analysis, xlsx, docx |
| **Conflict** | web-artifacts-builder, slack-gif-creator |

### symbolic-math
| Aspecto | Valores |
|---------|---------|
| **DO** | Resolver equações, derivadas, integrais, álgebra |
| **DO NOT** | Engenharia aplicada, análise estrutural, código |
| **Trigger** | "resolver", "derivada", "integral", "equação" |
| **Anti-trigger** | Implementação de algoritmo, projeto |
| **Stack** | engineering-calc, structural-analysis, scipy |
| **Conflict** | coding skills, web dev |

### structural-analysis
| Aspecto | Valores |
|---------|---------|
| **DO** | FEM, deslocamentos, frequências, análise modal |
| **DO NOT** | Cálculos simples, design gráfico |
| **Trigger** | "analisar estrutura", "deslocamento", "modo de vibração" |
| **Anti-trigger** | Simples dimensionamento, estética |
| **Stack** | engineering-calc, symbolic-math, webapp-testing |
| **Conflict** | frontend-design, canvas-design |

### claude-api
| Aspecto | Valores |
|---------|---------|
| **DO** | Claude SDK, API calls, prompt caching, integração |
| **DO NOT** | Código genérico, outras APIs, OpenAI |
| **Trigger** | "anthropic", "claude api", "sdk", "prompt caching" |
| **Anti-trigger** | "openai", "chatgpt", "generic code" |
| **Stack** | plugin-dev, mcp-builder, code-review |
| **Conflict** | provider-neutral code |

### agent-sdk-dev
| Aspecto | Valores |
|---------|---------|
| **DO** | Criar agents Claude, Agent SDK, workflow automation |
| **DO NOT** | Código genérico, outras frameworks, UI design |
| **Trigger** | "agent", "agent sdk", "autonomous", "workflow" |
| **Anti-trigger** | Single function, web UI |
| **Stack** | claude-api, plugin-dev, mcp-builder |
| **Conflict** | web-artifacts-builder |

---

## 📊 PROJECT & MANAGEMENT

### project-management
| Aspecto | Valores |
|---------|---------|
| **DO** | Cronogramas, riscos, orçamentos, Gantt, PERT/CPM |
| **DO NOT** | Execução de tarefa, desenvolvimento, design |
| **Trigger** | "cronograma", "gantt", "riscos", "planejar" |
| **Anti-trigger** | Execução real de trabalho |
| **Stack** | xlsx, docx, webapp-testing, internal-comms |
| **Conflict** | code-review, developer-focused |

### internal-comms
| Aspecto | Valores |
|---------|---------|
| **DO** | Status reports, newsletters, announcements |
| **DO NOT** | Código, design, análise técnica |
| **Trigger** | "status", "report", "comunicação", "newsletter" |
| **Anti-trigger** | Código, técnico puro |
| **Stack** | docx, pptx, xlsx, doc-coauthoring |
| **Conflict** | Technical skills |

---

## 🎨 DESIGN & CREATIVE

### web-artifacts-builder
| Aspecto | Valores |
|---------|---------|
| **DO** | React, HTML, complex UI, state management |
| **DO NOT** | Static images, simple HTML, backend code |
| **Trigger** | "artifact", "react", "component", "interactive ui" |
| **Anti-trigger** | Simple static HTML, backend |
| **Stack** | frontend-design, theme-factory, brand-guidelines |
| **Conflict** | canvas-design, simple-html |

### frontend-design
| Aspecto | Valores |
|---------|---------|
| **DO** | UI/UX, styling, layouts, visual design |
| **DO NOT** | Backend logic, data analysis, DevOps |
| **Trigger** | "design", "ui", "layout", "styling", "beautiful" |
| **Anti-trigger** | Backend, database, server |
| **Stack** | web-artifacts-builder, theme-factory, canvas-design |
| **Conflict** | engineering-calc, data-focused |

### canvas-design
| Aspecto | Valores |
|---------|---------|
| **DO** | PNG/PDF graphics, posters, visual art |
| **DO NOT** | Interactive UI, web design, animations |
| **Trigger** | "poster", "graphic", "art", "design image" |
| **Anti-trigger** | Interactive, responsive, web |
| **Stack** | theme-factory, brand-guidelines, slack-gif-creator |
| **Conflict** | web-artifacts-builder |

### theme-factory
| Aspecto | Valores |
|---------|---------|
| **DO** | Apply themes, styling, visual consistency |
| **DO NOT** | Create from scratch, logic, backend |
| **Trigger** | "theme", "style", "color scheme", "visual" |
| **Anti-trigger** | Logic, functionality |
| **Stack** | canvas-design, frontend-design, brand-guidelines |
| **Conflict** | structural-analysis, data-focused |

### slack-gif-creator
| Aspecto | Valores |
|---------|---------|
| **DO** | Animated GIFs for Slack |
| **DO NOT** | Video, static images, other platforms |
| **Trigger** | "gif", "slack", "animate" |
| **Anti-trigger** | Video, other social media |
| **Stack** | canvas-design, theme-factory |
| **Conflict** | canvas-design (static), youtube-content |

### algorithmic-art
| Aspecto | Valores |
|---------|---------|
| **DO** | Generative art, p5.js, algorithms, animations |
| **DO NOT** | Photography, manual design, UI layouts |
| **Trigger** | "algorithmic", "generative", "p5.js", "code art" |
| **Anti-trigger** | Photo editing, UI design |
| **Stack** | canvas-design, symbolic-math |
| **Conflict** | photography-based |

### brand-guidelines
| Aspecto | Valores |
|---------|---------|
| **DO** | Anthropic brand, colors, typography |
| **DO NOT** | Custom branding, other companies |
| **Trigger** | "anthropic", "brand colors", "logo" |
| **Anti-trigger** | Custom brand, competitor |
| **Stack** | canvas-design, theme-factory, frontend-design |
| **Conflict** | custom-brand-guidelines |

---

## 📄 DOCUMENTS & DATA

### docx
| Aspecto | Valores |
|---------|---------|
| **DO** | Word documents, reports, formal docs |
| **DO NOT** | Spreadsheets, PDFs alone, web content |
| **Trigger** | ".docx", "word", "report", "document", "memo" |
| **Anti-trigger** | .xlsx, .pdf native |
| **Stack** | doc-coauthoring, internal-comms, xlsx, pdf |
| **Conflict** | spreadsheet-focused |

### pdf
| Aspecto | Valores |
|---------|---------|
| **DO** | PDF generation, conversion, extraction |
| **DO NOT** | Editing images, video, code |
| **Trigger** | ".pdf", "pdf", "convert to pdf", "export pdf" |
| **Anti-trigger** | Video, image editing |
| **Stack** | docx, pptx, xlsx, canvas-design |
| **Conflict** | web-artifacts |

### xlsx
| Aspecto | Valores |
|---------|---------|
| **DO** | Spreadsheets, data analysis, charts |
| **DO NOT** | Document writing, coding, design |
| **Trigger** | ".xlsx", "spreadsheet", "data", "chart", "formula" |
| **Anti-trigger** | Writing prose, visual design |
| **Stack** | docx, pdf, engineering-calc, symbolic-math |
| **Conflict** | writing-focused |

### pptx
| Aspecto | Valores |
|---------|---------|
| **DO** | Presentations, slides, decks |
| **DO NOT** | Linear documents, single-page design |
| **Trigger** | ".pptx", "slides", "presentation", "deck" |
| **Anti-trigger** | Single page, continuous scroll |
| **Stack** | docx, theme-factory, frontend-design |
| **Conflict** | single-page-focused |

### doc-coauthoring
| Aspecto | Valores |
|---------|---------|
| **DO** | Collaborative writing, specs, proposals |
| **DO NOT** | Instant messaging, real-time code |
| **Trigger** | "spec", "proposal", "design doc", "collaborate" |
| **Anti-trigger** | Code, real-time chat |
| **Stack** | docx, internal-comms, project-management |
| **Conflict** | code-focused |

---

## 💻 CODE & REVIEW

### code-review
| Aspecto | Valores |
|---------|---------|
| **DO** | PR review, code quality, bugs |
| **DO NOT** | Writing code, design, infra |
| **Trigger** | "review", "pr", "code quality", "bug" |
| **Anti-trigger** | Implementation request, design |
| **Stack** | security-guidance, plugin-dev, webapp-testing |
| **Conflict** | implementation-focused |

### security-guidance
| Aspecto | Valores |
|---------|---------|
| **DO** | Security review, vulnerability, best practices |
| **DO NOT** | Implementation, design, non-security |
| **Trigger** | "security", "vulnerability", "owasp" |
| **Anti-trigger** | Non-security concerns |
| **Stack** | code-review, plugin-dev, claude-api |
| **Conflict** | non-security |

### webapp-testing
| Aspecto | Valores |
|---------|---------|
| **DO** | Web app testing, UI verification, screenshots |
| **DO NOT** | Unit tests, backend tests, load testing |
| **Trigger** | "test", "ui", "browser", "screenshot" |
| **Anti-trigger** | Backend, performance testing |
| **Stack** | code-review, project-management, frontend-design |
| **Conflict** | backend-focused |

### plugin-dev
| Aspecto | Valores |
|---------|---------|
| **DO** | Plugin creation, skill development, hooks |
| **DO NOT** | Simple code, non-plugin features |
| **Trigger** | "plugin", "skill", "hook", "extension" |
| **Anti-trigger** | Regular code |
| **Stack** | claude-api, agent-sdk-dev, skill-creator |
| **Conflict** | simple-script |

### skill-creator
| Aspecto | Valores |
|---------|---------|
| **DO** | Create skills, optimize, benchmark |
| **DO NOT** | Use existing skills, regular code |
| **Trigger** | "skill", "create skill", "optimize skill" |
| **Anti-trigger** | Using existing skills |
| **Stack** | plugin-dev, claude-api, cookbook-audit |
| **Conflict** | execution-focused |

---

## 🔗 INTEGRATIONS & TOOLS

### mcp-builder
| Aspecto | Valores |
|---------|---------|
| **DO** | MCP servers, Protocol integration, tools |
| **DO NOT** | Regular code, client apps |
| **Trigger** | "mcp", "server", "protocol", "tools integration" |
| **Anti-trigger** | Client app, user-facing |
| **Stack** | claude-api, plugin-dev, agent-sdk-dev |
| **Conflict** | client-focused |

### cookbook-audit
| Aspecto | Valores |
|---------|---------|
| **DO** | Audit notebooks, review content |
| **DO NOT** | Create notebooks, general code |
| **Trigger** | "audit", "review notebook", "cookbook" |
| **Anti-trigger** | Creating content |
| **Stack** | code-review, skill-creator |
| **Conflict** | creation-focused |

---

## 📋 OTHER TOOLS

### feature-dev
| Aspecto | Valores |
|---------|---------|
| **DO** | Feature development workflow |
| **DO NOT** | Standalone tasks, non-feature |
| **Trigger** | "feature", "development", "sprint" |
| **Anti-trigger** | Bug fix only, maintenance |
| **Stack** | project-management, code-review |
| **Conflict** | maintenance-focused |

### hookify
| Aspecto | Valores |
|---------|---------|
| **DO** | Hook configuration, automation |
| **DO NOT** | Regular code, non-hook |
| **Trigger** | "hook", "automate", "trigger" |
| **Anti-trigger** | Regular code |
| **Stack** | plugin-dev, code-review |
| **Conflict** | simple-script |

### ralph-wiggum
| Aspecto | Valores |
|---------|---------|
| **DO** | Recurring tasks, loops |
| **DO NOT** | One-off tasks |
| **Trigger** | "recurring", "loop", "repeat" |
| **Anti-trigger** | Single execution |
| **Stack** | project-management, automation |
| **Conflict** | one-time |

### explanatory-output-style
| Aspecto | Valores |
|---------|---------|
| **DO** | Explanatory responses, education |
| **DO NOT** | Concise output needed |
| **Trigger** | "explain", "learn", "understand" |
| **Anti-trigger** | Need speed, concise |
| **Stack** | learning-output-style (não)- conflita |
| **Conflict** | learning-output-style |

### learning-output-style
| Aspecto | Valores |
|---------|---------|
| **DO** | Learning-focused outputs |
| **DO NOT** | Professional/technical reports |
| **Trigger** | "teach", "educational", "learn" |
| **Anti-trigger** | Executive summary |
| **Stack** | cookbook-audit, explanatory |
| **Conflict** | professional-focused |

### commit-commands
| Aspecto | Valores |
|---------|---------|
| **DO** | Git operations, commits |
| **DO NOT** | Code changes |
| **Trigger** | "commit", "git", "push" |
| **Anti-trigger** | Code modification |
| **Stack** | code-review, project-management |
| **Conflict** | code-focused |

### claude-opus-4-5-migration
| Aspecto | Valores |
|---------|---------|
| **DO** | Migration guide, model updates |
| **DO NOT** | Current development |
| **Trigger** | "migrate", "upgrade", "4.5" |
| **Anti-trigger** | New features |
| **Stack** | claude-api, plugin-dev |
| **Conflict** | cutting-edge |

---

## 📊 Sumário de Conflitos

| Skills | Conflitam | Razão |
|--------|-----------|-------|
| canvas-design ↔ web-artifacts-builder | Sim | Static vs Interactive |
| engineering-calc ↔ frontend-design | Sim | Technical vs Visual |
| explanatory-output-style ↔ learning-output-style | Sim | Diferentes estilos |
| code-review ↔ implementation | Sim | Review vs Execution |
| plugin-dev ↔ simple-scripts | Sim | Plugin vs Regular |

---

## ✅ Recomendações de Stack

### Best Combos para Suite Completa

**Engineering Suite:**
```
engineering-calc + symbolic-math + structural-analysis + xlsx + docx + pdf
```

**Project & Delivery:**
```
project-management + code-review + webapp-testing + internal-comms
```

**Web Development:**
```
web-artifacts-builder + frontend-design + theme-factory + brand-guidelines + webapp-testing
```

**Documentation:**
```
docx + pdf + pptx + xlsx + doc-coauthoring + internal-comms
```

**API & Integration:**
```
claude-api + mcp-builder + agent-sdk-dev + plugin-dev + code-review
```
