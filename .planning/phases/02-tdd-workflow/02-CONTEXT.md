# Phase 2: TDD Workflow - Context

**Gathered:** 2025-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

TDD (Plan→Spec→Red→Green→Refactor) becomes the primary execution path for applicable plans. This phase modifies how the planner structures tasks and how the executor runs them. The workflow produces 2-3 commits (test, feat, refactor) per TDD cycle.

</domain>

<decisions>
## Implementation Decisions

### TDD Default Behavior
- TDD on/off default is a **config option** — user sets preference per project
- Config location: `.planning/config.json` (existing config pattern)
- When not configured, system should have a sensible default (Claude's discretion)

### TDD Applicability Heuristic
- Based on **task type**, not code characteristics
- TDD applies to: bug fixes, new logic/features
- TDD skips: refactors, integrations, config changes, documentation, templates
- Classification is **inferred** from task description — no explicit tags required
- Planner/executor figures out applicability from context

### Missing Test Infrastructure
- When project has no test infrastructure: **ask user**
- Prompt: "Set up test infrastructure first?" or "Proceed without TDD?"
- Don't silently skip TDD or silently set up tests

### Claude's Discretion
- Default value when config not set
- Exact heuristic rules for inferring TDD applicability
- How to detect "no test infrastructure" state
- Test infrastructure setup approach if user opts in

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for TDD workflow implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-tdd-workflow*
*Context gathered: 2025-02-04*
