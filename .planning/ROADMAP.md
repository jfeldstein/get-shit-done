# Roadmap: GSD Workflow Improvements

## Overview

Integrate worktree-based execution (repo root read-only, subagents in wt/) and adopt TDD as the primary execution workflow. Phase 1 delivers the worktree contract; Phase 2 delivers Plan→Spec→Red→Green→Refactor as the default path.

## Phases

- [ ] **Phase 1: Worktree Integration** — Executor spawns subagents in worktrees; orchestrator merges with test verification
- [ ] **Phase 2: TDD Workflow** — Plan→Spec→Red→Green→Refactor as primary execution path

## Phase Details

### Phase 1: Worktree Integration
**Goal**: Subagent work never touches repo root; all execution happens in wt/ worktrees with proper merge flow.
**Depends on**: Nothing
**Requirements**: WT-01, WT-02, WT-03, WT-04, WT-05
**Success Criteria** (what must be TRUE):
  1. Executor spawns subagents with worktrees in wt/agent-xxx/
  2. Subagents receive instructions to never modify repo root
  3. Branch names use feature--<name>--agents--agent-<id>--<task> pattern
  4. Orchestrator merges agent branches, runs test suite (exit 0), then removes worktrees
  5. wt/ is in .gitignore (done)
**Plans**: TBD (3-5 plans expected)

Plans:
- [ ] 01-01: TBD during plan-phase
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: TDD Workflow
**Goal**: TDD (Plan→Spec→Red→Green→Refactor) is the primary execution path for applicable plans.
**Depends on**: Phase 1
**Requirements**: TDD-01, TDD-02, TDD-03
**Success Criteria** (what must be TRUE):
  1. Planner defaults to or prefers TDD plans when heuristic applies
  2. Executor runs Red-Green-Refactor cycle for TDD plans
  3. TDD plans produce 2-3 commits (test, feat, refactor)
**Plans**: TBD (2-3 plans expected)

Plans:
- [ ] 02-01: TBD during plan-phase
- [ ] 02-02: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Worktree Integration | 0/3 | Not started | - |
| 2. TDD Workflow | 0/2 | Not started | - |

---
*Roadmap created: 2025-02-03*
