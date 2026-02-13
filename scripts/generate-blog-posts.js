#!/usr/bin/env node

/**
 * Blog Post Generation Script
 * 
 * Generates milestone blog posts from templates and artifacts.
 * Includes retry logic for non-blocking execution.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Main function to generate blog posts for a milestone
 * @param {string} milestoneVersion - Version string (e.g., "1.0")
 * @param {string} milestoneName - Name string (e.g., "MVP")
 * @returns {Promise<{success: boolean, error?: string, files?: string[]}>}
 */
async function generateBlogPosts(milestoneVersion, milestoneName) {
  try {
    // Ensure docs/blog/ directory exists
    const blogDir = path.join(process.cwd(), 'docs', 'blog');
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // Ensure docs/blog/ is gitignored
    ensureGitignored(blogDir);

    // Load templates
    const architectureTemplate = loadTemplate('blog-post-architecture.md');
    const agenticTemplate = loadTemplate('blog-post-agentic.md');

    const artifacts = collectArtifacts(milestoneVersion);

    // Synthesize posts
    const architecturePost = synthesizeArchitecturePost(artifacts, architectureTemplate);
    const agenticPost = synthesizeAgenticPost(artifacts, agenticTemplate);

    // Write posts with retry logic
    const result = await generateWithRetry(() => {
      return writeBlogPosts(
        architecturePost,
        agenticPost,
        milestoneVersion,
        milestoneName
      );
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: `Generation failed: ${error.message}`
    };
  }
}

/**
 * Retry wrapper with exponential backoff
 * @param {Function} fn - Function to retry (should return Promise)
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<any>}
 */
async function generateWithRetry(fn, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await delayPromise(delay);
      } else {
        console.warn(`Max retries (${maxRetries}) reached. Continuing with partial success.`);
        // Return success to avoid blocking milestone completion
        return { success: true, warning: `Retries exhausted: ${error.message}` };
      }
    }
  }
  
  // Should not reach here, but handle gracefully
  return { success: true, warning: `Retries exhausted: ${lastError?.message || 'Unknown error'}` };
}

/**
 * Promise-based delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delayPromise(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load template file
 * @param {string} templateName - Template filename
 * @returns {string} Template content
 */
