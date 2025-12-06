import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';

export const diffCommand = new Command('diff')
  .description('Show changes in context files')
  .argument('[file]', 'Specific context file to diff')
  .option('--staged', 'Show staged changes only')
  .option('--cached', 'Alias for --staged')
  .option('--name-only', 'Show only file names')
  .action(async (file, options) => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ CxtManager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      const gitRepo = (manager as any).gitRepo;
      const staged = options.staged || options.cached;

      if (file) {
        await showFileDiff(gitRepo, file, staged, options.nameOnly);
      } else {
        await showAllContextDiffs(gitRepo, staged, options.nameOnly);
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
        console.error(chalk.red('❌ Failed to show diff:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

async function showFileDiff(gitRepo: any, file: string, staged: boolean, nameOnly: boolean) {
  const validFiles = ['context.md', 'plan.md', 'guardrail.md'];
  
  if (!validFiles.includes(file)) {
    console.log(chalk.red(`❌ Invalid file: ${file}`));
    console.log(chalk.yellow(`💡 Valid files: ${validFiles.join(', ')}`));
    return;
  }

  const filePath = `.cxt/${file}`;
  
  if (nameOnly) {
    console.log(filePath);
    return;
  }

  console.log(chalk.bold(`📋 Diff: ${file}`));
  console.log('');

  const diff = staged 
    ? await gitRepo.getDiff(filePath, '--staged')
    : await gitRepo.getDiff(filePath);

  if (diff.trim()) {
    formatAndShowDiff(diff);
  } else {
    console.log(chalk.gray(`No ${staged ? 'staged ' : ''}changes in ${file}`));
  }
}

async function showAllContextDiffs(gitRepo: any, staged: boolean, nameOnly: boolean) {
  const contextFiles = ['context.md', 'plan.md', 'guardrail.md'];
  const changedFiles: string[] = [];

  for (const file of contextFiles) {
    const filePath = `.cxt/${file}`;
    const diff = staged 
      ? await gitRepo.getDiff(filePath, '--staged')
      : await gitRepo.getDiff(filePath);

    if (diff.trim()) {
      changedFiles.push(file);
      
      if (nameOnly) {
        console.log(filePath);
      } else {
        console.log(chalk.bold(`📋 ${file}`));
        console.log(chalk.gray('─'.repeat(50)));
        formatAndShowDiff(diff);
        console.log('');
      }
    }
  }

  if (changedFiles.length === 0) {
    console.log(chalk.gray(`No ${staged ? 'staged ' : ''}changes in context files`));
    
    if (!staged) {
      console.log('');
      console.log(chalk.blue('💡 Use "cit diff --staged" to see staged changes'));
      console.log(chalk.blue('💡 Use "cit status" to see overall project status'));
    }
  } else if (!nameOnly) {
    console.log(chalk.bold(`📊 Summary: ${changedFiles.length} context file(s) changed`));
    changedFiles.forEach(file => {
      console.log(chalk.yellow(`  • ${file}`));
    });
  }
}

function formatAndShowDiff(diff: string) {
  const lines = diff.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('+++') || line.startsWith('---')) {
      console.log(chalk.bold(line));
    } else if (line.startsWith('@@')) {
      console.log(chalk.cyan(line));
    } else if (line.startsWith('+')) {
      console.log(chalk.green(line));
    } else if (line.startsWith('-')) {
      console.log(chalk.red(line));
    } else {
      console.log(chalk.gray(line));
    }
  });
} 