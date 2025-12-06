import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';

export const syncGitignoreCommand = new Command('sync-gitignore')
  .description('Sync .gitignore with track_in_git setting from config')
  .action(async () => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.error(chalk.red('❌ CxtManager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" first'));
        return;
      }

      console.log(chalk.cyan('🔄 Syncing .gitignore with configuration...'));
      await (manager as any).syncGitignore();
      console.log(chalk.green('✅ .gitignore updated successfully'));
      console.log(chalk.gray('💡 If files were previously tracked, you may need to run: git rm --cached -r .cxt/'));
    } catch (error: any) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      if (error.message.includes('not initialized')) {
        console.log(chalk.yellow('💡 Run "cit init" first'));
      }
      process.exit(1);
    }
  });

