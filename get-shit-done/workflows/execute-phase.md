<purpose>
Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean by delegating plan execution to subagents.
</purpose>

<core_principle>
The orchestrator's job is coordination, not execution. Each subagent loads the full execute-plan context itself. Orchestrator discovers plans, analyzes dependencies, groups into waves, spawns agents, handles checkpoints, collects results.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
Read config.json for planning behavior settings.
</required_reading>

<process>

<step name="resolve_model_profile" priority="first">
Read model profile for agent spawning:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| gsd-executor | opus | sonnet | sonnet |
| gsd-verifier | sonnet | sonnet | haiku |
| general-purpose | — | — | — |

Store resolved models for use in Task calls below.
</step>

<step name="load_project_state">
Before any operation, read project state:

```bash
cat .planning/STATE.md 2>/dev/null
```

**If file exists:** Parse and internalize:
- Current position (phase, plan, status)
- Accumulated decisions (constraints on this execution)
- Blockers/concerns (things to watch for)

**If file missing but .planning/ exists:**
```
STATE.md missing but planning artifacts exist.
Options:
1. Reconstruct from existing artifacts
2. Continue without project state (may lose accumulated context)
```

**If .planning/ doesn't exist:** Error - project not initialized.

**Load planning config:**

```bash
# Check if planning docs should be committed (default: true)
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
# Auto-detect gitignored (overrides config)
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

Store `COMMIT_PLANNING_DOCS` for use in git operations.

**Load parallelization config:**

```bash
# Check if parallelization is enabled (default: true)
PARALLELIZATION=$(cat .planning/config.json 2>/dev/null | grep -o '"parallelization"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
```

Store `PARALLELIZATION` for use in wave execution step. When `false`, plans within a wave execute sequentially instead of in parallel.

**Load git branching config:**

```bash
# Get branching strategy (default: none)
BRANCHING_STRATEGY=$(cat .planning/config.json 2>/dev/null | grep -o '"branching_strategy"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "none")

# Get base branch (default: develop)
BASE_BRANCH=$(cat .planning/config.json 2>/dev/null | grep -o '"base_branch"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "develop")

# Get templates
PHASE_BRANCH_TEMPLATE=$(cat .planning/config.json 2>/dev/null | grep -o '"phase_branch_template"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "gsd/phase-{phase}-{slug}")
MILESTONE_BRANCH_TEMPLATE=$(cat .planning/config.json 2>/dev/null | grep -o '"milestone_branch_template"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "gsd/{milestone}-{slug}")
```

Store `BRANCHING_STRATEGY`, `BASE_BRANCH`, and templates for use in branch creation step.
</step>

<step name="handle_branching">
Create or switch to appropriate branch based on branching strategy.

**Skip if strategy is "none":**

```bash
if [ "$BRANCHING_STRATEGY" = "none" ]; then
  # No branching, continue on current branch
  exit 0
fi
```

**For "phase" strategy — create or switch to phase branch:**

```bash
if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  # Get phase name from directory (e.g., "03-authentication" → "authentication")
  PHASE_NAME=$(basename "$PHASE_DIR" | sed 's/^[0-9]*\.*[0-9]*-//')

  # Create slug from phase name
  PHASE_SLUG=$(echo "$PHASE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

  # Apply template
  BRANCH_NAME=$(echo "$PHASE_BRANCH_TEMPLATE" | sed "s/{phase}/$PADDED_PHASE/g" | sed "s/{slug}/$PHASE_SLUG/g")

  # Create or switch to branch (branch off base_branch if creating)
  if git rev-parse --verify "$BRANCH_NAME" 2>/dev/null; then
    git checkout "$BRANCH_NAME"
  else
    git fetch origin "$BASE_BRANCH" 2>/dev/null
    git checkout -b "$BRANCH_NAME" "origin/$BASE_BRANCH" 2>/dev/null || git checkout -b "$BRANCH_NAME" "$BASE_BRANCH" 2>/dev/null
  fi

  echo "Branch: $BRANCH_NAME (from $BASE_BRANCH)"
fi
```

**For "milestone" strategy — create or switch to milestone branch:**

```bash
if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  # Get current milestone info from ROADMAP.md
  MILESTONE_VERSION=$(grep -oE 'v[0-9]+\.[0-9]+' .planning/ROADMAP.md | head -1 || echo "v1.0")
  MILESTONE_NAME=$(grep -A1 "## .*$MILESTONE_VERSION" .planning/ROADMAP.md | tail -1 | sed 's/.*- //' | cut -d'(' -f1 | tr -d ' ' || echo "milestone")

  # Create slug
  MILESTONE_SLUG=$(echo "$MILESTONE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

  # Apply template
  BRANCH_NAME=$(echo "$MILESTONE_BRANCH_TEMPLATE" | sed "s/{milestone}/$MILESTONE_VERSION/g" | sed "s/{slug}/$MILESTONE_SLUG/g")

  # Create or switch to branch (branch off base_branch if creating)
  if git rev-parse --verify "$BRANCH_NAME" 2>/dev/null; then
    git checkout "$BRANCH_NAME"
  else
    git fetch origin "$BASE_BRANCH" 2>/dev/null
    git checkout -b "$BRANCH_NAME" "origin/$BASE_BRANCH" 2>/dev/null || git checkout -b "$BRANCH_NAME" "$BASE_BRANCH" 2>/dev/null
  fi

  echo "Branch: $BRANCH_NAME (from $BASE_BRANCH)"
fi
```

**Report branch status:**

```
Branching: {strategy} → {branch_name}
```

**Note:** All phase workflows (discuss, plan, execute, verify) use this same branch. Agent worktrees merge into it. When validated, use `gh pr create` to open PR to `base_branch` (see complete-milestone).
</step>

<step name="validate_phase">
Confirm phase exists and has plans. Search recursively to find plans in repo root OR worktrees.

```bash
# Match both zero-padded (05-*) and unpadded (5-*) folders
PADDED_PHASE=$(printf "%02d" ${PHASE_ARG} 2>/dev/null || echo "${PHASE_ARG}")

# Search for phase directory in repo root first, then worktrees
PHASE_DIR=$(find . -path "./wt/*/.*" -prune -o -type d -name "${PADDED_PHASE}-*" -path "*/.planning/phases/*" -print 2>/dev/null | head -1)
if [ -z "$PHASE_DIR" ]; then
  PHASE_DIR=$(find . -path "./wt/*/.*" -prune -o -type d -name "${PHASE_ARG}-*" -path "*/.planning/phases/*" -print 2>/dev/null | head -1)
fi

# Also check worktrees explicitly (find may not traverse them)
if [ -z "$PHASE_DIR" ]; then
  for wt in wt/*/; do
    PHASE_DIR=$(ls -d "${wt}.planning/phases/${PADDED_PHASE}-"* "${wt}.planning/phases/${PHASE_ARG}-"* 2>/dev/null | head -1)
    [ -n "$PHASE_DIR" ] && break
  done
fi

if [ -z "$PHASE_DIR" ]; then
  echo "ERROR: No phase directory matching '${PHASE_ARG}' in repo root or worktrees"
  exit 1
fi

# Count plans (search recursively in case of nested structure)
PLAN_COUNT=$(find "$PHASE_DIR" -maxdepth 1 -name "*-PLAN.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$PLAN_COUNT" -eq 0 ]; then
  echo "ERROR: No plans found in $PHASE_DIR"
  exit 1
fi

echo "Found $PLAN_COUNT plans in $PHASE_DIR"
```

Report: "Found {N} plans in {phase_dir}"

**Note:** PHASE_DIR may be in repo root (`.planning/phases/XX-name/`) or in a worktree (`wt/phase-XX/.planning/phases/XX-name/`). Subsequent steps use PHASE_DIR as the canonical location.
</step>

<step name="discover_plans">
List all plans and extract metadata:

```bash
# Get all plans (PHASE_DIR already resolved to correct location)
find "$PHASE_DIR" -maxdepth 1 -name "*-PLAN.md" 2>/dev/null | sort

# Get completed plans (have SUMMARY.md)
find "$PHASE_DIR" -maxdepth 1 -name "*-SUMMARY.md" 2>/dev/null | sort
```

For each plan, read frontmatter to extract:
- `wave: N` - Execution wave (pre-computed)
- `autonomous: true/false` - Whether plan has checkpoints
- `gap_closure: true/false` - Whether plan closes gaps from verification/UAT

Build plan inventory:
- Plan path
- Plan ID (e.g., "03-01")
- Wave number
- Autonomous flag
- Gap closure flag
- Completion status (SUMMARY exists = complete)

**Filtering:**
- Skip completed plans (have SUMMARY.md)
- If `--gaps-only` flag: also skip plans where `gap_closure` is not `true`

If all plans filtered out, report "No matching incomplete plans" and exit.
</step>

<step name="group_by_wave">
Read `wave` from each plan's frontmatter and group by wave number:

```bash
# For each plan, extract wave from frontmatter
for plan in $PHASE_DIR/*-PLAN.md; do
  wave=$(grep "^wave:" "$plan" | cut -d: -f2 | tr -d ' ')
  autonomous=$(grep "^autonomous:" "$plan" | cut -d: -f2 | tr -d ' ')
  echo "$plan:$wave:$autonomous"
done
```

**Group plans:**
```
waves = {
  1: [plan-01, plan-02],
  2: [plan-03, plan-04],
  3: [plan-05]
}
```

**No dependency analysis needed.** Wave numbers are pre-computed during `/gsd:plan-phase`.

Report wave structure with context:
```
## Execution Plan

**Phase {X}: {Name}** — {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01-01, 01-02 | {from plan objectives} |
| 2 | 01-03 | {from plan objectives} |
| 3 | 01-04 [checkpoint] | {from plan objectives} |

```

The "What it builds" column comes from skimming plan names/objectives. Keep it brief (3-8 words).
</step>

<step name="worktree_setup">
Before spawning executors for each wave, create worktrees and agent branches.

**Sanitization function** (orchestrator uses this for branch names):

```bash
sanitize_branch_name() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | head -c 50
}
```

**Setup sequence (run before spawning each wave):**

```bash
# Ensure wt/ exists
mkdir -p wt

# For each plan in the wave, before spawning:
# 1. Generate 4-char agent ID (e.g., a1b2)
AGENT_ID=$(head -c 4 /dev/urandom | xxd -p | tr -d '\n')

# 2. Sanitize plan slug from plan filename (e.g., 01-01-PLAN.md → 01-01)
PLAN_SLUG=$(basename "$PLAN_PATH" | sed 's/-PLAN\.md$//')

# 3. Sanitize phase name for feature branch (e.g., 01-worktree-integration → worktree-integration)
PHASE_SLUG=$(echo "$(basename "$PHASE_DIR" | sed 's/^[0-9]*-//')" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | head -c 50)

# 4. Create branch name: feature--{phase-slug}--agents--agent-{id}--{plan-slug}
AGENT_BRANCH="feature--${PHASE_SLUG}--agents--agent-${AGENT_ID}--${PLAN_SLUG}"

# 5. Create worktree
git worktree add -b "$AGENT_BRANCH" "wt/agent-${AGENT_ID}"

# 6. Store mapping: plan_id → worktree_path, agent_branch for use in spawn and post-spawn
# worktree_path = wt/agent-{AGENT_ID} (or absolute path)
# agent_branch = $AGENT_BRANCH
```

**Output:** For each plan in wave, orchestrator has: `worktree_path`, `agent_branch`, `plan_id`.
</step>

<step name="execute_waves">
Execute each wave in sequence. Autonomous plans within a wave run in parallel **only if `PARALLELIZATION=true`**.

**If `PARALLELIZATION=false`:** Execute plans within each wave sequentially (one at a time). This prevents side effects from concurrent operations like tests, linting, and code generation.

**For each wave:**

1. **Worktree setup (run worktree_setup step):** Create worktree and agent branch for each plan in this wave. Store mapping.

2. **Describe what's being built (BEFORE spawning):**

   Read each plan's `<objective>` section. Extract what's being built and why it matters.

   **Output:**
   ```
   ---

   ## Wave {N}

   **{Plan ID}: {Plan Name}**
   {2-3 sentences: what this builds, key technical approach, why it matters in context}

   **{Plan ID}: {Plan Name}** (if parallel)
   {same format}

   Spawning {count} agent(s)...

   ---
   ```

   **Examples:**
   - Bad: "Executing terrain generation plan"
   - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."

2. **Read files and spawn agents:**

   Before spawning, read file contents. The `@` syntax does not work across Task() boundaries - content must be inlined.

   ```bash
   # Read each plan in the wave
   PLAN_CONTENT=$(cat "{plan_path}")
   STATE_CONTENT=$(cat .planning/STATE.md)
   CONFIG_CONTENT=$(cat .planning/config.json 2>/dev/null)
   ```

   **If `PARALLELIZATION=true` (default):** Use Task tool with multiple parallel calls.
   
   **If `PARALLELIZATION=false`:** Spawn agents one at a time, waiting for each to complete before starting the next. This ensures no concurrent file modifications or build operations.

   Each agent gets prompt with inlined content. **Orchestrator must substitute `{worktree_path}` with the actual path** (e.g., `wt/agent-a1b2` or absolute path) for each plan's spawn.

   ```
   <worktree_context>
   Your working directory is: {worktree_path}
   All file operations, git commands, and edits MUST be in this directory.
   NEVER modify files outside this worktree. Repo root is READ ONLY.
   </worktree_context>

   <objective>
   Execute plan {plan_number} of phase {phase_number}-{phase_name}.

   Commit each task atomically. Create SUMMARY.md. Update STATE.md.
   Executor runs all commands from worktree directory (cd to worktree before executing).
   </objective>

   <execution_context>
   @~/.claude/get-shit-done/workflows/execute-plan.md
   @~/.claude/get-shit-done/templates/summary.md
   @~/.claude/get-shit-done/references/checkpoints.md
   @~/.claude/get-shit-done/references/tdd.md
   </execution_context>

   <context>
   Plan:
   {plan_content}

   Project state:
   {state_content}

   Config (if exists):
   {config_content}
   </context>

   <success_criteria>
   - [ ] All tasks executed
   - [ ] Each task committed individually
   - [ ] SUMMARY.md created in plan directory
   - [ ] STATE.md updated with position and decisions
   - [ ] Executor runs all commands from worktree directory (cd to worktree before executing)
   </success_criteria>
   ```

2. **Wait for all agents in wave to complete:**

   Task tool blocks until each agent finishes. All parallel agents return together.

3. **Merge and cleanup (for each completed plan in wave):**

   For each completed plan (using stored mapping from worktree_setup):

   ```bash
   # Merge agent branch into base branch
   git merge --no-ff "$AGENT_BRANCH" -m "Merge $AGENT_BRANCH: {plan_name}"
   ```

   **If merge conflict:**
   - Orchestrator resolves conflicts (user decision: not subagent rebase)
   - Document: "Orchestrator resolves conflicts manually, stages resolved files, completes merge"
   - Retry/abort guidance: If resolution fails, ask user to resolve or abort merge

   ```bash
   # After merge succeeds: delete agent branch
   git branch -d "$AGENT_BRANCH"

   # Remove worktree
   git worktree remove "wt/agent-${AGENT_ID}"
   # Or --force if uncommitted changes remain: git worktree remove --force "wt/agent-${AGENT_ID}"
   ```

   **Order:** Merge all agent branches from wave, then remove worktrees. Base branch = current branch (or phase branch if branching strategy active).

   **Test execution:** Check config `test_after_merge`. If true, after each merge run test suite (e.g. `npm test` or project default); fail if exit non-zero. If false or unset, skip (backward compatible with CONTEXT.md "skip tests" decision).

4. **Report completion and what was built:**

   For each completed agent:
   - Verify SUMMARY.md exists at expected path
   - Read SUMMARY.md to extract what was built
   - Note any issues or deviations

   **Output:**
   ```
   ---

   ## Wave {N} Complete

   **{Plan ID}: {Plan Name}**
   {What was built — from SUMMARY.md deliverables}
   {Notable deviations or discoveries, if any}

   **{Plan ID}: {Plan Name}** (if parallel)
   {same format}

   {If more waves: brief note on what this enables for next wave}

   ---
   ```

   **Examples:**
   - Bad: "Wave 2 complete. Proceeding to Wave 3."
   - Good: "Terrain system complete — 3 biome types, height-based texturing, physics collision meshes. Vehicle physics (Wave 3) can now reference ground surfaces."

5. **Handle failures:**

   If any agent in wave fails:
   - Report which plan failed and why
   - Ask user: "Continue with remaining waves?" or "Stop execution?"
   - If continue: proceed to next wave (dependent plans may also fail)
   - If stop: exit with partial completion report

6. **Execute checkpoint plans between waves:**

   See `<checkpoint_handling>` for details.

7. **Proceed to next wave**

</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction.

**Detection:** Check `autonomous` field in frontmatter.

**Execution flow for checkpoint plans:**

1. **Spawn agent for checkpoint plan:**
   ```
   Task(prompt="{subagent-task-prompt}", subagent_type="gsd-executor", model="{executor_model}")
   ```

2. **Agent runs until checkpoint:**
   - Executes auto tasks normally
   - Reaches checkpoint task (e.g., `type="checkpoint:human-verify"`) or auth gate
   - Agent returns with structured checkpoint (see checkpoint-return.md template)

3. **Agent return includes (structured format):**
   - Completed Tasks table with commit hashes and files
   - Current task name and blocker
   - Checkpoint type and details for user
   - What's awaited from user

4. **Orchestrator presents checkpoint to user:**

   Extract and display the "Checkpoint Details" and "Awaiting" sections from agent return:
   ```
   ## Checkpoint: [Type]

   **Plan:** 03-03 Dashboard Layout
   **Progress:** 2/3 tasks complete

   [Checkpoint Details section from agent return]

   [Awaiting section from agent return]
   ```

5. **User responds:**
   - "approved" / "done" → spawn continuation agent
   - Description of issues → spawn continuation agent with feedback
   - Decision selection → spawn continuation agent with choice

6. **Spawn continuation agent (NOT resume):**

   Use the continuation-prompt.md template:
   ```
   Task(
     prompt=filled_continuation_template,
     subagent_type="gsd-executor",
     model="{executor_model}"
   )
   ```

   Fill template with:
   - `{completed_tasks_table}`: From agent's checkpoint return
   - `{resume_task_number}`: Current task from checkpoint
   - `{resume_task_name}`: Current task name from checkpoint
   - `{user_response}`: What user provided
   - `{resume_instructions}`: Based on checkpoint type (see continuation-prompt.md)

7. **Continuation agent executes:**
   - Verifies previous commits exist
   - Continues from resume point
   - May hit another checkpoint (repeat from step 4)
   - Or completes plan

8. **Repeat until plan completes or user stops**

**Why fresh agent instead of resume:**
Resume relies on Claude Code's internal serialization which breaks with parallel tool calls.
Fresh agents with explicit state are more reliable and maintain full context.

**Checkpoint in parallel context:**
If a plan in a parallel wave has a checkpoint:
- Spawn as normal
- Agent pauses at checkpoint and returns with structured state
- Other parallel agents may complete while waiting
- Present checkpoint to user
- Spawn continuation agent with user response
- Wait for all agents to finish before next wave
</step>

<step name="aggregate_results">
After all waves complete, aggregate results:

```markdown
## Phase {X}: {Name} Execution Complete

**Waves executed:** {N}
**Plans completed:** {M} of {total}

### Wave Summary

| Wave | Plans | Status |
|------|-------|--------|
| 1 | plan-01, plan-02 | ✓ Complete |
| CP | plan-03 | ✓ Verified |
| 2 | plan-04 | ✓ Complete |
| 3 | plan-05 | ✓ Complete |

### Plan Details

1. **03-01**: [one-liner from SUMMARY.md]
2. **03-02**: [one-liner from SUMMARY.md]
...

### Issues Encountered
[Aggregate from all SUMMARYs, or "None"]
```
</step>

<step name="verify_phase_goal">
Verify phase achieved its GOAL, not just completed its TASKS.

**Spawn verifier:**

```
Task(
  prompt="Verify phase {phase_number} goal achievement.

Phase directory: {phase_dir}
Phase goal: {goal from ROADMAP.md}

Check must_haves against actual codebase. Create VERIFICATION.md.
Verify what actually exists in the code.",
  subagent_type="gsd-verifier",
  model="{verifier_model}"
)
```

**Read verification status:**

```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

**Route by status:**

| Status | Action |
|--------|--------|
| `passed` | Continue to update_roadmap |
| `human_needed` | Present items to user, get approval or feedback |
| `gaps_found` | Present gap summary, offer `/gsd:plan-phase {phase} --gaps` |

**If passed:**

Phase goal verified. Proceed to update_roadmap.

**If human_needed:**

```markdown
## ✓ Phase {X}: {Name} — Human Verification Required

All automated checks passed. {N} items need human testing:

### Human Verification Checklist

{Extract from VERIFICATION.md human_verification section}

---

**After testing:**
- "approved" → continue to update_roadmap
- Report issues → will route to gap closure planning
```

If user approves → continue to update_roadmap.
If user reports issues → treat as gaps_found.

**If gaps_found:**

Present gaps and offer next command:

```markdown
## ⚠ Phase {X}: {Name} — Gaps Found

**Score:** {N}/{M} must-haves verified
**Report:** {phase_dir}/{phase}-VERIFICATION.md

### What's Missing

{Extract gap summaries from VERIFICATION.md gaps section}

---

## ▶ Next Up

**Plan gap closure** — create additional plans to complete the phase

`/gsd:plan-phase {X} --gaps`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `cat {phase_dir}/{phase}-VERIFICATION.md` — see full report
- `/gsd:verify-work {X}` — manual testing before planning
```

User runs `/gsd:plan-phase {X} --gaps` which:
1. Reads VERIFICATION.md gaps
2. Creates additional plans (04, 05, etc.) with `gap_closure: true` to close gaps
3. User then runs `/gsd:execute-phase {X} --gaps-only`
4. Execute-phase runs only gap closure plans (04-05)
5. Verifier runs again after new plans complete

User stays in control at each decision point.
</step>

<step name="update_roadmap">
Update ROADMAP.md to reflect phase completion:

```bash
# Mark phase complete
# Update completion date
# Update status
```

**Check planning config:**

If `COMMIT_PLANNING_DOCS=false` (set in load_project_state):
- Skip all git operations for .planning/ files
- Planning docs exist locally but are gitignored
- Log: "Skipping planning docs commit (commit_docs: false)"
- Proceed to offer_next step

If `COMMIT_PLANNING_DOCS=true` (default):
- Continue with git operations below

Commit phase completion (roadmap, state, verification):
```bash
git add .planning/ROADMAP.md .planning/STATE.md .planning/phases/{phase_dir}/*-VERIFICATION.md
git add .planning/REQUIREMENTS.md  # if updated
git commit -m "docs(phase-{X}): complete phase execution"
```
</step>

<step name="offer_next">
Present next steps based on milestone status:

**If more phases remain:**
```
## Next Up

**Phase {X+1}: {Name}** — {Goal}

`/gsd:plan-phase {X+1}`

<sub>`/clear` first for fresh context</sub>
```

**If milestone complete:**
```
MILESTONE COMPLETE!

All {N} phases executed.

`/gsd:complete-milestone`
```
</step>

</process>

<context_efficiency>
Orchestrator: ~10-15% context (frontmatter, spawning, results).
Subagents: Fresh 200k each (full workflow + execution).
No polling (Task blocks). No context bleed.
</context_efficiency>

<failure_handling>
**Subagent fails mid-plan:**
- SUMMARY.md won't exist
- Orchestrator detects missing SUMMARY
- Reports failure, asks user how to proceed

**Dependency chain breaks:**
- Wave 1 plan fails
- Wave 2 plans depending on it will likely fail
- Orchestrator can still attempt them (user choice)
- Or skip dependent plans entirely

**All agents in wave fail:**
- Something systemic (git issues, permissions, etc.)
- Stop execution
- Report for manual investigation

**Checkpoint fails to resolve:**
- User can't approve or provides repeated issues
- Ask: "Skip this plan?" or "Abort phase execution?"
- Record partial progress in STATE.md
</failure_handling>

<resumption>
**Resuming interrupted execution:**

If phase execution was interrupted (context limit, user exit, error):

1. Run `/gsd:execute-phase {phase}` again
2. discover_plans finds completed SUMMARYs
3. Skips completed plans
4. Resumes from first incomplete plan
5. Continues wave-based execution

**STATE.md tracks:**
- Last completed plan
- Current wave
- Any pending checkpoints
</resumption>
