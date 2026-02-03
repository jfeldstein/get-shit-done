# External Integrations

**Analysis Date:** 2025-02-03

## APIs & External Services

**npm registry:**
- Used for: Version check during update notification
- Integration: `execSync('npm view get-shit-done-cc version')` in `hooks/gsd-check-update.js`
- Auth: None (public package metadata)
- Rate limits: npm registry limits apply (not documented in codebase)

## Data Storage

**Databases:**
- None

**File Storage:**
- Local filesystem only
- Writes to user config directories (`~/.claude`, `~/.config/opencode`, `~/.gemini`)
- Reads from project directory during install

**Caching:**
- `~/.claude/cache/gsd-update-check.json` - Caches npm version check result (update availability, installed vs latest)

## Authentication & Identity

**Auth Provider:**
- None (no user auth)

**Identity:**
- Co-Authored-By lines in copied files - Configurable via `settings.json` attribution settings per runtime

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- stdout/stderr only (console.log, console.error in `bin/install.js`)
- Hooks run silently (stdio: 'ignore' for update check; statusline reads JSON from stdin)

## CI/CD & Deployment

**Hosting:**
- npm registry (package distribution)
- No hosting platform for the tool itself

**CI Pipeline:**
- `.github/` contains `FUNDING.yml`, `pull_request_template.md` - No CI workflows detected in project layout

## Environment Configuration

**Required env vars:**
- None

**Optional env vars:**
- `CLAUDE_CONFIG_DIR` - Override Claude Code config path
- `GEMINI_CONFIG_DIR` - Override Gemini config path
- `OPENCODE_CONFIG_DIR` - Override OpenCode config path
- `XDG_CONFIG_HOME` - Used for OpenCode path resolution

**Secrets location:**
- No secrets (no API keys, no credentials)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2025-02-03*
