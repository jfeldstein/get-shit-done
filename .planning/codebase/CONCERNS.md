# Codebase Concerns

**Analysis Date:** 2025-02-03

## Tech Debt

**Monolithic install.js:**
- Issue: ~1150 lines in single file; install, uninstall, conversion, prompts all in one module
- Files: `bin/install.js`
- Impact: Hard to test, hard to change one concern without touching others
- Fix approach: Extract modules: `lib/runtime-config.js`, `lib/convert-opencode.js`, `lib/convert-gemini.js`, `lib/copy.js`; keep `bin/install.js` as thin orchestrator

**Hardcoded paths for Claude Code:**
- Issue: `gsd-check-update.js` and `gsd-statusline.js` reference `~/.claude` directly
- Files: `hooks/gsd-check-update.js` (cacheDir, projectVersionFile, globalVersionFile), `hooks/gsd-statusline.js` (todosDir, cacheFile)
- Impact: OpenCode/Gemini installs may use wrong paths for cache/todos
- Fix approach: Resolve config dir from env (CLAUDE_CONFIG_DIR, OPENCODE_CONFIG_DIR, GEMINI_CONFIG_DIR) or pass as arg; document which runtimes support update check/statusline

**Orphaned file cleanup is hardcoded:**
- Issue: `cleanupOrphanedFiles`, `cleanupOrphanedHooks` use fixed string arrays
- Files: `bin/install.js` (lines ~530-540, ~550-560)
- Impact: New removals require code changes; easy to forget
- Fix approach: Consider versioned manifest or CHANGELOG-driven cleanup

## Known Bugs

- None identified from code inspection

## Security Considerations

**npm exec in update check:**
- Risk: `execSync('npm view get-shit-done-cc version')` runs in background; if npm is compromised or hijacked, could run arbitrary code
- Files: `hooks/gsd-check-update.js`
- Current mitigation: Timeout 10s, windowsHide; runs in spawned process
- Recommendations: Accept risk for public package check; document that users can disable update hook

**Path traversal:**
- Risk: `--config-dir` and path replacement use user-controlled paths
- Files: `bin/install.js` (`expandTilde`, `parseConfigDirArg`, `copyWithPathReplacement`)
- Current mitigation: No validation of path components
- Recommendations: Validate no `..` in path segments if security becomes a concern

## Performance Bottlenecks

**Synchronous file operations:**
- Problem: All fs operations are sync (`readFileSync`, `writeFileSync`, `readdirSync`)
- Files: `bin/install.js`, `hooks/*.js`
- Cause: Simplicity; install is one-shot
- Improvement path: Low priority; install typically <2s; async would help only for very large trees

## Fragile Areas

**Frontmatter parsing:**
- Files: `bin/install.js` (`convertClaudeToOpencodeFrontmatter`, `convertClaudeToGeminiAgent`)
- Why fragile: Line-by-line string parsing; no YAML library; edge cases (nested structures, multiline) could break
- Safe modification: Add tests for conversion; consider using `yaml` or `js-yaml` for parsing
- Test coverage: None

**Tool name mappings:**
- Files: `bin/install.js` (`claudeToOpencodeTools`, `claudeToGeminiTools`, `convertToolName`, `convertGeminiToolName`)
- Why fragile: Manual mapping; new Claude tools require explicit mapping or fall through to lowercase
- Safe modification: Document mapping table; add test that all tools in agents resolve
- Test coverage: None

## Scaling Limits

**Command count:**
- Current: ~25 commands in `commands/gsd/`
- Limit: Install copies each; no inherent limit
- Scaling path: N/A

**Package size:**
- Current: Small (markdown + few JS files)
- Limit: npm package size limits
- Scaling path: N/A

## Dependencies at Risk

**esbuild:**
- Risk: Dev dependency, not used in build (build-hooks.js only copies files)
- Impact: Dead dependency; could remove
- Migration plan: Remove from devDependencies if confirmed unused

## Missing Critical Features

**Tests:**
- Problem: No automated tests
- Current workaround: Manual verification
- Blocks: Refactoring confidence, regression detection
- Implementation complexity: Medium (mock fs, child_process; snapshot for converted output)

## Test Coverage Gaps

**Install flow:**
- What's not tested: Path replacement, frontmatter conversion, settings merge
- Risk: Breaking change in conversion could ship broken installs
- Priority: Medium
- Difficulty to test: Need fs mocks, temp dirs

**Hook behavior:**
- What's not tested: Statusline output format, update check cache write
- Risk: Statusline parse errors break IDE UI
- Priority: Low (hooks fail silently)
- Difficulty to test: Need stdin mock, assert stdout

---

*Concerns audit: 2025-02-03*
