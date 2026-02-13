# {{TITLE}}

**Date:** {{DATE}}  
**Milestone:** {{MILESTONE_VERSION}} - {{MILESTONE_NAME}}

---

## Introduction

{{INTRO}}

<!-- 
Guidance for content synthesis:
- Extract from: milestone SUMMARY.md, execution logs, timing data, subagent patterns
- Focus on: agentic workflow patterns, iteration strategies, failure recovery, timing insights
- Voice: Process-focused, meta-learning about how agentic coding workflows evolve
- Length: Adapt to milestone complexity (some milestones have more iteration patterns than others)
-->

## Agentic Patterns

{{ITERATION_PATTERNS}}

<!-- 
Document patterns observed in agentic execution:
- How tasks were broken down and sequenced
- Subagent spawning patterns (when/why subagents were used)
- Parallelization strategies
- Checkpoint usage patterns
- TDD workflow integration

Example patterns:
- "Atomic Task Commits"
- "Checkpoint-Driven Verification"
- "Subagent Isolation Patterns"
- "TDD Integration Flow"
-->

## Iterations & Failures

{{FAILURES}}

<!-- 
Document failure/recovery stories:
- What went wrong during execution
- How deviations were handled automatically
- Recovery strategies that worked
- Patterns for preventing similar issues

Format as stories:
- "Initial approach: [what was tried]"
- "Problem encountered: [what failed]"
- "Solution: [how it was fixed]"
- "Lesson: [what we learned]"
-->

## Timing Insights

{{TIMING}}

<!-- 
Extract timing data from milestone execution:
- Task duration breakdowns
- Retry patterns and their impact
- Parallelization benefits
- Checkpoint overhead
- Overall milestone duration vs. estimates

Present as:
- Duration tables (task → time)
- Comparison metrics (estimated vs. actual)
- Efficiency insights (what sped things up, what slowed things down)
-->

## Worktree Patterns

{{WORKTREE_PATTERNS}}

<!-- 
Document worktree usage if applicable:
- When worktrees were created/used
- Isolation benefits observed
- Merge strategies
- Conflict resolution patterns

If no worktrees used, note: "No worktree isolation used in this milestone."
-->

## Prompt Evolution

{{PROMPT_EVOLUTION}}

<!-- 
Document how prompts/instructions evolved:
- What prompt patterns worked well
- What needed clarification
- How context was assembled
- Template improvements made

Focus on meta-learning about prompt engineering for agentic workflows.
-->

## Conclusion

{{CONCLUSION}}

<!-- 
Synthesize:
- Key agentic workflow insights from this milestone
- Patterns that will carry forward
- Process improvements identified
- Recommendations for future milestone execution
-->

---

*This post is part of the [Project Name] milestone series. See [milestone archive](../milestone-archive.md) for all posts.*
