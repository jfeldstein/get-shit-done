# Requirements: GSD Workflow Improvements

**Defined:** 2025-02-03
**Core Value:** GSD honors the "NEVER MODIFY REPO ROOT" contract when spawning subagents.

## v1 Requirements

### Worktree Integration

- [ ] **WT-01**: wt/ is in .gitignore (done)
- [ ] **WT-02**: Executor spawns subagents in worktrees (wt/agent-xxx), never in repo root
- [ ] **WT-03**: Repo root is read-only for all subagent work
- [ ] **WT-04**: Branch names follow feature--<name>--agents--agent-<id>--<task> pattern (double-dash segments)
- [ ] **WT-05**: Orchestrator merges agent branches into feature branch, runs test suite (exit 0), then cleans up worktrees

### TDD Workflow

- [ ] **TDD-01**: Plan → Spec → Red → Green → Refactor is the primary execution path
- [ ] **TDD-02**: Planner produces TDD plans when heuristic applies (or by config preference)
- [ ] **TDD-03**: Executor runs Red-Green-Refactor cycle for TDD plans (failing test → implement → refactor)

## v2 Requirements

(None — deferred items would go here)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Worktrees outside repo (e.g. ~/Repositories/) | Per skill, worktrees live in wt/ under repo root |
| Replacing GSD planning model | Integrate worktrees into existing orchestration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WT-01 | Phase 1 | Complete |
| WT-02 | Phase 1 | Pending |
| WT-03 | Phase 1 | Pending |
| WT-04 | Phase 1 | Pending |
| WT-05 | Phase 1 | Pending |
| TDD-01 | Phase 2 | Pending |
| TDD-02 | Phase 2 | Pending |
| TDD-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2025-02-03*
*Last updated: 2025-02-03 after roadmap creation*
