# Phase 1: Worktree Integration - Context

**Gathered:** 2025-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Executor spawns subagents in wt/ worktrees; repo root is read-only. Orchestrator merges agent branches and cleans up worktrees. Branch names follow feature--<name>--agents--agent-<id>--<task> pattern. Planner, researcher, verifier are out of scope — only Executor uses worktrees.

</domain>

<decisions>
## Implementation Decisions

### Subagent scope
- Executor only — worktree workflow applies to executor-spawned subagents
- Planner, researcher, verifier continue to work in repo root (no worktrees)

### Test verification
- Skip running tests — do not require or run test suite before merge
- Merge verification proceeds without test execution step

### Feature branch naming
- Claude's discretion — derive from phase name, plan name, or config as appropriate

### Conflict resolution
- Orchestrator resolves merge conflicts — not subagent rebase
- When conflicts occur, orchestrator handles resolution

### Claude's Discretion
- Exact feature branch derivation logic
- Worktree directory naming (wt/agent-xxx vs other patterns)
- Merge strategy (--no-ff, squash, etc.)

</decisions>

<specifics>
## Specific Ideas

- Reference: parallel-agents-in-local-worktrees skill for branch naming rules and worktree commands
- wt/ already in .gitignore

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---
*Phase: 01-worktree-integration*
*Context gathered: 2025-02-03*
