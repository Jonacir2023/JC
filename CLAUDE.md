# CLAUDE.md

Guidance for Claude Code working with the **JC** repository and its Obsidian Vault.

## Repository Overview

**JC** — "Dados do Claude" (Portuguese: "Claude's data") — is a knowledge management system combining:
- **Claude Code**: Terminal-first development and task execution
- **Obsidian Vault**: Structured markdown knowledge layer with linking and graph relationships

This creates a lightweight memory system where context lives in markdown docs, not just code.

## Obsidian Vault Structure

```
JC/
├── 00-Home/              # Entry point, quick links
├── 01-Project-Overview/  # Project goals, status, roadmap
├── 02-Architecture/      # System design, components, patterns
├── 03-Components/        # Individual component details
├── 04-Decisions/         # ADRs (Architecture Decision Records)
├── 05-APIs/              # API documentation, integrations
├── 06-Prompts/           # Reusable prompts for Claude
├── 07-Tasks/             # Sprint tasks, checklist, progress
├── 08-Notes/             # Daily notes, brainstorm (temporary)
└── CLAUDE.md             # This file
```

## How to Use This Vault

### For Claude Code Sessions
- When starting work: Read from `00-Home/README.md` and relevant folders for context
- Reference `04-Decisions/` for architectural context before proposing changes
- Document decisions in `04-Decisions/` with ADR template
- Link related files with `[[folder/file|label]]` syntax

### For Opening in Obsidian
1. Install Obsidian: `obsidian.md`
2. Open folder as vault: File → Open folder as vault → select JC directory
3. Use graph view to explore relationships between notes
4. Check `04-Decisions/` for ADRs before making architectural changes

## Key Conventions

### Markdown
- Use consistent heading hierarchy (# Title, ## Section, ### Subsection)
- Link files: `[[04-Decisions/README|Decisions Log]]`
- Use tables for structured data
- Keep files short and focused

### Naming
- Folders: `NN-FolderName` (numbered, clear prefix)
- Files: `lowercase-kebab-case.md` for regular files, `README.md` for folder summaries
- ADRs: `ADR-NNNN-title.md` (e.g., `ADR-0001-use-obsidian-vault.md`)

### Content Rules (The 5 Rules)
1. **Keep the vault simple** — Clear structure, easy navigation
2. **Use markdown consistently** — All content in standard format
3. **Maintain CLAUDE.md updated** — Living guide of the project
4. **Separate long-term knowledge from temporary notes** — 04-Decisions != 08-Notes
5. **Review and update the vault often** — Knowledge stays fresh

### Weekly Maintenance
- [ ] Review notes in `08-Notes/` 
- [ ] Promote insights to appropriate folders
- [ ] Delete outdated temporary notes
- [ ] Archive completed tasks
- [ ] Update `07-Tasks/` with latest status

## Current Stack

- **CLI**: Claude Code (terminal-based)
- **Knowledge**: Obsidian Vault (markdown + linking)
- **VCS**: Git (this repository)
- **Language/Code**: TBD — will be added as project evolves

## Build & Test Commands

Not applicable yet. This is a knowledge repository. When code is added:
- Add build commands here (npm, make, python, etc.)
- Add test commands (how to run full suite and individual tests)
- Add lint/format commands

## Important Links

- **Home**: `[[00-Home/README|JC Home]]`
- **Decisions**: `[[04-Decisions/README|ADRs]]`
- **Tasks**: `[[07-Tasks/README|Current Work]]`
- **Architecture**: `[[02-Architecture/README|System Design]]`

---

**Last updated**: 2026-06-06  
**Next review**: 2026-06-13
