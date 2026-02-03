# Codebase Structure

**Analysis Date:** 2025-02-03

## Directory Layout

```
get-shit-done/
├── .github/              # GitHub config
│   ├── FUNDING.yml
│   └── pull_request_template.md
├── agents/               # Subagent definitions (gsd-*.md)
├── assets/               # Logos, images
├── bin/                  # CLI entry point
│   └── install.js
├── commands/             # Slash command definitions
│   └── gsd/              # GSD commands (*.md)
├── get-shit-done/        # Installed skill resources
│   ├── references/       # Principle documents
│   ├── templates/        # File templates
│   │   ├── codebase/     # Codebase mapping templates
│   │   └── research-project/
│   └── workflows/        # Multi-step procedures
├── hooks/                # IDE hooks (source)
│   ├── dist/             # Built hooks (copied by build script)
│   ├── gsd-check-update.js
│   └── gsd-statusline.js
├── scripts/              # Build scripts
│   └── build-hooks.js
├── package.json
└── README.md
```

## Directory Purposes

**bin/:**
- Purpose: Executable entry point
- Contains: `install.js` - Full install/uninstall logic
- Key files: `install.js` - ~1150 lines, handles all runtimes

**commands/gsd/:**
- Purpose: Slash command definitions for Claude Code / OpenCode / Gemini
- Contains: `*.md` files (new-project.md, plan-phase.md, execute-phase.md, etc.)
- Key files: `new-project.md`, `map-codebase.md`, `execute-phase.md`
- Naming: kebab-case.md

**agents/:**
- Purpose: Subagent definitions (gsd-codebase-mapper, gsd-planner, etc.)
- Contains: `gsd-*.md` files
- Key files: `gsd-codebase-mapper.md`, `gsd-planner.md`, `gsd-roadmapper.md`

**get-shit-done/references/:**
- Purpose: Core philosophy and guidance
- Contains: `*.md` (questioning.md, ui-brand.md, tdd.md, etc.)
- Key files: `questioning.md`, `ui-brand.md`, `verification-patterns.md`

**get-shit-done/templates/:**
- Purpose: Document templates for .planning/ and research
- Contains: `*.md` (project.md, roadmap.md, requirements.md), `codebase/*.md`, `research-project/*.md`
- Key files: `project.md`, `requirements.md`, `codebase/architecture.md`

**get-shit-done/workflows/:**
- Purpose: Reusable multi-step procedures
- Contains: `*.md` (execute-phase.md, map-codebase.md, discovery-phase.md, etc.)
- Key files: `map-codebase.md`, `execute-phase.md`, `complete-milestone.md`

**hooks/:**
- Purpose: IDE hooks (update check, statusline)
- Contains: `gsd-check-update.js`, `gsd-statusline.js`; `dist/` holds built copies
- Key files: `gsd-statusline.js` (reads stdin JSON, outputs status bar)

**scripts/:**
- Purpose: Build tooling
- Contains: `build-hooks.js` - Copies hooks to `hooks/dist/`

## Key File Locations

**Entry Points:**
- `bin/install.js` - CLI entry (bin in package.json)

**Configuration:**
- `package.json` - Manifest, bin, engines, prepublishOnly
- `.gitignore` - Excluded files

**Core Logic:**
- `bin/install.js` - Install, uninstall, copy, convert, settings

**Documentation:**
- `README.md` - User-facing
- `GSD-STYLE.md` - Writing conventions for contributors
- `CHANGELOG.md` - Version history

## Naming Conventions

**Files:**
- kebab-case.md: Markdown documents
- kebab-case.js: JavaScript
- gsd-*.md: GSD agents and commands (after install, flattened for OpenCode)

**Directories:**
- kebab-case: All directories
- Plural for collections: commands/, agents/, templates/, workflows/, references/

**Special Patterns:**
- `gsd:command-name` in frontmatter → `/gsd:command-name` (Claude) or `/gsd-command-name` (OpenCode)

## Where to Add New Code

**New Slash Command:**
- Primary: `commands/gsd/{command-name}.md`
- Reference from workflows as needed

**New Agent:**
- Implementation: `agents/gsd-{agent-name}.md`
- Spawned by commands/workflows via Task tool

**New Template:**
- Implementation: `get-shit-done/templates/{name}.md` or `templates/codebase/{name}.md`
- Usage: Referenced by commands with @ path

**New Workflow:**
- Implementation: `get-shit-done/workflows/{name}.md`
- Usage: Referenced from command `<execution_context>` or `<process>`

**New Hook:**
- Implementation: `hooks/gsd-{hook-name}.js`
- Build: Add to `HOOKS_TO_COPY` in `scripts/build-hooks.js`
- Install: Add to `install()` hook copy logic and settings registration

**Utilities:**
- No shared utils directory; logic lives in `bin/install.js` or inline in hooks

## Special Directories

**get-shit-done/:**
- Purpose: Source for installed skill (copied to ~/.claude/get-shit-done, etc.)
- Committed: Yes

**hooks/dist/:**
- Purpose: Built hooks for npm package (included in `files` in package.json)
- Source: `scripts/build-hooks.js` copies from hooks/
- Committed: Yes (prepublishOnly runs build)

---

*Structure analysis: 2025-02-03*