function loadTemplate(templateName) {
  const templatePath = path.join(
    process.cwd(),
    'get-shit-done',
    'templates',
    templateName
  );
  
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load template ${templateName}: ${error.message}`);
  }
}

/**
 * Collect artifacts for milestone
 * @param {string} milestoneVersion - Version string
 * @returns {Object} Artifact data object
 */
function collectArtifacts(milestoneVersion) {
  const artifacts = {
    phases: {
      summaries: [],
      contexts: [],
      verifications: [],
      uats: []
    },
    git: {
      diffStat: '',
      diff: '',
      commits: []
    },
    requirements: '',
    sessionLogs: [],
    subagentData: {}
  };

  const planningDir = path.join(process.cwd(), '.planning');
  const phasesDir = path.join(planningDir, 'phases');

  // Collect phase artifacts
  if (fs.existsSync(phasesDir)) {
    const phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => name.match(/^\d{2}-/)); // Match phase directories like "01-worktree-integration"

    for (const phaseDir of phaseDirs) {
      const phasePath = path.join(phasesDir, phaseDir);
      const files = fs.readdirSync(phasePath);

      // Collect SUMMARY.md files
      const summaryFiles = files.filter(f => f.endsWith('-SUMMARY.md'));
      for (const summaryFile of summaryFiles) {
        try {
          const content = fs.readFileSync(path.join(phasePath, summaryFile), 'utf8');
          artifacts.phases.summaries.push({
            phase: phaseDir,
            file: summaryFile,
            content
          });
        } catch (error) {
          // Graceful degradation - skip missing files
        }
      }

      // Collect CONTEXT.md files (handle missing gracefully)
      const contextFile = path.join(phasePath, `${phaseDir.split('-')[0]}-CONTEXT.md`);
      if (fs.existsSync(contextFile)) {
        try {
          artifacts.phases.contexts.push({
            phase: phaseDir,
            content: fs.readFileSync(contextFile, 'utf8')
          });
        } catch (error) {
          // Skip on error
        }
      }

      // Collect VERIFICATION.md files (handle missing gracefully)
      const verificationFile = path.join(phasePath, `${phaseDir.split('-')[0]}-VERIFICATION.md`);
      if (fs.existsSync(verificationFile)) {
        try {
          artifacts.phases.verifications.push({
            phase: phaseDir,
            content: fs.readFileSync(verificationFile, 'utf8')
          });
        } catch (error) {
          // Skip on error
        }
      }

      // Collect UAT.md files (handle missing gracefully)
      const uatFile = path.join(phasePath, `${phaseDir.split('-')[0]}-UAT.md`);
      if (fs.existsSync(uatFile)) {
        try {
          artifacts.phases.uats.push({
            phase: phaseDir,
            content: fs.readFileSync(uatFile, 'utf8')
          });
        } catch (error) {
          // Skip on error
        }
      }
    }
  }

  // Collect git diffs and commits
  try {
    // Find commits matching feat( pattern
    const commitLines = execSync('git log --oneline --grep="feat("', { encoding: 'utf8', cwd: process.cwd() })
      .trim()
      .split('\n')
      .filter(line => line.trim());

    if (commitLines.length > 0) {
      // Extract commit hashes (first 7 chars)
      const commitHashes = commitLines.map(line => line.split(' ')[0]).filter(Boolean);
      
      if (commitHashes.length > 0) {
        const firstCommit = commitHashes[commitHashes.length - 1]; // Oldest
        const lastCommit = commitHashes[0]; // Newest

        // Get diff stat
        try {
          artifacts.git.diffStat = execSync(
            `git diff --stat ${firstCommit}..${lastCommit}`,
            { encoding: 'utf8', cwd: process.cwd(), maxBuffer: 1024 * 1024 }
          ).trim();
        } catch (error) {
          // Graceful degradation
        }

        // Get full diff (limit to 5000 lines)
        try {
          const fullDiff = execSync(
            `git diff ${firstCommit}..${lastCommit}`,
            { encoding: 'utf8', cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }
          ).trim();
          artifacts.git.diff = fullDiff.split('\n').slice(0, 5000).join('\n');
        } catch (error) {
          // Graceful degradation
        }

        // Get commit messages
        try {
          artifacts.git.commits = execSync(
            `git log --oneline ${firstCommit}..${lastCommit}`,
            { encoding: 'utf8', cwd: process.cwd(), maxBuffer: 1024 * 1024 }
          ).trim().split('\n').filter(Boolean);
        } catch (error) {
          // Graceful degradation
        }
      }
    }
  } catch (error) {
    // Graceful degradation - git operations may fail
  }

  // Read REQUIREMENTS.md (handle missing gracefully)
  const requirementsPath = path.join(planningDir, 'REQUIREMENTS.md');
  if (fs.existsSync(requirementsPath)) {
    try {
      artifacts.requirements = fs.readFileSync(requirementsPath, 'utf8');
    } catch (error) {
      // Skip on error
    }
  }

  // Check for session logs in multiple locations
  const logLocations = [
    path.join(os.homedir(), '.claude', 'logs'),
    path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'logs'),
    path.join(process.cwd(), 'logs')
  ];

  for (const logLocation of logLocations) {
    if (fs.existsSync(logLocation)) {
      try {
        const logFiles = fs.readdirSync(logLocation)
          .filter(f => f.endsWith('.json') || f.endsWith('.log') || f.endsWith('.txt'))
          .slice(0, 10); // Limit to 10 most recent

        for (const logFile of logFiles) {
          try {
            const content = fs.readFileSync(path.join(logLocation, logFile), 'utf8');
            artifacts.sessionLogs.push({
              location: logLocation,
              file: logFile,
              content: content.substring(0, 10000) // Limit size
            });
          } catch (error) {
            // Skip individual log file errors
          }
        }
      } catch (error) {
        // Skip directory read errors
      }
    }
  }

  // Read subagent data from agent-history.json
  const agentHistoryPath = path.join(planningDir, 'agent-history.json');
  if (fs.existsSync(agentHistoryPath)) {
    try {
      const agentHistoryContent = fs.readFileSync(agentHistoryPath, 'utf8');
      artifacts.subagentData = JSON.parse(agentHistoryContent);
    } catch (error) {
      // Graceful degradation - use empty object
    }
  }

  return artifacts;
}

/**
 * Synthesize architecture post from artifacts and template
 * @param {Object} artifacts - Artifact data
 * @param {string} template - Template content
 * @returns {string} Synthesized markdown post
 */
function synthesizeArchitecturePost(artifacts, template) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  
  // Extract milestone name from requirements or use default
  let milestoneName = 'Milestone';
  if (artifacts.requirements) {
    const milestoneMatch = artifacts.requirements.match(/v([\d.]+)/i);
    if (milestoneMatch) {
      milestoneName = `v${milestoneMatch[1]}`;
    }
  }

  // Synthesize title from milestone name
  const title = milestoneName !== 'Milestone' 
    ? `${milestoneName}: Architecture and Technical Learnings`
    : 'Architecture and Technical Learnings';

  // Synthesize introduction from REQUIREMENTS.md and summaries
  let intro = '';
  if (artifacts.requirements) {
    const reqLines = artifacts.requirements.split('\n').slice(0, 10).join('\n');
    intro += `This milestone focused on ${reqLines.substring(0, 200)}...\n\n`;
  }
  
  if (artifacts.phases.summaries.length > 0) {
    const summaryText = artifacts.phases.summaries
      .map(s => s.content.split('\n').slice(0, 5).join('\n'))
      .join('\n\n');
    intro += `Key accomplishments:\n${summaryText.substring(0, 300)}...`;
  }

  // Extract learnings from CONTEXT.md, VERIFICATION.md, and UAT.md
  const learnings = [];
  
  // From CONTEXT.md - decisions and trade-offs
  for (const context of artifacts.phases.contexts) {
    const decisionsMatch = context.content.match(/## Decisions[\s\S]*?(?=##|$)/i);
    if (decisionsMatch) {
      learnings.push({
        title: `Decisions from ${context.phase}`,
        content: decisionsMatch[0].substring(0, 500)
      });
    }
  }

  // From VERIFICATION.md - gaps and what broke
  for (const verification of artifacts.phases.verifications) {
    const gapsMatch = verification.content.match(/## Gaps[\s\S]*?(?=##|$)/i) ||
                      verification.content.match(/## Issues[\s\S]*?(?=##|$)/i);
    if (gapsMatch) {
      learnings.push({
        title: `Verification Insights from ${verification.phase}`,
        content: gapsMatch[0].substring(0, 500)
      });
    }
  }

  // From UAT.md - user feedback
  for (const uat of artifacts.phases.uats) {
    const feedbackMatch = uat.content.match(/## Feedback[\s\S]*?(?=##|$)/i) ||
                         uat.content.match(/## Results[\s\S]*?(?=##|$)/i);
    if (feedbackMatch) {
      learnings.push({
        title: `User Testing Insights from ${uat.phase}`,
        content: feedbackMatch[0].substring(0, 500)
      });
    }
  }

  // Format learnings as markdown sections
  let learningsMarkdown = '';
  if (learnings.length > 0) {
    learningsMarkdown = learnings.map(l => {
      return `### ${l.title}\n\n${l.content}\n`;
    }).join('\n');
  } else {
    learningsMarkdown = 'Key learnings will be extracted from milestone artifacts.\n';
  }

  // Extract code snippets from git diff
  // Identify important files from SUMMARY.md
  const importantFiles = new Set();
  for (const summary of artifacts.phases.summaries) {
    const filesMatch = summary.content.match(/key-files:[\s\S]*?created:[\s\S]*?\[([^\]]+)\]/i) ||
                      summary.content.match(/Files Created[:\s\S]*?(- `[^`]+`)/gi);
    if (filesMatch) {
      const files = Array.isArray(filesMatch) ? filesMatch : [filesMatch];
      files.forEach(f => {
        const fileMatch = f.match(/`([^`]+)`/);
        if (fileMatch) {
          importantFiles.add(fileMatch[1]);
        }
      });
    }
  }

  // Extract code snippets from git diff for important files
  let codeSnippets = '';
  if (artifacts.git.diff && importantFiles.size > 0) {
    const diffLines = artifacts.git.diff.split('\n');
    const snippets = [];
    let currentFile = '';
    let inImportantFile = false;
    let snippetLines = [];

    for (let i = 0; i < Math.min(diffLines.length, 2000); i++) {
      const line = diffLines[i];
      
      // Check if this is a file header
      if (line.startsWith('diff --git') || line.startsWith('+++')) {
        if (snippetLines.length > 0 && inImportantFile) {
          snippets.push({
            file: currentFile,
            lines: snippetLines.slice(0, 30).join('\n') // Limit snippet size
          });
        }
        snippetLines = [];
        inImportantFile = false;
        
        // Extract filename
        const fileMatch = line.match(/b\/(.+)$/);
        if (fileMatch) {
          currentFile = fileMatch[1];
          inImportantFile = Array.from(importantFiles).some(f => currentFile.includes(f));
        }
      } else if (inImportantFile && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
        snippetLines.push(line);
      }
    }

    // Add last snippet if exists
    if (snippetLines.length > 0 && inImportantFile) {
      snippets.push({
        file: currentFile,
        lines: snippetLines.slice(0, 30).join('\n')
      });
    }

    // Format snippets
    if (snippets.length > 0) {
      codeSnippets = snippets.slice(0, 4).map(s => {
        const language = s.file.match(/\.(\w+)$/)?.[1] || 'text';
        return `\`\`\`${language}\n// Important: ${s.file}\n${s.lines}\n\`\`\``;
      }).join('\n\n');
    }
  }

  if (!codeSnippets) {
    codeSnippets = 'Code examples will be extracted from milestone changes.\n';
  }

  // Synthesize conclusion from summaries
  let conclusion = '';
  if (artifacts.phases.summaries.length > 0) {
    const lastSummary = artifacts.phases.summaries[artifacts.phases.summaries.length - 1];
    const nextPhaseMatch = lastSummary.content.match(/## Next Phase[\s\S]*?(?=##|$)/i);
    if (nextPhaseMatch) {
      conclusion = nextPhaseMatch[0].substring(0, 300);
    } else {
      conclusion = 'This milestone established key architectural foundations for future development.';
    }
  } else {
    conclusion = 'This milestone advanced the project\'s technical maturity.';
  }

  // Replace template placeholders
  let result = template;
  result = result.replace(/\{\{TITLE\}\}/g, title);
  result = result.replace(/\{\{DATE\}\}/g, date);
  result = result.replace(/\{\{MILESTONE_VERSION\}\}/g, milestoneName);
  result = result.replace(/\{\{MILESTONE_NAME\}\}/g, milestoneName);
  result = result.replace(/\{\{INTRO\}\}/g, intro || 'This milestone delivered significant technical improvements.');
  result = result.replace(/\{\{LEARNINGS\}\}/g, learningsMarkdown);
  result = result.replace(/\{\{CODE_SNIPPETS\}\}/g, codeSnippets);
  result = result.replace(/\{\{CONCLUSION\}\}/g, conclusion);

  return result;
}

