# Phase 1: Worktree Integration — Research

**Research Date:** 2025-02-03

## Summary

Integrate git worktrees into GSD's execute-phase so executor subagents work in isolated `wt/agent-xxx/` directories. Repo root stays read-only. Reference: parallel-agents-in-local-worktrees skill.

## Key Findings

### Worktree Commands

```bash
# Create worktree with new branch
git worktree add -b "feature--{name}--agents--agent-{id}--{task}" "wt/agent-{id}"

# Remove worktree
git worktree remove wt/agent-{id}
# Or force: git worktree remove --force wt/agent-{id}

# List worktrees
git worktree list
```

### Branch Naming (from skill)

- Use double-dash `--` between segments (not slash — causes refs/heads conflicts)
- Sanitize: lowercase, hyphens, alphanumeric only, max 50 chars per segment
- Pattern: `feature--{phase-slug}--agents--agent-{4-char-id}--{plan-slug}`

### Sanitization Function

```bash
sanitize_branch_name() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | head -c 50
}
```

### Execute-Phase Integration Points

1. **Before spawn** (execute_waves step): For each plan in wave, create worktree + agent branch
2. **Spawn prompt**: Add worktree path; instruct executor to work exclusively there
3. **After spawn**: Merge agent branch into base branch; remove worktree; delete agent branch

### Base Branch

- Use current branch (or phase branch if branching_strategy=phase)
- Agent branches merge into this

### Conflict Resolution

- User decision: Orchestrator resolves conflicts (not subagent rebase)
- If conflict: orchestrator merges, resolves, commits

### Test Verification

- User decision: Skip test execution before merge

## Files to Modify

- `get-shit-done/workflows/execute-phase.md` — Add worktree creation, spawn context, merge/cleanup logic

## Constraints from CONTEXT.md

- Executor only (planner, researcher, verifier unchanged)
- Skip tests before merge
- Orchestrator resolves conflicts
- Feature branch naming: Claude's discretion

---
*Research complete: 2025-02-03*
