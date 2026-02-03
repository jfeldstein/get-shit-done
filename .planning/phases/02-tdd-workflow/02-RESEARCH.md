# Phase 2: TDD Workflow - Research

**Researched:** 2025-02-03
**Domain:** GSD meta-prompting workflow, TDD integration
**Confidence:** HIGH

## Summary

Phase 2 integrates TDD (Plan→Spec→Red→Green→Refactor) as the primary execution path for applicable plans. The GSD codebase already contains substantial TDD infrastructure: `get-shit-done/references/tdd.md` defines the cycle, `gsd-planner` has a TDD detection heuristic, and `execute-plan` workflow has `<tdd_plan_execution>` for plans with `type: tdd` in frontmatter.

The gap is operational: (1) Planner does not explicitly default to TDD when heuristic applies—no config drives preference; (2) Executor flow is correct but plan-type detection and reference loading need verification; (3) No config option exists for `workflow.tdd_preference`.

**Primary recommendation:** Add `workflow.tdd_preference` to config, update planner to honor it, and ensure executor/execute-phase correctly route TDD plans through the Red-Green-Refactor cycle.

## Standard Stack

### Core (GSD Internal)

| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| `get-shit-done/references/tdd.md` | TDD cycle, plan structure, commit pattern | Canonical TDD reference |
| `get-shit-done/workflows/execute-plan.md` | Plan execution, `<tdd_plan_execution>` | Executor follows this |
| `agents/gsd-planner.md` | TDD detection heuristic | Planner creates TDD plans |
| `.planning/config.json` | workflow.* settings | Planning behavior config |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `get-shit-done/templates/phase-prompt.md` | Plan structure template | Plan creation |
| `get-shit-done/templates/summary.md` | TDD summary format | Post-execution |

**No external libraries.** This phase modifies GSD workflow documents and config only.

## Architecture Patterns

### TDD Plan Detection Flow

```
Planner evaluates task → Heuristic: expect(fn(input)).toBe(output)? 
  → Yes: Create plan with type: tdd
  → No: Create plan with type: execute
```

### Executor TDD Routing

```
Read PLAN.md frontmatter → type: tdd?
  → Yes: Follow <tdd_plan_execution> (RED → GREEN → REFACTOR)
  → No: Standard task execution
```

### Config-Driven Preference

```
workflow.tdd_preference: "default" | "always" | "never"
  → default: Apply heuristic, create TDD plan when applicable
  → always: Prefer TDD for all testable features (stricter)
  → never: Skip TDD plans, use standard execute plans only
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TDD cycle definition | Custom cycle | tdd.md reference | Already defined, consistent |
| Plan type detection | Custom parsing | Frontmatter `type: tdd` | Standard in planner/executor |
| Commit pattern | Custom format | test/feat/refactor | Matches git-integration.md |

## Common Pitfalls

### Pitfall 1: Planner Ignores Config
**What goes wrong:** Planner creates standard plans for TDD candidates when config says "always"
**Why it happens:** Planner prompt doesn't include config or tdd_preference
**How to avoid:** Inline `workflow.tdd_preference` in planner spawn prompt; planner checks before task breakdown
**Warning signs:** TDD-eligible features get `type: execute` plans

### Pitfall 2: Executor Skips TDD Logic
**What goes wrong:** Plans with `type: tdd` executed as standard tasks
**Why it happens:** Executor doesn't check frontmatter before execution
**How to avoid:** execute-plan.md already has `<tdd_plan_execution>`; ensure it's in required_reading or execution_context
**Warning signs:** Single feat commit instead of test/feat/refactor

### Pitfall 3: Config Schema Drift
**What goes wrong:** config.json has tdd_preference but template/config docs don't
**Why it happens:** Adding to one place only
**How to avoid:** Update config template, REQUIREMENTS traceability, and any config docs together

## Code Examples

### Plan Frontmatter (TDD)

```yaml
---
phase: 02-tdd-workflow
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified: []
autonomous: true
---
```

### Config Addition

```json
{
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "tdd_preference": "default"
  }
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| TDD optional, planner discretion | Config-driven tdd_preference | Predictable behavior |
| No explicit "primary path" | Plan→Spec→Red→Green→Refactor as default | Aligns with TDD-01 |

## Open Questions

1. **Config default:** Should `tdd_preference` default to `"default"` when absent? Recommendation: Yes, backward compatible.
2. **"always" strictness:** What exactly does "always" mean? Recommendation: For any task where heuristic applies, MUST create TDD plan; "default" allows planner judgment to skip in edge cases.

## Sources

### Primary (HIGH confidence)
- get-shit-done/references/tdd.md — TDD structure, cycle, commits
- get-shit-done/workflows/execute-plan.md — tdd_plan_execution section
- agents/gsd-planner.md — TDD detection heuristic, plan format

### Secondary (MEDIUM confidence)
- .planning/REQUIREMENTS.md — TDD-01, TDD-02, TDD-03
- .planning/ROADMAP.md — Phase 2 goal and success criteria

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — internal docs, no external deps
- Architecture: HIGH — flow is documented in existing workflows
- Pitfalls: MEDIUM — inferred from config/planner/executor flow

**Research date:** 2025-02-03
**Valid until:** 30 days (stable workflow docs)
