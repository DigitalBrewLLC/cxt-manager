import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ContextManager } from '@cxtmanager/core';

export const checkoutCommand = new Command('checkout')
  .description('Revert context files to previous state')
  .argument('<commit>', 'Commit hash or reference (HEAD~1, HEAD~2, etc.)')
  .option('--force', 'Force checkout without confirmation')
  .action(async (commit, options) => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ cxt-manager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      // Validate the commit exists
      const gitRepo = (manager as any).gitRepo;
      
      // Check for uncommitted changes
      const status = await gitRepo.getStatus();
      const hasChanges = status.staged.length > 0 || status.modified.length > 0;
      
      if (hasChanges && !options.force) {
        console.log(chalk.yellow('⚠️  You have uncommitted changes in context files:'));
        
        if (status.staged.length > 0) {
          console.log(chalk.green('  Staged:'));
          status.staged.forEach((file: string) => {
            console.log(chalk.green(`    ${file}`));
          });
        }
        
        if (status.modified.length > 0) {
          console.log(chalk.yellow('  Modified:'));
          status.modified.forEach((file: string) => {
            console.log(chalk.yellow(`    ${file}`));
          });
        }
        
        console.log('');
        const proceed = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Commit changes first', value: 'commit' },
              { name: 'Stash changes and checkout', value: 'stash' },
              { name: 'Discard changes and checkout', value: 'discard' },
              { name: 'Cancel', value: 'cancel' }
            ]
          }
        ]);
        
        switch (proceed.action) {
          case 'commit':
            console.log(chalk.blue('💡 Please commit your changes first with "cit commit"'));
            return;
          case 'stash':
            // In a real implementation, we'd implement stashing
            console.log(chalk.yellow('💡 Stashing not yet implemented. Please commit or use --force'));
            return;
          case 'discard':
            break; // Continue with checkout
          case 'cancel':
            console.log(chalk.gray('Checkout cancelled'));
            return;
        }
      }

      // Show what we're about to do
      console.log(chalk.blue(`🔄 Checking out context files to ${commit}...`));
      
      // Confirm the operation unless forced
      if (!options.force) {
        const confirm = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: `This will revert your context files to ${commit}. Continue?`,
            default: false
          }
        ]);
        
        if (!confirm.proceed) {
          console.log(chalk.gray('Checkout cancelled'));
          return;
        }
      }

      // Perform the checkout for context files only
      const contextFiles = ['.cxt/context.md', '.cxt/plan.md', '.cxt/guardrail.md'];
      
      try {
        for (const file of contextFiles) {
          await gitRepo.git.checkout([commit, '--', file]);
        }
        
        console.log(chalk.green('✅ Context files reverted successfully'));
        console.log(chalk.gray(`📝 Context now matches state at ${commit}`));
        
        // Show what changed
        console.log('');
        console.log(chalk.bold('📁 Reverted files:'));
        contextFiles.forEach(file => {
          console.log(chalk.blue(`  ${file}`));
        });
        
        // Recommend validation
        console.log('');
        console.log(chalk.blue('💡 Run "cit validate" to check context health after revert'));
        
      } catch (gitError: any) { // TODO: Properly type error instead of using any
        if (gitError.message.includes('did not match any file(s) known to git') || 
            gitError.message.includes('fatal: ambiguous argument') ||
            gitError.message.includes('unknown revision')) {
          console.log(chalk.red(`❌ Commit ${commit} not found`));
          console.log(chalk.yellow('💡 Use "cit log" to see available commits'));
          console.log(chalk.yellow('💡 Valid formats: commit hash, HEAD~1, HEAD~2, branch name'));
          return;
        } else {
          throw gitError;
        }
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
        console.log(chalk.yellow('💡 Ensure you have write access to .git/ directory'));
      } else {
        console.error(chalk.red('❌ Checkout failed:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }); 