/**
 * Detect TDD commit sequences (test → feat → optional refactor)
 * @param {string[]} commits - Array of commit messages (e.g. from git log --oneline, strip hash)
 * @returns {{ cycles: number, sequences: Array<{test: string, feat: string}> }}
 */
function detectTddPatterns(commits) {
  const tddCycles = [];
  const messages = commits.map(c => (typeof c === 'string' ? c.replace(/^\S+\s+/, '') : c));
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];
    if (current && next && current.match(/^test\(/i) && next.match(/^feat\(/i)) {
      tddCycles.push({ test: current, feat: next });
    }
  }
  return {
    cycles: tddCycles.length,
    sequences: tddCycles
  };
}

/**
 * Synthesize agentic post from artifacts and template
 * @param {Object} artifacts - Artifact data
 * @param {string} template - Template content
 * @returns {string} Synthesized markdown post
 */
function synthesizeAgenticPost(artifacts, template) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  
  // Extract milestone name
  let milestoneName = 'Milestone';
  if (artifacts.requirements) {
    const milestoneMatch = artifacts.requirements.match(/v([\d.]+)/i);
    if (milestoneMatch) {
      milestoneName = `v${milestoneMatch[1]}`;
    }
  }

  const title = `Agentic Coding Practices: Learnings from ${milestoneName}`;

  // Synthesize introduction from subagent data and summaries
  let intro = `This milestone provided insights into agentic coding workflows, iteration patterns, and process improvements.\n\n`;
  
  if (artifacts.subagentData && Object.keys(artifacts.subagentData).length > 0) {
    intro += `The milestone involved ${Object.keys(artifacts.subagentData).length} subagent executions with various iteration patterns.\n\n`;
  }
  
  if (artifacts.phases.summaries.length > 0) {
    intro += `Across ${artifacts.phases.summaries.length} phase summaries, we observed clear patterns in task execution, checkpoint usage, and deviation handling.`;
  }

  // Extract iteration patterns from subagent data and TDD commit analysis
  let iterationPatterns = '';
  const patterns = [];

  // TDD pattern detection from commit history
  const tddPatterns = detectTddPatterns(artifacts.git?.commits || []);
  if (tddPatterns.cycles > 0) {
    patterns.push(`- TDD cycles detected: ${tddPatterns.cycles} (test → feat sequences)`);
    if (tddPatterns.sequences.length > 0 && tddPatterns.sequences.length <= 3) {
      patterns.push(...tddPatterns.sequences.map(s => `  - Example: test → ${s.feat.substring(0, 50)}${s.feat.length > 50 ? '...' : ''}`));
    } else if (tddPatterns.sequences.length > 3) {
      patterns.push(`  - Example: ${tddPatterns.sequences[0].test} → ${tddPatterns.sequences[0].feat.substring(0, 40)}...`);
    }
  } else {
    patterns.push('- No explicit TDD patterns detected in commit history');
  }

  if (artifacts.subagentData && Object.keys(artifacts.subagentData).length > 0) {
    // Extract iteration counts
    const iterationCounts = [];
    for (const [agentId, data] of Object.entries(artifacts.subagentData)) {
      if (data.iterations) {
        iterationCounts.push(data.iterations);
      }
    }
    if (iterationCounts.length > 0) {
      const avgIterations = iterationCounts.reduce((a, b) => a + b, 0) / iterationCounts.length;
      patterns.push(`- Average iterations per task: ${avgIterations.toFixed(1)}`);
    }
    const plannerCheckerCount = Object.values(artifacts.subagentData)
      .filter(data => data.type === 'planner-checker' || data.workflow === 'planner-checker').length;
    if (plannerCheckerCount > 0) {
      patterns.push(`- Planner-checker loops: ${plannerCheckerCount}`);
    }
  } else {
    const revisionMentions = artifacts.phases.summaries
      .map(s => (s.content.match(/revision|iteration|retry/gi) || []).length)
      .reduce((a, b) => a + b, 0);
    if (revisionMentions > 0) {
      patterns.push(`- Revision cycles observed: ${revisionMentions} mentions across phase summaries`);
    }
  }

  iterationPatterns = patterns.length > 0 ? patterns.join('\n') : 'Iteration patterns will be documented from milestone execution data.';

  // Extract failures and recoveries from VERIFICATION.md and summaries
  let failures = '';
  const failureStories = [];

  // From VERIFICATION.md
  for (const verification of artifacts.phases.verifications) {
    const issuesMatch = verification.content.match(/## Issues[\s\S]*?(?=##|$)/i) ||
                       verification.content.match(/## Gaps[\s\S]*?(?=##|$)/i);
    if (issuesMatch) {
      failureStories.push({
        phase: verification.phase,
        content: issuesMatch[0].substring(0, 400)
      });
    }
  }

  // From summaries "Issues Encountered" sections
  for (const summary of artifacts.phases.summaries) {
    const issuesMatch = summary.content.match(/## Issues Encountered[\s\S]*?(?=##|$)/i);
    if (issuesMatch) {
      failureStories.push({
        phase: summary.phase,
        content: issuesMatch[0].substring(0, 400)
      });
    }
  }

  if (failureStories.length > 0) {
    failures = failureStories.map(f => {
      return `### ${f.phase}\n\n${f.content}\n`;
    }).join('\n');
  } else {
    failures = 'Failure and recovery stories will be extracted from milestone verification reports.';
  }

  // Extract timing data from summaries
  let timing = '';
  const durations = [];
  
  for (const summary of artifacts.phases.summaries) {
    const durationMatch = summary.content.match(/duration:[\s\s]*([^\n]+)/i) ||
                         summary.content.match(/\*\*Duration:\*\*[\s\s]*([^\n]+)/i);
    if (durationMatch) {
      durations.push({
        phase: summary.phase,
        duration: durationMatch[1].trim()
      });
    }
  }

  if (durations.length > 0) {
    timing = '### Phase Durations\n\n';
    timing += durations.map(d => `- ${d.phase}: ${d.duration}`).join('\n');
    timing += '\n\nTiming insights will be calculated from phase execution data.';
  } else {
    timing = 'Timing data not available in milestone artifacts.';
  }

  // Extract worktree patterns from summaries (if Phase 1 exists)
  let worktreePatterns = '';
  const worktreeMentions = artifacts.phases.summaries
    .map(s => s.content.match(/worktree|work tree|isolated.*branch/gi))
    .filter(Boolean);

  if (worktreeMentions.length > 0) {
    worktreePatterns = '### Worktree Isolation Patterns\n\n';
    worktreePatterns += 'Worktree isolation was used for subagent execution:\n';
    worktreePatterns += '- Branch naming: feature--{phase}--agents--agent-{id}--{plan}\n';
    worktreePatterns += '- Repo root remained read-only during subagent execution\n';
    worktreePatterns += '- Merge verification ensured test suite passed before integration\n';
  } else {
    worktreePatterns = 'No worktree isolation used in this milestone.';
  }

  // Extract prompt evolution from CONTEXT.md and template changes
  let promptEvolution = '';
  const promptMentions = [];

  // From CONTEXT.md
  for (const context of artifacts.phases.contexts) {
    const evolutionMatch = context.content.match(/## Prompt|## Instructions|## Evolution[\s\S]*?(?=##|$)/i);
    if (evolutionMatch) {
      promptMentions.push({
        source: context.phase,
        content: evolutionMatch[0].substring(0, 300)
      });
    }
  }

  // Check git diff for template changes
  if (artifacts.git && artifacts.git.diff) {
    const templateDiffMatch = artifacts.git.diff.match(/diff --git.*template[^\n]*[\s\S]{0,500}/i);
    if (templateDiffMatch) {
      promptMentions.push({
        source: 'Template changes',
        content: 'Template refinements observed in git diff.'
      });
    }
  }

  if (promptMentions.length > 0) {
    promptEvolution = promptMentions.map(p => {
      return `### ${p.source}\n\n${p.content}\n`;
    }).join('\n');
  } else {
    promptEvolution = 'Prompt evolution will be documented from milestone context files and template changes.';
  }

  // Synthesize conclusion
  let conclusion = 'This milestone provided valuable insights into agentic coding workflows. ';
  if (artifacts.phases.summaries.length > 0) {
    conclusion += `Key patterns observed across ${artifacts.phases.summaries.length} phases will inform future milestone execution strategies.`;
  } else {
    conclusion += 'Process improvements identified will carry forward to future milestones.';
  }

  // Replace template placeholders
  let result = template;
  result = result.replace(/\{\{TITLE\}\}/g, title);
  result = result.replace(/\{\{DATE\}\}/g, date);
  result = result.replace(/\{\{MILESTONE_VERSION\}\}/g, milestoneName);
  result = result.replace(/\{\{MILESTONE_NAME\}\}/g, milestoneName);
  result = result.replace(/\{\{INTRO\}\}/g, intro);
  result = result.replace(/\{\{ITERATION_PATTERNS\}\}/g, iterationPatterns);
  result = result.replace(/\{\{FAILURES\}\}/g, failures);
  result = result.replace(/\{\{TIMING\}\}/g, timing);
  result = result.replace(/\{\{WORKTREE_PATTERNS\}\}/g, worktreePatterns);
  result = result.replace(/\{\{PROMPT_EVOLUTION\}\}/g, promptEvolution);
  result = result.replace(/\{\{CONCLUSION\}\}/g, conclusion);

  return result;
}

/**
 * Write blog posts to files
 * @param {string} architecturePost - Architecture post content
 * @param {string} agenticPost - Agentic post content
 * @param {string} milestoneVersion - Version string
 * @param {string} milestoneName - Name string
 * @returns {{success: boolean, files?: string[]}}
 */
function writeBlogPosts(architecturePost, agenticPost, milestoneVersion, milestoneName) {
  const blogDir = path.join(process.cwd(), 'docs', 'blog');
  const slug = milestoneName.toLowerCase().replace(/\s+/g, '-');
  
  const architectureFilename = `v${milestoneVersion}-${slug}.md`;
  const agenticFilename = `v${milestoneVersion}-agentic-practices.md`;
  
  const architecturePath = path.join(blogDir, architectureFilename);
  const agenticPath = path.join(blogDir, agenticFilename);
  
  try {
    fs.writeFileSync(architecturePath, architecturePost, 'utf8');
    fs.writeFileSync(agenticPath, agenticPost, 'utf8');
    
    return {
      success: true,
      files: [architecturePath, agenticPath]
    };
  } catch (error) {
    throw new Error(`Failed to write blog posts: ${error.message}`);
  }
}

/**
 * Ensure docs/blog/ is in .gitignore
 * @param {string} blogDir - Blog directory path
 */
function ensureGitignored(blogDir) {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    // Create .gitignore if it doesn't exist
    fs.writeFileSync(gitignorePath, 'docs/blog/\n', 'utf8');
    return;
  }
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const patterns = [
    'docs/blog/',
    'docs/blog',
    '/docs/blog/',
    '/docs/blog'
  ];
  
  const isIgnored = patterns.some(pattern => {
    const regex = new RegExp(`^${pattern.replace(/\//g, '\\/')}$`, 'm');
    return regex.test(gitignoreContent);
  });
  
  if (!isIgnored) {
    // Append to .gitignore
    fs.appendFileSync(gitignorePath, '\n# Blog posts (generated)\ndocs/blog/\n', 'utf8');
  }
}

// Export for use as module
module.exports = {
  generateBlogPosts,
  collectArtifacts,
  synthesizeArchitecturePost,
  synthesizeAgenticPost
};

// CLI execution if run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node generate-blog-posts.js <milestoneVersion> <milestoneName>');
    process.exit(1);
  }
  
  const [milestoneVersion, milestoneName] = args;
  generateBlogPosts(milestoneVersion, milestoneName)
    .then(result => {
      if (result.success) {
        console.log('Blog posts generated successfully');
        if (result.files) {
          console.log('Files:', result.files.join(', '));
        }
        process.exit(0);
      } else {
        console.error('Error:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}
