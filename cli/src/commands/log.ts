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
        console.log(chalk.red('❌ cxt-manager not initialized'));
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
        // Full log with graph support is not yet implemented
        // For now, show context-only log with a helpful message
        console.log(chalk.yellow('💡 Full log view is not yet implemented'));
        console.log(chalk.yellow('💡 Using context-only view instead. Use --context-only flag explicitly.'));
        console.log('');
        await showContextOnlyLog(gitRepo, maxCount, options.oneline);
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