# {{TITLE}}

**Date:** {{DATE}}  
**Milestone:** {{MILESTONE_VERSION}} - {{MILESTONE_NAME}}

---

## Introduction

{{INTRO}}

<!-- 
Guidance for content synthesis:
- Extract from: milestone SUMMARY.md, ARCHITECTURE.md, CONCERNS.md, CONVENTIONS.md
- Focus on: architectural decisions, project structure learnings, technical patterns established
- Voice: Technical depth with clear explanations, lessons learned from implementation
- Length: Adapt to milestone complexity (some milestones have more learnings than others)
-->

## Key Learnings

{{LEARNINGS}}

<!-- 
Structure learnings as 3-5 sections, each covering:
- What we learned (architectural pattern, design decision, structural insight)
- Why it matters (impact on maintainability, performance, developer experience)
- How we applied it (specific implementation details)

Example sections:
- "Modular Component Architecture"
- "State Management Patterns"
- "API Design Principles"
- "Testing Strategy"
- "Performance Optimizations"
-->

## Code Examples

{{CODE_SNIPPETS}}

<!-- 
Include 2-4 code snippets that illustrate key architectural patterns:
- Use markdown code blocks with language tags
- Add brief annotations explaining importance
- Focus on patterns, not just implementation details
- Extract from actual code files referenced in milestone artifacts

Format:
\`\`\`language
// Brief comment explaining why this pattern matters
code example
\`\`\`

Example:
\`\`\`typescript
// Centralized error handling pattern - all API routes use this wrapper
export async function apiHandler(req: Request) {
  try {
    return await handler(req);
  } catch (error) {
    return errorResponse(error);
  }
}
\`\`\`
-->

## Conclusion

{{CONCLUSION}}

<!-- 
Synthesize:
- What architectural foundations were established
- How this milestone advances the project's technical maturity
- What patterns will carry forward to future milestones
- Any warnings or gotchas for future developers
-->

---

*This post is part of the [Project Name] milestone series. See [milestone archive](../milestone-archive.md) for all posts.*
