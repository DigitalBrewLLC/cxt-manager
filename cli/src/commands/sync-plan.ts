import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';

export const syncPlanCommand = new Command('sync-plan')
  .description('Sync plan.md for current branch (save current, restore for new branch)')
  .option('--silent', 'No output unless errors')
  .option('--create-if-missing', 'Create blank plan if branch has no saved plan')
  .option('--template <type>', 'Template style for new plans (blank/template)', undefined)
  .action(async (options) => {
    try {
      const manager = new ContextManager();

      // Check if initialized
      if (!await manager.isInitialized()) {
        if (!options.silent) {
          console.log(chalk.red('❌ cxt-manager not initialized'));
          console.log(chalk.yellow('💡 Run "cit init" to get started'));
        }
        process.exit(1);
        return;
      }

      // Execute sync
      const result = await manager.syncPlan({
        silent: options.silent,
        createIfMissing: options.createIfMissing !== false, // Default true
        template: options.template as 'blank' | 'template' | undefined
      });

      // Output results (unless silent)
      if (!options.silent) {
        if (result.previousBranch !== result.currentBranch) {
          console.log(chalk.blue(`🔄 Switched plan.md from '${result.previousBranch}' to '${result.currentBranch}'`));
        }

        if (result.restored) {
          console.log(chalk.green(`✅ Restored plan.md for branch '${result.currentBranch}'`));
        } else if (result.created) {
          console.log(chalk.green(`✅ Created new plan.md for branch '${result.currentBranch}'`));
          console.log(chalk.gray('💡 Edit plan.md to add implementation details for this branch'));
        } else {
          console.log(chalk.yellow(`⚠️  No saved plan found for branch '${result.currentBranch}'`));
          console.log(chalk.gray('💡 Use --create-if-missing to create a blank plan template'));
        }
      }

    } catch (error: any) {
      if (!options.silent) {
        // Handle specific error types with helpful messages
        if (error.message.includes('Not a Git repository')) {
          console.error(chalk.red('❌ Not a Git repository'));
          console.log(chalk.yellow('💡 Run "git init" to initialize a Git repository'));
          console.log(chalk.yellow('💡 Or run "cit init" which will initialize Git automatically'));
        } else if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
          console.error(chalk.red('❌ Permission denied'));
          console.log(chalk.yellow('💡 Check file system permissions'));
          console.log(chalk.yellow('💡 Ensure you have write access to .cxt/ directory'));
        } else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
          console.error(chalk.red('❌ .cxt/ folder not found'));
          console.log(chalk.yellow('💡 Run "cit init" to initialize CxtManager'));
        } else {
          console.error(chalk.red('❌ Failed to sync plan:'), error.message);
        }
        
        if (process.env.DEBUG) {
          console.error(error.stack);
        }
      }
      process.exit(1);
    }
  });

