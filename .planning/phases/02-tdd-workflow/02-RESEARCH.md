# Phase 2: TDD Workflow - Research

**Researched:** 2025-02-04
**Domain:** GSD meta-prompting workflow, TDD integration
**Confidence:** HIGH

## Summary

Phase 2 integrates TDD (Plan→Spec→Red→Green→Refactor) as the primary execution path for applicable plans. This is a re-research based on user decisions from `/gsd:discuss-phase` that introduce specific requirements not covered in the original implementation.

**Key user decisions that constrain this research:**
1. **TDD on/off is a config option** — Already implemented (`workflow.tdd_preference`)
2. **TDD applicability based on task type** — Heuristic already exists in gsd-planner
3. **Missing test infrastructure: ASK USER** — **GAP: Current implementation silently installs; user wants explicit prompt**

**Primary recommendation:** Modify the TDD flow to detect missing test infrastructure and present a checkpoint asking user "Set up test infrastructure first?" or "Proceed without TDD?" before proceeding.

## What's Already Implemented

The original Phase 2 implementation added:

| Component | Status | Location |
|-----------|--------|----------|
| `workflow.tdd_preference` config | ✓ Complete | `.planning/config.json`, `get-shit-done/templates/config.json` |
| Planner TDD preference handling | ✓ Complete | `agents/gsd-planner.md` |
| Plan-phase passes preference | ✓ Complete | `commands/gsd/plan-phase.md` |
| Executor TDD cycle (RED/GREEN/REFACTOR) | ✓ Complete | `get-shit-done/workflows/execute-plan.md` |
| Plan-level `type: tdd` detection | ✓ Complete | `agents/gsd-executor.md` |

## Gap: Missing Test Infrastructure Handling

### Current Behavior (Problem)

From `get-shit-done/references/tdd.md` and `execute-plan.md`:

```
**1. Check test infrastructure (if first TDD plan):**
If no test framework configured:
- Detect project type from package.json/requirements.txt/etc.
- Install minimal test framework (Jest, pytest, Go testing, etc.)
- Create test config file
- Verify: run empty test suite
- This is part of the RED phase
```

This **silently sets up tests** without asking. The user explicitly decided:

> "When project has no test infrastructure: **ask user** — 'Set up test infrastructure first?' or 'Proceed without TDD?'"

### Required Behavior (Solution)

Before executing a TDD plan in a project with no test infrastructure:
1. Detect the "no test infrastructure" state
2. Present a checkpoint with options
3. Honor user's choice (setup or skip TDD)

## Standard Stack

### Core (GSD Internal — No Changes Needed)

| Component | Purpose | Location |
|-----------|---------|----------|
| `get-shit-done/references/tdd.md` | TDD cycle, plan structure, commit pattern | Already complete |
| `get-shit-done/workflows/execute-plan.md` | Plan execution, `<tdd_plan_execution>` | Needs modification |
| `agents/gsd-planner.md` | TDD detection heuristic | No changes needed |
| `agents/gsd-executor.md` | TDD execution | Needs modification |
| `.planning/config.json` | `workflow.tdd_preference` | Already complete |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `get-shit-done/references/checkpoints.md` | Checkpoint patterns | Reference for user prompt format |
| `get-shit-done/templates/codebase/testing.md` | Test detection patterns | Reference for what signals "no tests" |

**No external libraries.** This phase modifies GSD workflow documents only.

## Architecture Patterns

### Test Infrastructure Detection (Claude's Discretion)

**Signals indicating "no test infrastructure":**

| Project Type | No Tests Signal | Has Tests Signal |
|--------------|-----------------|------------------|
| **Node.js** | No `"test"` script in package.json, OR script is `"echo \"Error: no test specified\" && exit 1"` | Jest/Vitest/Mocha in devDependencies AND test script exists |
| **Python** | No pytest/unittest in requirements.txt/pyproject.toml, no `tests/` dir | pytest in dependencies AND test files exist |
| **Go** | No `*_test.go` files anywhere in project | Any `*_test.go` file exists |
| **Rust** | No `#[test]` or `#[cfg(test)]` in any `.rs` file | Test attributes present |

**Detection command (Node.js example):**

```bash
# Check for test infrastructure
HAS_TESTS=false

# 1. Check package.json for test script and dependencies
if [ -f package.json ]; then
  TEST_SCRIPT=$(jq -r '.scripts.test // ""' package.json 2>/dev/null)
  if [[ -n "$TEST_SCRIPT" && "$TEST_SCRIPT" != *"no test specified"* ]]; then
    HAS_TESTS=true
  fi
  
  # Also check for test framework in devDependencies
  if jq -e '.devDependencies | has("jest") or has("vitest") or has("mocha")' package.json >/dev/null 2>&1; then
    HAS_TESTS=true
  fi
fi

# 2. Check for test files
if ls **/*.test.{js,ts,jsx,tsx} **/*.spec.{js,ts,jsx,tsx} 2>/dev/null | head -1 | grep -q .; then
  HAS_TESTS=true
fi

# 3. Check for test directories
if [ -d "__tests__" ] || [ -d "tests" ] || [ -d "test" ]; then
  HAS_TESTS=true
fi
```

