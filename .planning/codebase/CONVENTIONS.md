# Coding Conventions

**Analysis Date:** 2025-02-03

## Naming Patterns

**Files:**
- kebab-case for all files (`gsd-check-update.js`, `build-hooks.js`)
- Commands: `{verb}-{noun}.md` or `{noun}.md` (`new-project.md`, `map-codebase.md`)
- Agents: `gsd-{role}.md` (`gsd-codebase-mapper.md`, `gsd-planner.md`)

**Functions:**
- camelCase for all functions (`expandTilde`, `getGlobalDir`, `copyWithPathReplacement`)
- No special prefix for async (codebase uses sync fs operations)
- Handler-like: `handleStatusline`, `promptRuntime`, `promptLocation`

**Variables:**
- camelCase for variables (`explicitConfigDir`, `selectedRuntimes`, `pathPrefix`)
- UPPER_SNAKE for constants in templates/references (e.g., `HOOKS_TO_COPY` in build script)
- No underscore prefix for "private" (all module-level)

**Types:**
- No TypeScript; JSDoc used sparingly (`@param`, `@returns` in `getGlobalDir`, `getCommitAttribution`)

## Code Style

**Formatting:**
- No Prettier/ESLint config in repo
- 2-space indentation observed
- Semicolons used
- Single quotes for strings

**Linting:**
- Not configured (no .eslintrc, eslint.config.js)

## Import Organization

**Order:**
- Node built-ins first (`fs`, `path`, `os`, `readline`, `child_process`)
- No external package imports (zero deps)
- Relative requires for package.json: `require('../package.json')`

**Path Aliases:**
- None

## Error Handling

**Patterns:**
- `process.exit(1)` on invalid args or install failures
- Try/catch with silent fail in hooks (statusline, update check) - don't break host
- `verifyInstalled()` / `verifyFileInstalled()` collect failures, exit at end

**Error Types:**
- Console.error for user-facing errors
- No custom Error classes

## Logging

**Framework:** console.log, console.error

**Patterns:**
- Success: `console.log('  ${green}✓${reset} Installed ...')`
- Errors: `console.error('  ${yellow}✗${reset} Failed ...')`
- ANSI codes: cyan, green, yellow, dim, reset (inline, no chalk dependency)

## Comments

**When to Comment:**
- JSDoc for public helpers (`@param`, `@returns`)
- Inline comments for non-obvious logic (e.g., XDG spec for OpenCode config)
- Section headers for major blocks

**TODO Comments:**
- Not present in application code (only in templates as examples)

## Function Design

**Size:**
- `install.js` is large (~1150 lines); functions are 20-100 lines
- Logical grouping: config resolution, copy, convert, install, uninstall, prompts

**Parameters:**
- 2-4 parameters typical
- Callbacks for async flow (`promptRuntime(callback)`)

**Return Values:**
- Install returns `{ settingsPath, settings, statuslineCommand, runtime }` for downstream
- Uninstall returns void

## Module Design

**Exports:**
- No explicit exports; `install.js` is a script (runs on load)
- Hooks are scripts invoked by host (stdin/stdout)

**Barrel Files:**
- None

---

## Markdown / GSD Conventions (from GSD-STYLE.md)

**Commands:** YAML frontmatter with `name`, `description`, `allowed-tools`; sections: `<objective>`, `<execution_context>`, `<context>`, `<process>`, `<success_criteria>`

**Workflows:** No frontmatter; tags: `<purpose>`, `<process>`, `<step name="snake_case">`

**Templates:** Placeholders in square brackets `[Project Name]`, curly `{phase}-{plan}`

**XML tags:** Semantic only (`<objective>`, `<task>`, `<verification>`); no generic `<section>`

**Naming:** kebab-case files, `gsd:kebab-case` commands, snake_case step names, CAPS_UNDERSCORES for bash vars

---

*Convention analysis: 2025-02-03*
