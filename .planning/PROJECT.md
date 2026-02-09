# Get Shit Done — Workflow Improvements

## What This Is

Improvements to the GSD meta-prompting system: (1) adopt TDD/BDD/SDD as the primary execution workflow (Plan → Spec → Red → Green → Refactor), and (2) integrate the git-ignored worktree workflow so GSD never modifies repo root — all subagent work happens in `wt/` worktrees.

## Core Value

GSD must honor the "NEVER MODIFY REPO ROOT" contract when spawning subagents. Execution and planning that touches user code must run in worktrees; the orchestrator merges back. This is the non-negotiable constraint.

## Requirements

### Validated

- ✓ Multi-runtime install (Claude Code, OpenCode, Gemini) — existing
- ✓ Copy-and-transform install to config dirs — existing
- ✓ Slash commands and workflows (new-project, plan-phase, execute-phase, etc.) — existing
- ✓ Subagent orchestration (planner, executor, researcher, verifier) — existing
- ✓ TDD plan structure and references (`tdd.md`, plan type) — existing
- ✓ Atomic commits per task — existing
- ✓ **TDD workflow** — v1.0 (Plan → Spec → Red → Green → Refactor)
- ✓ **Worktree contract** — v1.0 (wt/ in gitignore, subagents in worktrees, repo root read-only)
- ✓ **Branch naming** — v1.0 (feature--{name}--agents--agent-{id}--{task})
- ✓ **Orchestrator merge flow** — v1.0 (merge, cleanup worktrees; test suite skipped per user decision)
- ✓ **Milestone blog posts** — v1.0 (auto-generate 2 posts per milestone)

### Active

(None — start next milestone with `/gsd:new-milestone`)

### Out of Scope

- Changing GSD's planning/orchestration model — we integrate worktrees into it, not replace it
- Supporting worktrees outside repo (e.g. `~/Repositories/`) — worktrees live in `wt/` under repo root

## Context

- **Shipped v1.0:** 2026-02-09
- **Codebase:** bin/install.js, hooks, commands, agents, templates, scripts/generate-blog-posts.js
- **Worktree skill:** [parallel-agents-in-local-worktrees](file:///Users/jordan/.claude/skills/parallel-agents-in-local-worktrees/SKILL.md)
- **TDD reference:** get-shit-done/references/tdd.md

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TDD as primary workflow | User wants Plan→Spec→Red→Green→Refactor | ✓ Shipped |
| Worktree in `wt/` | Align with parallel-agents skill | ✓ Shipped |
| Repo root read-only | Subagents never touch main working tree | ✓ Shipped |
| Test suite skipped before merge | User decision in 01-CONTEXT.md | ✓ Applied |
| Blog generation non-blocking | Milestone completion continues on failure | ✓ Shipped |

---
*Last updated: 2026-02-09 after v1.0 milestone*
