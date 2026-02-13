# Phase 3: Milestone Blog Posts - Research

**Researched:** 2026-02-05
**Domain:** Automated blog post generation from milestone artifacts
**Confidence:** MEDIUM

## Summary

Phase 3 requires automatically generating two technical blog posts per completed milestone: (1) architecture/project learnings, (2) agentic coding practices learnings. Posts synthesize content from multiple milestone artifacts (summaries, context files, verification reports, UAT results, git diffs, requirements, session logs) and subagent execution data.

The implementation integrates into the existing `/gsd:complete-milestone` workflow as a new step. Blog generation uses Node.js with native file system operations and markdown generation (no external dependencies required). Posts are written to `docs/blog/` (gitignored) for manual retrieval and external publishing.

**Primary recommendation:** Add blog generation step to `complete-milestone.md` workflow after `git_tag` step. Use native Node.js `fs` for file operations, simple retry logic with exponential backoff for failures, and direct markdown generation without HTML conversion.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Content Sources

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

#### Output Format

- **Location:** `docs/blog/` in project repo (gitignored)
- **Filename:** Plain title slug (e.g., `worktree-integration.md`)
- **Length:** Adaptive — matches complexity of learnings
- **Code snippets:** Include with importance annotations (signal vs noise)
- **Human retrieves drafts manually for external publishing**

#### Automation Behavior

- **Trigger:** Automatically when `/gsd:complete-milestone` runs
- **Failure handling:** Retry, then warn user. Don't block milestone completion
- **Regeneration:** None — each milestone's posts are one-time

### Claude's Discretion

- **Session log discovery:** Find appropriate log paths (~/.claude/, Cursor logs, etc.)
- **Voice & audience:** Technical depth, tone, target reader
- **Post structure:** Section organization, narrative flow
- **Code selection:** Which snippets are "important" vs "noise"

### Deferred Ideas (OUT OF SCOPE)

- Direct publishing to CMS/blog platforms
- PR-based review workflow
- Auto-regeneration when post templates improve
- Model usage analysis in agentic practices posts
</user_constraints>

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | Built-in | File system operations (read/write markdown) | Native, no dependencies |
| Node.js path | Built-in | Path manipulation for file discovery | Native, no dependencies |
| Git commands | System | Extract diffs, commit ranges, file changes | Already used in workflow |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gray-matter | (optional) | Parse YAML frontmatter from markdown files | If frontmatter parsing needed |
| markdown-it | (optional) | Markdown parsing/transformation | If markdown manipulation needed beyond string concatenation |

**Note:** Current codebase has zero dependencies (`package.json` shows empty `dependencies`). Prefer native Node.js operations. Only add libraries if markdown parsing/manipulation becomes complex.

**Installation:**
```bash
# No installation needed - using Node.js built-ins
# Optional: npm install gray-matter markdown-it (only if needed)
```

## Architecture Patterns

### Recommended Project Structure

```
.planning/phases/03-milestone-blog-posts/
├── 03-CONTEXT.md
├── 03-RESEARCH.md
└── [future plans]

get-shit-done/
├── workflows/
│   └── complete-milestone.md  # Add blog generation step here
└── templates/
    └── blog-post-architecture.md  # Template for architecture posts
    └── blog-post-agentic.md     # Template for agentic practices posts

docs/
└── blog/                        # Created at runtime, gitignored
    ├── v1.0-worktree-integration.md
    └── v1.0-agentic-practices.md
```

### Pattern 1: Workflow Integration

**What:** Add blog generation as a step in `complete-milestone.md` workflow

**When to use:** After `git_tag` step, before `git_commit_milestone` (or after `offer_next` if non-blocking)

