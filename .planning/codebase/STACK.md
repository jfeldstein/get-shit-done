# Technology Stack

**Analysis Date:** 2025-02-03

## Languages

**Primary:**
- JavaScript (ES6+) - All application code (`bin/install.js`, `hooks/*.js`, `scripts/*.js`)

**Secondary:**
- Markdown - Commands, workflows, templates, agents, references

## Runtime

**Environment:**
- Node.js >=16.7.0 (per `package.json` engines)
- No browser runtime (CLI/installer only)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- None (vanilla Node.js)

**Testing:**
- Not detected (no test framework, no `*.test.js` or `*.spec.js`)

**Build/Dev:**
- esbuild ^0.24.0 - Dev dependency (listed but not used in build scripts; `build:hooks` only copies files)
- `scripts/build-hooks.js` - Copies hooks to `hooks/dist/` for packaging

## Key Dependencies

**Critical:**
- None (zero runtime dependencies in `package.json`)

**Infrastructure:**
- Node.js built-ins: `fs`, `path`, `os`, `readline`, `child_process` - File operations, path resolution, process spawning

## Configuration

**Environment:**
- Optional: `CLAUDE_CONFIG_DIR`, `GEMINI_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `XDG_CONFIG_HOME` - Override default config paths
- No required env vars for core operation

**Build:**
- `package.json` - Project manifest, bin entry, prepublishOnly script
- No tsconfig, vite, or webpack

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js)
- No external services required

**Production:**
- Distributed as npm package (`get-shit-done-cc`)
- Installed via `npx get-shit-done-cc` or `npm install -g get-shit-done-cc`
- Copies files to user's config directory (`~/.claude`, `~/.config/opencode`, or `~/.gemini`)

---

*Stack analysis: 2025-02-03*
