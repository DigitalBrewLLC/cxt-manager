import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';

export const addCommand = new Command('add')
  .description('Stage context file changes')
  .argument('[files...]', 'Context files to stage (default: all modified files)')
  .action(async (files) => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ CxtManager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      // If no files specified, stage all modified context files
      const filesToAdd = files.length > 0 ? files : ['.cxt/'];
      
      // Validate file paths if specified
      if (files.length > 0) {
        const fs = require('fs');
        const path = require('path');
        for (const file of files) {
          const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
          if (!fs.existsSync(fullPath)) {
            console.log(chalk.red(`❌ File not found: ${file}`));
            console.log(chalk.yellow('💡 Make sure the file path is correct'));
            return;
          }
          // Warn if trying to add files outside .cxt/ (but allow it)
          if (!file.startsWith('.cxt/') && !file.startsWith('.cxt\\')) {
            console.log(chalk.yellow(`⚠️  Warning: ${file} is outside .cxt/ directory`));
          }
        }
      }
      
      console.log(chalk.blue('📋 Staging context files...'));
      
      // Use the GitRepository from core to add files
      const gitRepo = (manager as any).gitRepo;
      await gitRepo.git.add(filesToAdd);
      
      console.log(chalk.green('✅ Context files staged successfully'));
      
      // Show what was staged
      const status = await gitRepo.getStatus();
      if (status.staged.length > 0) {
        console.log('');
        console.log(chalk.bold('📁 Staged files:'));
        status.staged.forEach((file: string) => {
          console.log(chalk.green(`   ${file}`));
        });
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
      } else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        console.error(chalk.red('❌ File or directory not found'));
        console.log(chalk.yellow('💡 Make sure the file path is correct'));
        console.log(chalk.yellow('💡 Ensure .cxt/ folder exists (run "cit init" if needed)'));
      } else {
        console.error(chalk.red('❌ Failed to stage files:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }); 