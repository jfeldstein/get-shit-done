# Testing Patterns

**Analysis Date:** 2025-02-03

## Test Framework

**Runner:**
- Not detected

**Assertion Library:**
- Not detected

**Run Commands:**
```bash
# No test script in package.json
npm test   # Not defined
```

## Test File Organization

**Location:**
- No test files found
- No `tests/`, `__tests__/`, or `*.test.js` / `*.spec.js`

**Naming:**
- N/A

**Structure:**
- N/A

## Test Structure

**Suite Organization:**
- N/A

**Patterns:**
- N/A

## Mocking

**Framework:**
- Not used

**Patterns:**
- N/A

**What to Mock:**
- If tests added: `fs`, `path`, `child_process`, `process.env`, `process.stdin`/`stdout`

**What NOT to Mock:**
- Pure path/string helpers

## Fixtures and Factories

**Test Data:**
- N/A

**Location:**
- N/A

## Coverage

**Requirements:**
- None

**Configuration:**
- None

**View Coverage:**
- N/A

## Test Types

**Unit Tests:**
- Not present
- Candidates: `expandTilde`, `getGlobalDir`, `parseConfigDirArg`, `convertToolName`, `processAttribution`

**Integration Tests:**
- Not present
- Candidates: Install flow (copy, path replacement, settings write)

**E2E Tests:**
- Not present
- Manual: `npx get-shit-done-cc --help`, `npx get-shit-done-cc --claude --global`

## Common Patterns

**Async Testing:**
- N/A

**Error Testing:**
- N/A

**Snapshot Testing:**
- Not used

---

*Testing analysis: 2025-02-03*
