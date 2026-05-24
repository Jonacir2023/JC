# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**JC** is a personal repository owned by jonacir70@icloud.com. The name "Dados do claude" (Portuguese: "Claude's data") suggests it is intended as a workspace for Claude Code experiments, data, or projects.

## Current State

- Two tracked files: `README.md` and `CLAUDE.md`
- No source code, build system, package manager, or language tooling configured yet
- No test suite or CI/CD pipeline
- Three commits on `main` (initial commit → CLAUDE.md added → merged PR)

## Branching Convention

Claude Code web sessions create feature branches following the pattern:

```
claude/<short-description>-<random-id>
```

Examples observed:
- `claude/claude-md-docs-PII4T` (merged via PR #3)
- `claude/claude-md-docs-YwlxK` (current session branch)

Always develop on the branch specified at the top of your session context and push to that branch. Do not push to `main` directly.

## Git Workflow

1. Work on the designated `claude/*` branch for your session
2. Commit with clear, descriptive messages
3. Push with `git push -u origin <branch-name>`
4. Do not create a pull request unless the user explicitly asks for one

## Getting Started (for future code)

When code is added to this repository, update this file with:

- **Build commands** — e.g., `npm install && npm run build`, `make`, `pip install -r requirements.txt`
- **Test commands** — how to run the full suite and a single test
- **Lint/format commands**
- **Architecture overview** — how the major components fit together
- **Key conventions** — naming patterns, file organization, module boundaries

## Language / Stack

Not yet determined. Update this section once a technology stack is chosen.

## Notes for AI Assistants

- This is an early-stage personal repository; it is normal for it to have very little content
- Do not invent structure, scaffolding, or placeholder files unless explicitly requested
- Keep this file current: update it whenever the stack, build commands, or conventions are established
- The user's preferred language appears to be Portuguese (based on README), but code and commit messages should follow standard English conventions unless instructed otherwise
