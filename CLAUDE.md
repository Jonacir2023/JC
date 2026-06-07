# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**JC** is a currently empty repository. The README describes it as "Dados do claude" (Portuguese: "Claude's data"). No source code, build system, or tests exist yet as of the initial commit.

## Current State

- Only file: `README.md` (2 lines)
- No build scripts, package managers, or language-specific tooling configured
- No test suite
- No CI/CD configuration

## Getting Started

As code is added to this repository, update this file with:

- **Build commands** (e.g., `npm install && npm run build`, `make`, `pip install -r requirements.txt`)
- **Test commands** (e.g., how to run the full suite and how to run a single test)
- **Lint/format commands**
- **Architecture overview** — how the major components fit together
- **Key conventions** — naming patterns, file organization, branching strategy

## Language / Stack

Not yet determined. Update this section once the technology stack is chosen.

## Automated Skills System

This repository uses automatic skill detection and recommendations based on conversation context. Skills are organized in 3 categories:

### 1. Dev & Engineering Skills
**Triggers:** dev, código, bug, refactor, engineer, arquitetura, performance, teste, pipeline, deploy

**Available Skills:**
- Superpowers - Senior engineer thinking
- Repomix - Codebase analysis
- Antfu Skills - Dev engineering toolkit
- GEO / SEO Claude - AI visibility optimization
- Dev Browser - Web navigation for QA
- Vexor Search - Semantic search
- Skill Seekers - Convert docs to skills
- Web Scraper - Intelligent web scraping

### 2. Research & Intelligence Skills
**Triggers:** pesquisa, research, análise, inteligência, insights, investigação, descoberta, mercado, tendências, validação

**Available Skills:**
- AutoResearch - AI research automation
- Dialogue Evidence - Critical analysis
- PM Skills - Product toolkit
- JTBD Interview - Customer research
- Transformation IA - AI team maturity assessment
- Deep Research - Multi-source research harness

### 3. Design & Creativity Skills
**Triggers:** design, visual, interface, criatividade, imagem, diagrama, mockup, protótipo, ux, ui, branding

**Available Skills:**
- Claude Design - 3D & motion toolkit
- Schémas Dessinés - Diagram creation
- GPT Image 2 - Image generation
- Art Algorithmique - Generative art
- Nothing Design - Industrial UI design
- Canva Design - Modern graphics production

## Automation Configuration

Skills are configured via `.claude/settings.json` with two hooks:
- **SessionStart**: Displays available skill categories on session init
- **UserPromptSubmit**: Analyzes prompts and recommends relevant skills based on keywords

The system works by detecting keywords in your prompts and suggesting the appropriate skill category. Invoke skills with `/skill-name` when recommendations appear.
