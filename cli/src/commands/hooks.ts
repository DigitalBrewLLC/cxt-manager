import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ContextManager, GitHooksManager } from '@cxtmanager/core';

export const hooksCommand = new Command('hooks')
  .description('Manage git hooks for CxtManager')
  .action(async () => {
    // Show help if no subcommand
    hooksCommand.help();
  });

const installCommand = new Command('install')
  .description('Install git hooks for CxtManager')
  .action(async () => {
    const spinner = ora({ text: 'Installing git hooks...', spinner: 'dots' }).start();
    
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        spinner.fail(chalk.red('CxtManager not initialized.'));
        console.log(chalk.yellow('💡 Run "cit init" to get started.'));
        process.exit(1);
      }

      const config = await manager.getConfig();
      
      if (!config.git_integration?.enabled) {
        spinner.fail(chalk.red('Git integration is disabled in .cxt/.cxtconfig.json'));
        console.log(chalk.yellow('💡 Enable it by setting "git_integration.enabled" to true'));
        process.exit(1);
      }

      const hooksManager = new GitHooksManager(process.cwd(), config);
      await hooksManager.installHooks();
      
      const installedHooks = await hooksManager.getInstalledHooks();
      
      spinner.succeed(chalk.green(`Git hooks installed successfully!`));
      console.log('');
      console.log(chalk.bold('📋 Installed hooks:'));
      installedHooks.forEach(hook => {
        console.log(chalk.green(`   ✅ ${hook}`));
      });
      console.log('');
      console.log(chalk.gray('💡 Hooks will run automatically on git operations'));
      console.log(chalk.gray('   To remove: cit hooks remove'));

    } catch (error: any) {
      spinner.fail(chalk.red('Failed to install git hooks'));
      
      // Handle specific error types with helpful messages
      if (error.message.includes('Not a Git repository')) {
        console.error(chalk.red('❌ Not a Git repository'));
        console.log(chalk.yellow('💡 Run "git init" to initialize a Git repository'));
        console.log(chalk.yellow('💡 Or run "cit init" which will initialize Git automatically'));
      } else if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
        console.error(chalk.red('❌ Permission denied'));
        console.log(chalk.yellow('💡 Check file system permissions'));
        console.log(chalk.yellow('💡 Ensure you have write access to .git/hooks/ directory'));
      } else {
        console.error(chalk.red('❌'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

const removeCommand = new Command('remove')
  .description('Remove CxtManager git hooks')
  .action(async () => {
    const spinner = ora({ text: 'Removing git hooks...', spinner: 'dots' }).start();
    
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        spinner.fail(chalk.red('CxtManager not initialized.'));
        console.log(chalk.yellow('💡 Run "cit init" to get started.'));
        process.exit(1);
      }

      const config = await manager.getConfig();
      const hooksManager = new GitHooksManager(process.cwd(), config);
      
      const installedHooks = await hooksManager.getInstalledHooks();
      
      if (installedHooks.length === 0) {
        spinner.info(chalk.yellow('No CxtManager hooks found'));
        return;
      }

      await hooksManager.removeHooks();
      
      spinner.succeed(chalk.green(`Git hooks removed successfully!`));
      console.log('');
      console.log(chalk.gray(`Removed ${installedHooks.length} hook(s)`));

    } catch (error: any) {
      spinner.fail(chalk.red('Failed to remove git hooks'));
      
      // Handle specific error types with helpful messages
      if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
        console.error(chalk.red('❌ Permission denied'));
        console.log(chalk.yellow('💡 Check file system permissions'));
        console.log(chalk.yellow('💡 Ensure you have write access to .git/hooks/ directory'));
      } else {
        console.error(chalk.red('❌'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

const statusCommand = new Command('status')
  .description('Show git hook installation status')
  .action(async () => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ CxtManager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        process.exit(1);
      }

      const config = await manager.getConfig();
      const hooksManager = new GitHooksManager(process.cwd(), config);
      
      const installedHooks = await hooksManager.getInstalledHooks();
      const areInstalled = await hooksManager.areHooksInstalled();
      
      console.log(chalk.bold('🔗 Git Hooks Status'));
      console.log('');
      
      if (!config.git_integration?.enabled) {
        console.log(chalk.yellow('⚠️  Git integration is disabled'));
        console.log(chalk.gray('   Enable it in .cxt/.cxtconfig.json'));
        return;
      }

      if (areInstalled && installedHooks.length > 0) {
        console.log(chalk.green('✅ Git hooks are installed'));
        console.log('');
        console.log(chalk.bold('📋 Installed hooks:'));
        installedHooks.forEach(hook => {
          console.log(chalk.green(`   ✅ ${hook}`));
        });
        console.log('');
        console.log(chalk.gray('💡 Hooks run automatically on git operations'));
      } else {
        console.log(chalk.yellow('⚠️  Git hooks are not installed'));
        console.log('');
        console.log(chalk.gray('💡 Install with: cit hooks install'));
      }

      } catch (error: any) {
        // Handle specific error types with helpful messages
        if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
          console.error(chalk.red('❌ Permission denied'));
          console.log(chalk.yellow('💡 Check file system permissions'));
          console.log(chalk.yellow('💡 Ensure you have read access to .git/hooks/ directory'));
        } else {
          console.error(chalk.red('❌ Failed to check hook status:'), error.message);
        }
        
        if (process.env.DEBUG) {
          console.error(error.stack);
        }
        process.exit(1);
      }
  });

// Register subcommands
hooksCommand.addCommand(installCommand);
hooksCommand.addCommand(removeCommand);
hooksCommand.addCommand(statusCommand);

