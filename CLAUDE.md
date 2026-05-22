# CLAUDE.md

This file documents the JC repository for AI assistants (Claude Code and others). Keep this file up to date as the project evolves.

## Project Overview

**JC** is a nascent repository currently in its initial phase. The README describes it as "Dados do claude" (Portuguese: "Claude's data"), suggesting it will store data or configuration related to Claude AI usage.

- **Repository:** `jonacir2023/jc`
- **Primary language/stack:** Not yet defined
- **Status:** Bootstrapping — only a README exists

## Repository Structure

```
JC/
├── README.md       # Project description (minimal, in Portuguese)
└── CLAUDE.md       # This file
```

No application code, dependencies, tests, or build configuration exist yet.

## Git Workflow

- **Development branch convention:** `claude/<description>-<id>` (e.g. `claude/claude-md-docs-z6me0`)
- **Default branch:** Check with `git remote show origin` — treat `main` or `master` as protected
- **Never push directly to the default branch** without explicit user approval
- Use `git push -u origin <branch-name>` when pushing a new branch
- Write clear, descriptive commit messages in the imperative mood ("Add feature X", not "Added feature X")

## Development Conventions

Since no stack is defined yet, these are placeholder conventions to update once the project direction is set:

- Keep code and configuration files at the repository root or in well-named subdirectories
- Document any new tooling choices in this file when they are introduced
- Prefer explicit configuration over convention-based defaults when ambiguity exists

## Working with This Repository

### Adding new code

1. Confirm the intended language/framework with the user before scaffolding
2. Add a `.gitignore` appropriate to the chosen stack
3. Update this CLAUDE.md with the new structure, commands, and conventions

### Common tasks (to be filled in once stack is chosen)

| Task | Command |
|------|---------|
| Install dependencies | TBD |
| Run tests | TBD |
| Build | TBD |
| Lint | TBD |
| Start dev server | TBD |

## Notes for AI Assistants

- This repo is owned by `jonacir2023` on GitHub
- Allowed repository scope for MCP GitHub tools: `jonacir2023/jc` only
- Do not create a pull request unless the user explicitly asks for one
- Do not push to any branch other than the one specified by the user or the session instructions
- When in doubt about destructive operations (deleting files, force-pushing, resetting), ask the user first
- Update this CLAUDE.md whenever the project structure, tooling, or conventions change significantly
