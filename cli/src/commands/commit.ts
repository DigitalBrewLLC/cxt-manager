import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ContextManager } from '@cxtmanager/core';

export const commitCommand = new Command('commit')
  .description('Commit context file changes with smart prompts')
  .option('-m, --message <message>', 'Commit message')
  .option('--no-verify', 'Skip validation before commit')
  .action(async (options) => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ CxtManager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      // Get commit message
      let message = options.message;
      if (!message) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: 'Commit message:',
            validate: (input) => input.trim().length > 0 || 'Please enter a commit message'
          }
        ]);
        message = answers.message;
      }

      // Validate context alignment before commit (unless --no-verify)
      if (options.verify !== false) {
        console.log(chalk.blue('🔍 Validating context alignment before commit...'));
        const health = await manager.validate();
        
        if (health.overall === 'error') {
          console.log(chalk.red('❌ Context validation failed'));
          console.log(chalk.yellow('💡 Run "cit validate" to see issues or use --no-verify to skip'));
          return;
        }
        
        if (health.overall === 'warning') {
          console.log(chalk.yellow('⚠️  Context validation has warnings'));
          const proceed = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'continue',
              message: 'Continue with commit anyway?',
              default: true
            }
          ]);
          
          if (!proceed.continue) {
            console.log(chalk.gray('Commit cancelled'));
            return;
          }
        }
      }

      // Perform the commit
      const gitRepo = (manager as any).gitRepo;
      await gitRepo.git.commit(message);
      
      console.log(chalk.green('✅ Committed changes successfully'));
      console.log(chalk.gray(`📝 ${message}`));

      // Smart prompts for related files
      const status = await manager.status();
      const unstagedContextFiles = status.contextFiles
        .filter(f => f.status === 'modified' && !f.staged)
        .map(f => f.file);

      if (unstagedContextFiles.length > 0) {
        console.log('');
        console.log(chalk.yellow('💡 Related files may need updates:'));
        unstagedContextFiles.forEach(file => {
          console.log(chalk.yellow(`   ${file} - consider updating based on your changes`));
        });
        
        const askStage = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'stage',
            message: 'Stage and commit related files now?',
            default: false
          }
        ]);
        
        if (askStage.stage) {
          await gitRepo.git.add(unstagedContextFiles.map(f => `.cxt/${f}`));
          const relatedMessage = `Update related context files

Related to: ${message}`;
          await gitRepo.git.commit(relatedMessage);
          console.log(chalk.green('✅ Related files committed'));
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
      } else if (error.message.includes('nothing to commit')) {
        console.log(chalk.yellow('⚠️  Nothing to commit'));
        console.log(chalk.gray('💡 No changes staged for commit'));
        console.log(chalk.gray('💡 Use "cit add" to stage changes first'));
      } else if (error.message.includes('no changes added to commit')) {
        console.log(chalk.yellow('⚠️  No changes staged for commit'));
        console.log(chalk.gray('💡 Use "cit add" to stage changes first'));
      } else {
        console.error(chalk.red('❌ Commit failed:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }); 