import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';

export const blameCommand = new Command('blame')
  .description('Show context file line-by-line attribution (author, date, commit)')
  .argument('<file>', 'Context file to analyze (context.md, plan.md, guardrail.md)')
  .option('--timeline', 'Show chronological evolution')
  .option('--diff <commit>', 'Show changes since commit')
  .action(async (file, options) => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ cxt-manager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      // Validate file name
      const validFiles = ['context.md', 'plan.md', 'guardrail.md'];
      if (!validFiles.includes(file)) {
        console.log(chalk.red(`❌ Invalid file: ${file}`));
        console.log(chalk.yellow(`💡 Valid files: ${validFiles.join(', ')}`));
        return;
      }

      const filePath = `.cxt/${file}`;
      console.log(chalk.bold(`📍 Context Attribution: ${file}`));
      console.log('');

      // Get blame information from GitRepository
      const gitRepo = (manager as any).gitRepo;
      const blameInfo = await gitRepo.blame(filePath);

      if (options.timeline) {
        await showTimelineView(gitRepo, filePath);
      } else if (options.diff) {
        await showDiffView(gitRepo, filePath, options.diff);
      } else {
        await showDetailedBlame(blameInfo, file);
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
      } else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        console.error(chalk.red('❌ File not found'));
        console.log(chalk.yellow('💡 Make sure the file exists in .cxt/ directory'));
      } else {
        console.error(chalk.red('❌ Blame analysis failed:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

async function showDetailedBlame(blameInfo: any[], file: string) {
  console.log(chalk.bold('📝 Line-by-line attribution:'));
  console.log('');
  
  if (blameInfo.length === 0) {
    console.log(chalk.gray('No blame information available'));
    return;
  }
  
  blameInfo.slice(0, 20).forEach((entry) => {
    const lineNum = entry.line.toString().padStart(3, ' ');
    const author = entry.author || 'unknown';
    const email = entry.email || 'unknown';
    const hash = entry.hash ? entry.hash.slice(0, 7) : 'unknown';
    const date = entry.date ? new Date(entry.date).toLocaleDateString() : 'unknown';
    const content = entry.content || '';
    
    console.log(
      chalk.gray(`${lineNum}│`) + 
      ` ${chalk.blue(author.padEnd(20))}` +
      ` ${chalk.gray(hash)}` +
      ` ${chalk.gray(date.padEnd(12))}` +
      ` ${content.slice(0, 60)}`
    );
  });
  
  if (blameInfo.length > 20) {
    console.log(chalk.gray(`... and ${blameInfo.length - 20} more lines`));
  }
  
  console.log('');
  console.log(chalk.gray('💡 Use --timeline to see chronological evolution'));
}


async function showTimelineView(gitRepo: any, filePath: string) {
  console.log(chalk.bold('📅 Chronological evolution:'));
  console.log('');
  
  const history = await gitRepo.getFileHistory(filePath);
  
  history.slice(0, 5).forEach((commit: any) => {
    const date = new Date(commit.date).toLocaleDateString();
    const author = commit.author.length > 20 ? commit.author.slice(0, 17) + '...' : commit.author;
    console.log(chalk.yellow(`${commit.hash.slice(0, 7)}`), 
                chalk.gray(`${date}`), 
                chalk.blue(`${author.padEnd(20)}`), 
                commit.message.slice(0, 50));
  });
  
  if (history.length > 5) {
    console.log(chalk.gray(`... and ${history.length - 5} more commits`));
  }
}

async function showDiffView(gitRepo: any, filePath: string, fromCommit: string) {
  console.log(chalk.bold(`📋 Changes since ${fromCommit}:`));
  console.log('');
  
  const diff = await gitRepo.getDiff(filePath, fromCommit);
  
  if (diff.trim()) {
    console.log(diff);
  } else {
    console.log(chalk.gray('No changes since specified commit'));
  }
}