### Where to Add the Checkpoint

**Option A: In Executor (Recommended)**

Add to `<tdd_plan_execution>` section in `execute-plan.md` and `gsd-executor.md`:

```
Before RED phase:
1. Detect test infrastructure
2. If missing → Present checkpoint:
   - Option 1: Set up test infrastructure (install framework, create config)
   - Option 2: Proceed without TDD (convert to standard execution)
3. Honor user choice
```

**Why Executor (not Planner):**
- Planner creates plans based on heuristic; it doesn't know runtime state
- Executor sees the actual project at execution time
- Checkpoint fits naturally before RED phase
- Allows same plan to work in projects with/without tests

**Option B: In Planner (Alternative)**

Planner could check for test infrastructure and skip TDD plan creation if missing. But this:
- Requires planner to inspect codebase (adds complexity)
- Prevents TDD for projects that will have tests later
- Doesn't match user's stated flow ("ask" implies runtime decision)

### Checkpoint Format

Following GSD checkpoint conventions from `checkpoints.md`:

```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Test Infrastructure Required             ║
╚═══════════════════════════════════════════════════════╝

This is a TDD plan but no test infrastructure was detected.

**Detected project type:** {Node.js | Python | Go | Rust | Unknown}

**Missing:**
- No test framework in dependencies
- No test script configured
- No test files found

**Options:**

1. **Set up test infrastructure** — I'll install {Jest/pytest/etc.} and create minimal config
   
2. **Proceed without TDD** — Convert this to a standard execution (no tests first)

────────────────────────────────────────────────────────
→ YOUR ACTION: Type "setup" or "skip"
────────────────────────────────────────────────────────
```

### TDD Applicability Heuristic (Claude's Discretion)

The user specified TDD applies based on **task type**, not code characteristics:

| TDD Applies | TDD Skips |
|-------------|-----------|
| Bug fixes | Refactors |
| New logic/features | Integrations |
| API endpoints | Config changes |
| Business logic | Documentation |
| Data transformations | Templates |
| Validation rules | Glue code |

**Inference approach:** Planner infers applicability from task description without requiring explicit tags.

Examples:
- "Fix the email validation bug" → TDD applies (bug fix)
- "Add user authentication" → TDD applies (new feature)
- "Rename getCwd to getCurrentWorkingDirectory" → TDD skips (refactor)
- "Add Stripe webhook handler" → TDD skips (integration)
- "Update README" → TDD skips (documentation)

**Current implementation already does this** via the `expect(fn(input)).toBe(output)` heuristic in `gsd-planner.md`. No change needed for the heuristic itself.

### Default Value When Config Not Set (Claude's Discretion)

User decided config default is Claude's discretion. Recommendation:

**Default: `"default"`** (apply heuristic)

Rationale:
- Backward compatible (existing projects work unchanged)
- Heuristic catches obvious TDD candidates
- Users who want strict TDD can set `"always"`
- Users who want no TDD can set `"never"`

This is already implemented correctly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TDD cycle definition | Custom cycle | tdd.md reference | Already defined, consistent |
| Plan type detection | Custom parsing | Frontmatter `type: tdd` | Standard in planner/executor |
| Commit pattern | Custom format | test/feat/refactor | Matches git-integration.md |
| Checkpoint UI | Custom format | GSD checkpoint conventions | Consistency with other checkpoints |
| Test detection | Complex static analysis | Simple file/config checks | Good enough, less fragile |

## Common Pitfalls

### Pitfall 1: Over-complicated Test Detection

**What goes wrong:** Trying to parse AST or analyze code to detect tests
**Why it happens:** Desire for precision
**How to avoid:** Simple heuristics are good enough:
- Check package.json scripts/devDeps
- Look for test file patterns (*.test.*, *.spec.*)
- Check for test directories
**Warning signs:** Detection logic exceeds 20 lines

### Pitfall 2: Checkpoint Blocks TDD Permanently

**What goes wrong:** User says "skip" once, TDD is disabled forever
**Why it happens:** Storing decision in config without user awareness
**How to avoid:** Make "skip" apply to current plan only, not globally
**Warning signs:** User can't use TDD later without config change

### Pitfall 3: Incorrect Heuristic Application

**What goes wrong:** Bug fixes planned as standard tasks; refactors planned as TDD
**Why it happens:** Heuristic not aligned with user's task-type classification
**How to avoid:** Ensure planner applies task-type logic (bug fix → TDD, refactor → skip)
**Warning signs:** TDD plans created for config/integration tasks

### Pitfall 4: Silent Setup Still Happens

**What goes wrong:** After implementing checkpoint, silent setup code path still triggers
**Why it happens:** Multiple code paths in execute-plan.md
**How to avoid:** Remove or guard ALL silent setup code behind checkpoint response
**Warning signs:** Tests installed without user seeing checkpoint

