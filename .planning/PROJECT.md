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

### Active

- [ ] **TDD workflow**: Plan → Spec → Red → Green → Refactor as primary execution path
- [ ] **Worktree contract**: Add `wt/` to gitignore; subagents work only in worktrees; repo root read-only
- [ ] **Branch naming**: Follow `feature--<name>--agents--agent-<id>--<task>` pattern (double-dash segments)
- [ ] **Merge verification**: Orchestrator merges agent branches, runs test suite (exit 0), then cleanup

### Out of Scope

- Changing GSD's planning/orchestration model — we integrate worktrees into it, not replace it
- Supporting worktrees outside repo (e.g. `~/Repositories/`) — worktrees live in `wt/` under repo root

## Context

- **Existing codebase**: `bin/install.js` (~1150 lines), hooks, commands, agents, templates. No test framework.
- **Worktree skill**: [parallel-agents-in-local-worktrees](file:///Users/jordan/.claude/skills/parallel-agents-in-local-worktrees/SKILL.md) defines the contract: `wt/` for worktrees, repo root read-only, sanitized branch names, mandatory test execution before merge.
- **TDD reference**: `get-shit-done/references/tdd.md` defines TDD plan structure and Red-Green-Refactor cycle. User wants this as the default/preferred workflow.

## Constraints

- **Compatibility**: Must not break existing GSD installs or workflows
- **Stack**: Node.js, no new runtime dependencies unless justified
- **Worktree location**: `wt/` inside repo root (per skill)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TDD as primary workflow | User wants Plan→Spec→Red→Green→Refactor | — Pending |
| Worktree in `wt/` | Align with parallel-agents skill | — Pending |
| Repo root read-only | Subagents never touch main working tree | — Pending |

---
*Last updated: 2025-02-03 after initialization*
