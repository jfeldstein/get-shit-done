# Architecture

**Analysis Date:** 2025-02-03

## Pattern Overview

**Overall:** File-based installer with multi-runtime support

**Key Characteristics:**
- Single executable (`bin/install.js`) handles install/uninstall
- Copy-and-transform model: Source markdown/JS → target config dir with path/format conversions
- Supports three runtimes: Claude Code, OpenCode, Gemini CLI
- No persistent application state (stateless per invocation)
- Interactive and non-interactive modes (TTY detection)

## Layers

**Entry/CLI Layer:**
- Purpose: Parse args, route to install/uninstall, handle interactive prompts
- Location: `bin/install.js` (top-level logic, `promptRuntime`, `promptLocation`, `handleStatusline`)
- Contains: Argument parsing, runtime selection, location selection
- Depends on: Install/uninstall functions
- Used by: User via npx or npm

**Install/Uninstall Layer:**
- Purpose: Copy files, transform content, configure settings
- Location: `bin/install.js` (`install()`, `uninstall()`, `copyWithPathReplacement()`, `copyFlattenedCommands()`)
- Contains: File copying, path replacement, frontmatter conversion (Claude→OpenCode, Claude→Gemini)
- Depends on: `fs`, `path`, runtime-specific dir resolution
- Used by: Entry layer

**Runtime Adapter Layer:**
- Purpose: Convert formats for target runtime (OpenCode vs Claude vs Gemini)
- Location: `bin/install.js` (`convertClaudeToOpencodeFrontmatter()`, `convertClaudeToGeminiAgent()`, `convertClaudeToGeminiToml()`, `convertToolName()`, `convertGeminiToolName()`)
- Contains: Tool name mapping, frontmatter conversion, TOML generation for Gemini
- Depends on: Source markdown structure
- Used by: Install layer during copy

**Hook Layer:**
- Purpose: Post-install behavior (update check, statusline)
- Location: `hooks/gsd-check-update.js`, `hooks/gsd-statusline.js`
- Contains: SessionStart hook (update check), statusline command (model, task, context usage)
- Depends on: Claude Code/OpenCode/Gemini host (invoked by IDE, not by this codebase)
- Used by: IDE at runtime (after install)

## Data Flow

**Install Execution:**

1. User runs `npx get-shit-done-cc` (or with flags)
2. Banner displayed, args parsed
3. Runtime selected (interactive or flags: --claude, --opencode, --gemini, --all)
4. Location selected (global vs local, interactive or flags)
5. For each runtime: `install()` copies `commands/gsd/`, `get-shit-done/`, `agents/`, hooks, CHANGELOG, VERSION
6. Path replacement: `~/.claude/` → target path in copied files
7. Frontmatter conversion for OpenCode/Gemini (tool names, format)
8. Settings.json updated: hooks, statusline, attribution
9. Completion message

**State Management:**
- No in-process state
- File-based: Installed files live in user config dir
- Cache: `~/.claude/cache/gsd-update-check.json` written by background process

## Key Abstractions

**getGlobalDir(runtime, explicitDir):**
- Purpose: Resolve config directory for each runtime
- Examples: `~/.claude`, `~/.config/opencode`, `~/.gemini`
- Pattern: Env var overrides, then defaults

**copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime):**
- Purpose: Recursive copy with `~/.claude/` → pathPrefix in .md files
- Pattern: Clean install (rm dest first), transform on copy

**convertClaudeToOpencodeFrontmatter / convertClaudeToGeminiAgent:**
- Purpose: Adapt Claude Code markdown to OpenCode/Gemini formats
- Pattern: Parse YAML frontmatter, map tool names, rewrite

## Entry Points

**CLI Entry:**
- Location: `bin/install.js`
- Triggers: `npx get-shit-done-cc`, `get-shit-done-cc` (if installed globally)
- Responsibilities: Parse args, prompt or use flags, call install/uninstall

**Hooks (post-install, invoked by host):**
- `hooks/gsd-check-update.js` - SessionStart: spawns background process to check npm version
- `hooks/gsd-statusline.js` - Statusline: reads JSON from stdin, outputs model | task | dir | context bar

## Error Handling

**Strategy:** Exit on fatal errors, silent fail for non-critical (e.g., statusline parse errors)

**Patterns:**
- `process.exit(1)` on invalid args, install failures
- Try/catch in hooks with silent fail (don't break statusline)
- `verifyInstalled()` / `verifyFileInstalled()` track failures, exit at end if any

## Cross-Cutting Concerns

**Logging:** console.log (success), console.error (errors), chalk-like ANSI codes (cyan, green, yellow, dim, reset)

**Validation:** Manual checks (e.g., --config-dir requires value, --global and --local mutually exclusive)

**Attribution:** `getCommitAttribution()`, `processAttribution()` - Reads settings.json, rewrites Co-Authored-By in copied files

---

*Architecture analysis: 2025-02-03*
