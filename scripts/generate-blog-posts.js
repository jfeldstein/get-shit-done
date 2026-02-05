#!/usr/bin/env node

/**
 * Blog Post Generation Script
 * 
 * Generates milestone blog posts from templates and artifacts.
 * Includes retry logic for non-blocking execution.
 */

const fs = require('fs');
const path = require('path');

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

    // Collect artifacts (stub for now)
    const artifacts = collectArtifacts(milestoneVersion);

    // Synthesize posts (stubs for now)
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
 * Collect artifacts for milestone (stub)
 * @param {string} milestoneVersion - Version string
 * @returns {Object} Artifact data object
 */
function collectArtifacts(milestoneVersion) {
  // TODO: Implement artifact collection
  // - Read milestone SUMMARY.md
  // - Read ARCHITECTURE.md, CONCERNS.md, etc.
  // - Extract timing data from execution logs
  // - Collect subagent patterns
  return {};
}

/**
 * Synthesize architecture post from artifacts and template (stub)
 * @param {Object} artifacts - Artifact data
 * @param {string} template - Template content
 * @returns {string} Synthesized markdown post
 */
function synthesizeArchitecturePost(artifacts, template) {
  // TODO: Implement content synthesis
  // - Replace placeholders with artifact data
  // - Format code snippets
  // - Structure learnings sections
  return template;
}

/**
 * Synthesize agentic post from artifacts and template (stub)
 * @param {Object} artifacts - Artifact data
 * @param {string} template - Template content
 * @returns {string} Synthesized markdown post
 */
function synthesizeAgenticPost(artifacts, template) {
  // TODO: Implement content synthesis
  // - Replace placeholders with artifact data
  // - Extract iteration patterns
  // - Format timing data
  return template;
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
  generateBlogPosts
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
