# Requirements: GSD Workflow Improvements

**Defined:** 2025-02-03
**Core Value:** GSD honors the "NEVER MODIFY REPO ROOT" contract when spawning subagents.

## v1 Requirements

### Worktree Integration

- [ ] **WT-01**: wt/ is in .gitignore (done)
- [x] **WT-02**: Executor spawns subagents in worktrees (wt/agent-xxx), never in repo root
- [x] **WT-03**: Repo root is read-only for all subagent work
- [x] **WT-04**: Branch names follow feature--<name>--agents--agent-<id>--<task> pattern (double-dash segments)
- [x] **WT-05**: Orchestrator merges agent branches into feature branch, then cleans up worktrees (test suite skipped per user decision)

### TDD Workflow

- [x] **TDD-01**: Plan → Spec → Red → Green → Refactor is the primary execution path
- [x] **TDD-02**: Planner produces TDD plans when heuristic applies (or by config preference)
- [x] **TDD-03**: Executor runs Red-Green-Refactor cycle for TDD plans (failing test → implement → refactor)

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
| WT-02 | Phase 1 | Complete |
| WT-03 | Phase 1 | Complete |
| WT-04 | Phase 1 | Complete |
| WT-05 | Phase 1 | Complete |
| TDD-01 | Phase 2 | Complete |
| TDD-02 | Phase 2 | Complete |
| TDD-03 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2025-02-03*
*Last updated: 2025-02-03 after roadmap creation*