## Code Examples

### Test Infrastructure Detection (Node.js)

```bash
# Detection script for executor
detect_test_infrastructure() {
  local HAS_TESTS=false
  
  if [ -f package.json ]; then
    # Check for meaningful test script
    local test_script=$(jq -r '.scripts.test // ""' package.json 2>/dev/null)
    if [[ -n "$test_script" && "$test_script" != *"no test specified"* && "$test_script" != "exit 1" ]]; then
      HAS_TESTS=true
    fi
    
    # Check for test framework dependencies
    if jq -e '.devDependencies | keys | any(test("jest|vitest|mocha|ava|tap"))' package.json >/dev/null 2>&1; then
      HAS_TESTS=true
    fi
  fi
  
  # Check for test files
  if compgen -G "**/*.test.{js,ts}" >/dev/null 2>&1 || compgen -G "**/*.spec.{js,ts}" >/dev/null 2>&1; then
    HAS_TESTS=true
  fi
  
  # Check for test directories
  if [ -d "__tests__" ] || [ -d "tests" ] || [ -d "test" ]; then
    HAS_TESTS=true
  fi
  
  echo "$HAS_TESTS"
}
```

### Modified TDD Execution Flow

```markdown
<step name="tdd_infrastructure_check">
**Before RED phase, check for test infrastructure:**

1. Detect project type (package.json → Node, requirements.txt → Python, etc.)
2. Run detection logic for that project type
3. If HAS_TESTS=true: Proceed to RED phase normally
4. If HAS_TESTS=false: Present checkpoint

**Checkpoint prompt:**
[See format above]

**On user response:**
- "setup" → Install framework, create config, then proceed to RED
- "skip" → Convert plan to standard execution (ignore type:tdd, execute tasks as auto)
</step>
```

### Framework Setup by Project Type

| Project | Framework | Install Command | Config File |
|---------|-----------|-----------------|-------------|
| Node.js | Jest | `npm install -D jest @types/jest` | `jest.config.js` |
| Node.js (Vite) | Vitest | `npm install -D vitest` | `vitest.config.ts` |
| Node.js (TS) | Jest + ts-jest | `npm install -D jest @types/jest ts-jest` | `jest.config.js` with ts-jest preset |
| Python | pytest | `pip install pytest` | `pytest.ini` or `pyproject.toml` |
| Go | testing | Built-in | None needed |
| Rust | cargo test | Built-in | None needed |

## State of the Art

| Before | After | Impact |
|--------|-------|--------|
| Silent test setup | Checkpoint asks user | Respects user decision, no surprise changes |
| Planner-only heuristic | Executor also checks | Runtime state awareness |
| Task-agnostic TDD | Task-type based | Bug fixes = TDD, refactors = skip |

## Implementation Plan

### Files to Modify

1. **`get-shit-done/workflows/execute-plan.md`**
   - Add `tdd_infrastructure_check` step before `tdd_plan_execution`
   - Add checkpoint format for missing infrastructure
   - Add handling for "setup" and "skip" responses

2. **`agents/gsd-executor.md`**
   - Add corresponding check in `<tdd_execution>` section
   - Document checkpoint behavior

3. **`get-shit-done/references/tdd.md`**
   - Update "Test Framework Setup" section to reference checkpoint
   - Change from "automatically install" to "checkpoint first"

### Files That Need NO Changes

- `.planning/config.json` — Already has `tdd_preference`
- `agents/gsd-planner.md` — Heuristic and preference handling complete
- `commands/gsd/plan-phase.md` — Already passes preference to planner

## Open Questions

1. **Per-plan or global skip?** Recommendation: Per-plan. User might skip for one feature but want TDD for next.

2. **What if user has tests but framework config is broken?** Recommendation: Simple detection (presence of files/deps) is enough. If tests exist but don't run, that's a different problem.

3. **Should checkpoint appear for non-TDD plans?** No. Only `type: tdd` plans trigger this check.

## Sources

### Primary (HIGH confidence)
- `get-shit-done/references/tdd.md` — TDD structure, cycle, commits
- `get-shit-done/workflows/execute-plan.md` — tdd_plan_execution section
- `agents/gsd-planner.md` — TDD detection heuristic, plan format
- `get-shit-done/references/checkpoints.md` — Checkpoint format conventions

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — TDD-01, TDD-02, TDD-03
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `.planning/phases/02-tdd-workflow/02-CONTEXT.md` — User decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — internal docs, no external deps
- Architecture (detection): MEDIUM — heuristics may need tuning
- Architecture (checkpoint): HIGH — follows GSD patterns
- Pitfalls: MEDIUM — inferred from expected failure modes

**Research date:** 2025-02-04
**Valid until:** 30 days (stable workflow docs)
**Replaces:** 02-RESEARCH.md from 2025-02-03 (added test infrastructure checkpoint requirement)
