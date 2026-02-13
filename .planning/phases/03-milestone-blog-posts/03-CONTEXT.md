# Phase 3 Context: Milestone Blog Posts

**Created:** 2026-02-05
**Phase Goal:** Automatically generate 2 technical blog posts per completed milestone

## Decisions (Locked)

### Content Sources

**For architecture/project posts:**
- SUMMARY.md files (what was built, how)
- CONTEXT.md (decisions made, trade-offs)
- VERIFICATION.md (gaps found, what broke)
- UAT.md (user testing results)
- Git diffs (actual code changes)
- REQUIREMENTS.md (original intent vs outcome)
- Session logs from ~/ (Claude/Cursor conversation logs)

**For agentic practices posts:**
- Subagent task prompts and outputs
- Iteration counts (planner-checker loops, revision attempts)
- Failures and recoveries
- Timing data (how long phases/plans took)
- Worktree orchestration patterns (branch flows, merge strategies)
- Prompt/template evolution (how instructions were refined)

### Output Format

- **Location:** `docs/blog/` in project repo (gitignored)
- **Filename:** Plain title slug (e.g., `worktree-integration.md`)
- **Length:** Adaptive — matches complexity of learnings
- **Code snippets:** Include with importance annotations (signal vs noise)
- **Human retrieves drafts manually for external publishing**

### Automation Behavior

- **Trigger:** Automatically when `/gsd:complete-milestone` runs
- **Failure handling:** Retry, then warn user. Don't block milestone completion
- **Regeneration:** None — each milestone's posts are one-time

## Claude's Discretion

- **Session log discovery:** Find appropriate log paths (~/.claude/, Cursor logs, etc.)
- **Voice & audience:** Technical depth, tone, target reader
- **Post structure:** Section organization, narrative flow
- **Code selection:** Which snippets are "important" vs "noise"

## Deferred Ideas

- Direct publishing to CMS/blog platforms
- PR-based review workflow
- Auto-regeneration when post templates improve
- Model usage analysis in agentic practices posts

---
*Context captured via /gsd:discuss-phase 3*
