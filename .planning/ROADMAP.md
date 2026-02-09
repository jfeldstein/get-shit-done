# Roadmap: GSD Workflow Improvements

## Overview

Integrate worktree-based execution (repo root read-only, subagents in wt/) and adopt TDD as the primary execution workflow. Phase 1 delivers the worktree contract; Phase 2 delivers Plan→Spec→Red→Green→Refactor as the default path.

## Phases

- [x] **Phase 1: Worktree Integration** — Executor spawns subagents in worktrees; orchestrator merges with test verification
- [ ] **Phase 2: TDD Workflow** — Plan→Spec→Red→Green→Refactor as primary execution path
- [x] **Phase 3: Milestone Blog Posts** — Auto-generate 2 technical blog posts per completed milestone

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
**Plans**: 2 plans

Plans:
- [x] 01-01: Worktree creation and executor spawn context
- [x] 01-02: Merge and cleanup after executor completes

### Phase 2: TDD Workflow
**Goal**: TDD (Plan→Spec→Red→Green→Refactor) is the primary execution path for applicable plans.
**Depends on**: Phase 1
**Requirements**: TDD-01, TDD-02, TDD-03
**Success Criteria** (what must be TRUE):
  1. Planner defaults to or prefers TDD plans when heuristic applies
  2. Executor runs Red-Green-Refactor cycle for TDD plans
  3. TDD plans produce 2-3 commits (test, feat, refactor)
**Plans**: 3 plans

Plans:
- [x] 02-01: Planner TDD preference and config
- [x] 02-02: Executor TDD cycle verification and hardening
- [ ] 02-03: Test infrastructure checkpoint (gap closure)

### Phase 3: Milestone Blog Posts
**Goal**: Automatically generate 2 technical blog posts per completed milestone: (1) architecture/project learnings, (2) agentic coding practices learnings.
**Depends on**: Phase 2
**Requirements**: BLOG-01, BLOG-02, BLOG-03
**Success Criteria** (what must be TRUE):
  1. /gsd:complete-milestone triggers blog post generation
  2. Posts draw from all milestone artifacts (summaries, context, verification, UAT, diffs, session logs)
  3. Posts land in docs/blog/ (gitignored) for human retrieval
  4. Generation failures retry, then warn without blocking
**Plans**: 3 plans

Plans:
- [x] 03-01: Blog generation infrastructure — Templates, script, retry logic, directory setup
- [x] 03-02: Artifact collection & content synthesis — Collect artifacts, synthesize architecture and agentic posts
- [x] 03-03: Workflow integration — Integrate into complete-milestone workflow with config flag

### Phase 4: Tech Debt Cleanup
**Goal**: Clean up minor tech debt from Phase 3 before milestone completion.
**Depends on**: Phase 3
**Requirements**: None (cleanup only)
**Success Criteria** (what must be TRUE):
  1. TDD pattern detection added to blog script (identifies test/feat/refactor sequences)
  2. Outdated stub comments removed from generate-blog-posts.js
**Plans**: 1 plan

Plans:
- [x] 04-01: Tech debt cleanup — TDD pattern detection, remove stub comments

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Worktree Integration | 2/2 | Complete | 2025-02-03 |
| 2. TDD Workflow | 2/3 | In progress | — |
| 3. Milestone Blog Posts | 3/3 | Complete | 2026-02-05 |
| 4. Tech Debt Cleanup | 1/1 | Complete | 2026-02-09 |

---
*Roadmap created: 2025-02-03*
*Phase 3 added: 2026-02-05*
