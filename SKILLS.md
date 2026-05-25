# 📚 SKILLS INSTALADAS - GUIA COMPLETO

## ATIVAÇÃO DE SKILLS

### Por Tipo de Trigger:

#### 1️⃣ **DESIGN & CREATIVE**

| Skill | Comando | Descrição | Trigger |
|-------|---------|-----------|---------|
| **algorithmic-art** | `/algorithmic-art` | Arte algorítmica com p5.js | Solicite art generativa, flow fields |
| **canvas-design** | `/canvas-design` | Design em PNG/PDF | Criar posters, arte visual estática |
| **web-artifacts-builder** | `/web-artifacts-builder` | HTML/React artifacts complexos | Componentes web com estado, routing |
| **frontend-design** | `/frontend-design` | UI/frontend web produção | Website, dashboard, landing page |
| **slack-gif-creator** | `/slack-gif-creator` | GIFs para Slack | Criar GIFs animados para Slack |
| **theme-factory** | `/theme-factory` | Temas para artifacts | Aplicar temas a slides, docs, HTML |
| **brand-guidelines** | `/brand-guidelines` | Estilo Anthropic | Aplicar identidade visual Anthropic |

#### 2️⃣ **DOCUMENTOS & DADOS**

| Skill | Comando | Descrição | Trigger |
|-------|---------|-----------|---------|
| **docx** | `/docx` | Word documents (.docx) | Criar/editar Word docs, relatórios |
| **pdf** | `/pdf` | PDF documents | Criar/editar/extrair de PDFs |
| **xlsx** | `/xlsx` | Spreadsheets (.xlsx, .csv) | Trabalhar com planilhas |
| **pptx** | `/pptx` | PowerPoint presentations | Criar/editar slides e decks |
| **doc-coauthoring** | `/doc-coauthoring` | Workflow de co-autoria | Escrever specs, proposals, docs |

#### 3️⃣ **DESENVOLVIMENTO & ENGINEERING**

| Skill | Comando | Descrição | Trigger |
|-------|---------|-----------|---------|
| **claude-api** | `/claude-api` | Claude API & SDK | Código com `anthropic` imports |
| **mcp-builder** | `/mcp-builder` | Model Context Protocol | Criar MCP servers |
| **agent-sdk-dev** | `/agent-sdk-dev` | Agent SDK development | Desenvolvimento com Agent SDK |
| **plugin-dev** | `/plugin-dev` | Plugin development toolkit | Criar/modificar plugins |
| **skill-creator** | `/skill-creator` | Criar/otimizar skills | Desenvolver novas skills |

#### 4️⃣ **CODE REVIEW & QA**

| Skill | Comando | Descrição | Trigger |
|-------|---------|-----------|---------|
| **code-review** | `/code-review` | Revisão automatizada | Revisar código em PRs |
| **pr-review-toolkit** | `/review-pr` | Toolkit PR completo | Análise profunda de PRs |
| **webapp-testing** | `/webapp-testing` | Teste web com Playwright | Testar web apps locais |
| **cookbook-audit** | `/cookbook-audit` | Auditar notebooks | Revisar Cookbook notebooks |

#### 5️⃣ **GIT & COMMITS**

| Skill | Comando | Descrição | Trigger |
|-------|---------|-----------|---------|
| **commit-commands** | `/commit` | Git operations | Operações git facilitadas |
| **hookify** | `/hookify` | Hook management | Configurar hooks customizados |
| **ralph-wiggum** | `/ralph-loop` | Loop utilities | Tasks recorrentes |

#### 6️⃣ **MIGRATION & GUIDES**

| Skill | Comando | Descrição | Trigger |
|-------|---------|-----------|---------|
| **claude-opus-4-5-migration** | Manual | Migração Opus 4.5 | Referência para migration |
| **internal-comms** | Automático | Comms internas | Escrever status, newsletters |

#### 7️⃣ **UTILS & STYLE GUIDES**

| Skill | Comando | Descrição | Trigger |
|-------|---------|-----------|---------|
| **explanatory-output-style** | Sistema | Explicativo | Outputs educacionais |
| **learning-output-style** | Sistema | Estilo aprendizado | Outputs de aprendizado |
| **security-guidance** | Sistema | Segurança | Orientações de segurança |
| **feature-dev** | `/feature-dev` | Feature dev toolkit | Desenvolvimento de features |
| **code-reviewer-agent** | Agente | Code review agent | Revisar código (agent) |
| **cookbook-commands** | Vários | 7 utility commands | Registry, review, model checks |

---

## ANÁLISE DE REDUNDÂNCIAS

### ✅ **Sem Redundância Crítica**

As skills se complementam bem, cada uma servindo um propósito específico:

1. **Design/Frontend** (Complementares):
   - `canvas-design` → PNG/PDF estático
   - `frontend-design` → Web UI/frontend
   - `web-artifacts-builder` → React/componentes complexos
   - `theme-factory` → Aplicar temas

2. **Code Review** (Levemente redundantes, usar `/code-review` ou `/review-pr`):
   - `code-review` → Claude Code plugin
   - `pr-review-toolkit` → Toolkit completo
   - `code-reviewer-agent` → Agent para review

3. **Document Formats** (Especializadas):
   - `docx` → Word
   - `pdf` → PDF
   - `xlsx` → Spreadsheets
   - `pptx` → PowerPoint

4. **Output Styling** (Contexto específico):
   - `explanatory-output-style` → Educacional
   - `learning-output-style` → Aprendizado
   - `theme-factory` → Temas visuais
   - `brand-guidelines` → Identidade Anthropic

---

## 📊 RESUMO ESTATÍSTICO

- **Total de Skills**: 32
- **Com Comandos Diretos**: ~18
- **Com Agents**: ~6
- **Com Hooks**: ~5
- **Auto-trigger**: ~4

## 🎯 TOP 5 SKILLS (Mais Usadas)

1. **`/code-review`** - Análise automatizada de código
2. **`/claude-api`** - API/SDK do Claude
3. **`/docx`** - Documentos Word
4. **`/web-artifacts-builder`** - Web components/UI
5. **`/mcp-builder`** - MCP servers

## ⚡ QUICK REFERENCE

| Use Case | Comando |
|----------|---------|
| Code review | `/code-review` |
| Criar documento Word | `/docx` |
| Web UI/artifact | `/web-artifacts-builder` |
| PDF | `/pdf` |
| API Claude | `/claude-api` |
| Planilha | `/xlsx` |
| PowerPoint | `/pptx` |
| Arte algorítmica | `/algorithmic-art` |
| Teste web app | `/webapp-testing` |
| MCP server | `/mcp-builder` |

## 📚 Repositórios de Origem

- **anthropics/skills** (17 skills) - Core skills Anthropic
- **anthropics/claude-code** (13 plugins)
- **anthropics/claude-cookbooks** (3 resources)

Total: **32 skills instaladas**