**Example:**
```markdown
<step name="generate_blog_posts">
Generate two blog posts for this milestone.

**Check if blog generation enabled:**
```bash
BLOG_GENERATION=$(cat .planning/config.json 2>/dev/null | grep -o '"blog_generation"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
```

**If disabled:** Skip silently

**If enabled:**
1. Gather milestone artifacts
2. Generate architecture post
3. Generate agentic practices post
4. Write to docs/blog/
5. Handle failures with retry, then warn
</step>
```

### Pattern 2: Artifact Collection

**What:** Collect all milestone artifacts before generation

**When to use:** First step of blog generation

**Example:**
```bash
# Collect phase artifacts
for phase_dir in .planning/phases/*/; do
  cat "$phase_dir"/*-SUMMARY.md
  cat "$phase_dir"/*-CONTEXT.md 2>/dev/null
  cat "$phase_dir"/*-VERIFICATION.md 2>/dev/null
  cat "$phase_dir"/*-UAT.md 2>/dev/null
done

# Collect git diff
FIRST_COMMIT=$(git log --oneline --grep="feat(" | tail -1 | cut -d' ' -f1)
LAST_COMMIT=$(git log --oneline --grep="feat(" | head -1 | cut -d' ' -f1)
git diff ${FIRST_COMMIT}..${LAST_COMMIT}

# Collect requirements (before deletion)
cat .planning/REQUIREMENTS.md

# Collect subagent data
cat .planning/agent-history.json 2>/dev/null
```

### Pattern 3: Retry with Exponential Backoff

**What:** Retry blog generation on failure, then warn user

**When to use:** Wrap blog generation in retry logic

**Example:**
```bash
MAX_RETRIES=3
RETRY_DELAY=2  # seconds

generate_blog_posts() {
  # Blog generation logic here
  return $?
}

attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
  if generate_blog_posts; then
    echo "✓ Blog posts generated"
    exit 0
  fi
  
  if [ $attempt -lt $MAX_RETRIES ]; then
    delay=$((RETRY_DELAY * (2 ** (attempt - 1))))
    echo "⚠ Blog generation failed, retrying in ${delay}s (attempt $attempt/$MAX_RETRIES)..."
    sleep $delay
  fi
  
  attempt=$((attempt + 1))
done

echo "⚠ Blog generation failed after $MAX_RETRIES attempts. Milestone completion continues."
```

### Anti-Patterns to Avoid

- **Don't block milestone completion:** Blog generation failures must not prevent milestone archiving
- **Don't regenerate existing posts:** Check if posts already exist for milestone, skip if present
- **Don't parse complex markdown:** Use simple string operations for markdown generation unless parsing needed
- **Don't add dependencies unnecessarily:** Prefer native Node.js over npm packages

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown file writing | Custom file writer | `fs.writeFileSync()` | Native Node.js is sufficient |
| Path manipulation | String concatenation | `path.join()` | Handles cross-platform paths |
| Retry logic | Custom retry | Simple bash loop with exponential backoff | No need for retry library for 3 attempts |
| Markdown parsing | Custom parser | String operations or gray-matter (if needed) | Most markdown is just text concatenation |

**Key insight:** Blog post generation is primarily text concatenation with markdown formatting. No complex parsing or transformation needed unless extracting structured data from artifacts.

## Common Pitfalls

### Pitfall 1: Session Log Discovery

**What goes wrong:** Cannot find Claude/Cursor session logs, missing content for agentic practices post

**Why it happens:** Session log locations vary by IDE and may not be documented

**How to avoid:** 
- Check multiple common locations: `~/.claude/logs/`, `~/Library/Application Support/Cursor/logs/`, project root `logs/`
- Make discovery graceful: if logs not found, generate post with available data
- Document discovered locations in post generation logic

**Warning signs:** Blog generation fails with "session logs not found" error

### Pitfall 2: Git Diff Context Loss

**What goes wrong:** Git diff too large or missing context, making code snippets meaningless

**Why it happens:** Milestone spans many commits, diff is massive

**How to avoid:**
- Use `git diff --stat` for overview, `git diff` for specific files
- Filter diffs by file type or importance (e.g., exclude test files if needed)
- Include commit messages for context: `git log --oneline ${FIRST_COMMIT}..${LAST_COMMIT}`

**Warning signs:** Blog post includes massive unreadable diffs

### Pitfall 3: Subagent Data Missing

**What goes wrong:** Cannot extract subagent prompts/outputs, agentic practices post incomplete

**Why it happens:** `agent-history.json` may not exist or may not contain full prompt/output data

**How to avoid:**
- Check for `agent-history.json` existence before reading
- Extract what's available: agent IDs, timestamps, task descriptions
- Use phase SUMMARY.md files as fallback for subagent work descriptions
- Document missing data gracefully in post

**Warning signs:** Agentic practices post lacks iteration counts or failure/recovery data

### Pitfall 4: Blocking Milestone Completion

**What goes wrong:** Blog generation failure prevents milestone from completing

**Why it happens:** Error handling doesn't catch failures, workflow stops

**How to avoid:**
- Wrap blog generation in try/catch or bash error handling (`set +e`)
- Always continue to next workflow step after blog generation (success or failure)
- Log warnings but don't exit with error code

**Warning signs:** `/gsd:complete-milestone` stops at blog generation step

## Code Examples

Verified patterns from codebase:

### Example 1: Reading Phase Artifacts

```bash
# From complete-milestone.md workflow
for phase_dir in .planning/phases/*/; do
  cat "$phase_dir"/*-SUMMARY.md
done
```

**Source:** `get-shit-done/workflows/complete-milestone.md` lines 157-163

### Example 2: Git Diff Extraction

```bash
# From complete-milestone.md workflow
FIRST_COMMIT=$(git log --oneline --grep="feat(" | tail -1 | cut -d' ' -f1)
LAST_COMMIT=$(git log --oneline --grep="feat(" | head -1 | cut -d' ' -f1)
git diff --stat ${FIRST_COMMIT}..${LAST_COMMIT} | tail -1
```

**Source:** `get-shit-done/workflows/complete-milestone.md` lines 127-130

### Example 3: Config Value Extraction

```bash
# Pattern used throughout codebase
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
```

**Source:** Multiple files (execute-plan.md, complete-milestone.md, etc.)

### Example 4: Directory Creation with Gitignore Check

```bash
# Create docs/blog/ directory
mkdir -p docs/blog/

# Add to .gitignore if not present
if ! grep -q "^docs/blog/" .gitignore 2>/dev/null; then
  echo "docs/blog/" >> .gitignore
fi
```

**Pattern:** Create directory, ensure gitignored

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual blog writing | Automated generation from artifacts | Phase 3 (new) | Reduces manual effort, ensures consistency |
| No milestone documentation | Archive + blog posts | Phase 3 (new) | Better knowledge capture and sharing |

**Deprecated/outdated:**
- None (this is a new feature)

## Open Questions

Things that couldn't be fully resolved:

1. **Session Log Format and Location**
   - What we know: Claude Code stores logs in `logs/` directory as JSON files (`session-{id}.json`). Cursor IDE may use different location.
   - What's unclear: Exact Cursor log location, log format/structure, how to correlate logs to milestone timeframes
   - Recommendation: Implement discovery logic that checks multiple locations, handles missing logs gracefully, documents discovered locations

2. **Subagent Prompt/Output Extraction**
   - What we know: `agent-history.json` exists in `.planning/` and stores agent spawn/completion records. Subagent prompts are in template files.
   - What's unclear: Whether `agent-history.json` contains full prompts/outputs or just metadata. How to extract actual subagent conversation content.
   - Recommendation: Start with `agent-history.json` metadata (agent IDs, timestamps, task descriptions). If full prompts/outputs needed, investigate session log correlation or add logging to executor workflow.

3. **Blog Post Length and Structure**
   - What we know: Posts should be "adaptive — matches complexity of learnings" with "importance annotations" for code snippets.
   - What's unclear: Specific section structure, target word count, how to determine "important" vs "noise" code snippets.
   - Recommendation: Create templates with flexible sections. Use heuristics for code importance (e.g., files mentioned in SUMMARY.md, changes in VERIFICATION.md gaps). Let planner/user refine structure.

4. **Retry Strategy Details**
   - What we know: Retry on failure, then warn user. Don't block milestone completion.
   - What's unclear: How many retries, delay between retries, what constitutes a "failure" (network error, parsing error, generation error?).
   - Recommendation: 3 retries with exponential backoff (2s, 4s, 8s). Retry on any error. After 3 failures, log warning and continue workflow.

## Sources

### Primary (HIGH confidence)

- `get-shit-done/workflows/complete-milestone.md` - Workflow structure and integration points
- `get-shit-done/workflows/execute-plan.md` - Git diff extraction patterns, artifact reading patterns
- `.planning/phases/03-milestone-blog-posts/03-CONTEXT.md` - User decisions and constraints
- `.planning/REQUIREMENTS.md` - Requirements BLOG-01, BLOG-02, BLOG-03

### Secondary (MEDIUM confidence)

- Web search: "Node.js markdown blog post generation from multiple sources 2025" - Markdown generation patterns, gray-matter/markdown-it libraries
- Web search: "programmatic blog post generation LLM content synthesis 2025" - Content synthesis approaches, structured content patterns
- Web search: "Claude Code Cursor IDE session logs conversation history location 2025" - Session log locations (Claude Code: `logs/` directory, Cursor: unknown)
- Web search: "Node.js retry pattern with exponential backoff warn user 2025" - Retry patterns, exponential backoff implementation

### Tertiary (LOW confidence)

- Web search results for session log locations (may be outdated or IDE-specific)
- Assumptions about subagent data availability in `agent-history.json` (needs verification)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Native Node.js is clear, optional libraries identified but not verified for necessity
- Architecture: HIGH - Workflow integration pattern is clear from existing codebase patterns
- Pitfalls: MEDIUM - Common issues identified but session log discovery and subagent data extraction need verification
- Code examples: HIGH - Patterns verified from existing codebase

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable domain, but session log discovery may need refinement)
