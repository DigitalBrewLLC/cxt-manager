import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';

export const logCommand = new Command('log')
  .description('View context change history')
  .option('--oneline', 'Show condensed one-line format')
  .option('--graph', 'Show commit graph')
  .option('--context-only', 'Show only context file changes')
  .option('-n, --max-count <number>', 'Limit number of commits', '10')
  .action(async (options) => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ CxtManager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      console.log(chalk.bold('📜 Context Change History'));
      console.log('');

      const gitRepo = (manager as any).gitRepo;
      const maxCount = parseInt(options.maxCount, 10);

      if (options.contextOnly) {
        await showContextOnlyLog(gitRepo, maxCount, options.oneline);
      } else {
        await showFullLog(gitRepo, maxCount, options.oneline, options.graph);
      }

    } catch (error: any) {
      // Handle specific error types with helpful messages
      if (error.message.includes('Not a Git repository')) {
        console.error(chalk.red('❌ Not a Git repository'));
        console.log(chalk.yellow('💡 Run "git init" to initialize a Git repository'));
        console.log(chalk.yellow('💡 Or run "cit init" which will initialize Git automatically'));
      } else if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
        console.error(chalk.red('❌ Permission denied'));
        console.log(chalk.yellow('💡 Check file system permissions'));
        console.log(chalk.yellow('💡 Ensure you have read access to .git/ directory'));
      } else {
        console.error(chalk.red('❌ Failed to get log:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

async function showContextOnlyLog(gitRepo: any, maxCount: number, oneline: boolean) {
  // Get history for .cxt/ folder only
  const contextFiles = ['.cxt/context.md', '.cxt/plan.md', '.cxt/guardrail.md'];
  
  console.log(chalk.bold('🎯 Context file changes only:'));
  console.log('');

  for (const file of contextFiles) {
    const history = await gitRepo.getFileHistory(file);
    
    if (history.length > 0) {
      console.log(chalk.blue(`📄 ${file}`));
      
      history.slice(0, Math.ceil(maxCount / contextFiles.length)).forEach((commit: any) => {
        if (oneline) {
          console.log(`  ${chalk.yellow(commit.hash.slice(0, 7))} ${commit.message.slice(0, 60)}`);
        } else {
          console.log(`  ${chalk.yellow(commit.hash.slice(0, 7))} ${chalk.gray(new Date(commit.date).toLocaleDateString())}`);
          console.log(`  ${commit.author} - ${commit.message}`);
          console.log('');
        }
      });
    }
  }
}

async function showFullLog(gitRepo: any, maxCount: number, oneline: boolean, graph: boolean) {
  // Mock implementation - in real version we'd use git log
  const commits = [
    {
      hash: 'a1b2c3d',
      date: new Date(),
      author: 'Developer',
      message: 'Update project goals and timeline',
      contextFiles: ['context.md', 'plan.md']
    },
    {
      hash: 'e4f5g6h',
      date: new Date(Date.now() - 86400000),
      author: 'Claude-3-Sonnet (via MCP)',
      message: 'auto: sync API limits from code changes',
      contextFiles: ['plan.md']
    },
    {
      hash: 'i7j8k9l',
      date: new Date(Date.now() - 172800000),
      author: 'github-copilot (code-triggered)',
      message: 'Updated context files after merge',
      contextFiles: ['context.md', 'plan.md']
    }
  ];

  commits.slice(0, maxCount).forEach((commit, index) => {
    const isLast = index === commits.length - 1 || index === maxCount - 1;
    
    if (graph) {
      const connector = isLast ? '└──' : '├──';
      console.log(chalk.gray(connector));
    }

    if (oneline) {
      const attribution = getCommitAttribution(commit.author);
      console.log(`${chalk.yellow(commit.hash)} ${attribution} ${commit.message}`);
    } else {
      const attribution = getCommitAttribution(commit.author);
      console.log(chalk.yellow(`commit ${commit.hash}`));
      console.log(`Author: ${commit.author} ${attribution}`);
      console.log(`Date:   ${commit.date.toLocaleString()}`);
      console.log('');
      console.log(`    ${commit.message}`);
      
      if (commit.contextFiles.length > 0) {
        console.log('');
        console.log(chalk.gray('    Context files changed:'));
        commit.contextFiles.forEach(file => {
          console.log(chalk.gray(`    - ${file}`));
        });
      }
      console.log('');
    }
  });

  console.log(chalk.gray(`Showing ${Math.min(maxCount, commits.length)} of ${commits.length} commits`));
  console.log(chalk.blue('💡 Use "cit log --context-only" to see only context file changes'));
}

function getCommitAttribution(author: string): string {
  if (author.includes('Claude') || author.includes('GPT')) return '🧠';
  if (author.includes('copilot') || author.includes('code-triggered')) return '🔄';
  if (author.includes('External') || author.includes('Sync')) return '🌐';
  return '👨‍💻';
} 