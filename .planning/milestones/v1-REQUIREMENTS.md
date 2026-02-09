# Requirements Archive: v1 GSD Workflow Improvements

**Archived:** 2026-02-09
**Status:** ✅ SHIPPED

This is the archived requirements specification for v1. For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

## v1 Requirements

### Worktree Integration

- [x] **WT-01**: wt/ is in .gitignore (done)
- [x] **WT-02**: Executor spawns subagents in worktrees (wt/agent-xxx), never in repo root
- [x] **WT-03**: Repo root is read-only for all subagent work
- [x] **WT-04**: Branch names follow feature--<name>--agents--agent-<id>--<task> pattern (double-dash segments)
- [x] **WT-05**: Orchestrator merges agent branches into feature branch, then cleans up worktrees (test suite skipped per user decision)

### TDD Workflow

- [x] **TDD-01**: Plan → Spec → Red → Green → Refactor is the primary execution path
- [x] **TDD-02**: Planner produces TDD plans when heuristic applies (or by config preference)
- [x] **TDD-03**: Executor runs Red-Green-Refactor cycle for TDD plans (failing test → implement → refactor)

### Milestone Blog Posts

- [x] **BLOG-01**: /gsd:complete-milestone triggers automatic blog post generation
- [x] **BLOG-02**: Posts draw from all milestone artifacts (SUMMARY, CONTEXT, VERIFICATION, UAT, diffs, session logs)
- [x] **BLOG-03**: Posts land in docs/blog/ (gitignored) for human retrieval and external publishing

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
| BLOG-01 | Phase 3 | Complete |
| BLOG-02 | Phase 3 | Complete |
| BLOG-03 | Phase 3 | Complete |

---

## Milestone Summary

**Shipped:** 11 of 11 v1 requirements
**Adjusted:** WT-05 — Test suite execution before merge explicitly skipped per user decision
**Dropped:** None

---
*Archived: 2026-02-09 as part of v1 milestone completion*
