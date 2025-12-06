import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { ContextManager, InitOptions, GitHooksManager } from '@cxtmanager/core';

export const initCommand = new Command('init')
  .description('Initialize CxtManager in current project (like git init)')
  .option('--manual', 'Create empty templates for full user control')
  .option('--minimal', 'Basic setup with minimal content')
  .action(async (options) => {
    try {
      const manager = new ContextManager();
      
      // Check if already initialized
      if (await manager.isInitialized()) {
        console.log(chalk.red('❌ CxtManager already initialized'));
        console.log(chalk.yellow('💡 Use "cit status" to check current state'));
        return;
      }

      // Question 1: Template Style
      let mode: InitOptions['mode'] = 'auto';
      if (!options.manual && !options.minimal) {
        console.log('');
        console.log(chalk.bold('📝 How would you like to initialize your context files?'));
        console.log('');
        const templateAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'templateStyle',
            message: 'Choose an option:',
            choices: [
              {
                name: '1) Auto (Recommended) - Analyzes your project and suggests relevant sections',
                value: 'auto',
                short: 'Auto'
              },
              {
                name: '2) Minimal - Creates basic structure with minimal content',
                value: 'auto', // minimal maps to auto mode
                short: 'Minimal'
              },
              {
                name: '3) Manual - Creates empty templates with guidance comments',
                value: 'manual',
                short: 'Manual'
              }
            ],
            default: 0
          }
        ]);
        console.log('');
        mode = templateAnswer.templateStyle;
      } else {
        mode = determineInitMode(options);
      }

      const initOptions: InitOptions = {
        mode
      };

      // Question 2: Git Hooks
      let installHooks = true;
      const hooksPath = path.join(process.cwd(), '.git', 'hooks');
      let hasExistingHooks = false;
      
      if (existsSync(hooksPath)) {
        try {
          const hookFiles = await fs.readdir(hooksPath);
          hasExistingHooks = hookFiles.some((file: string) => {
            return !file.endsWith('.sample') && 
                   (file === 'post-checkout' || file === 'pre-commit' || file === 'post-merge');
          });
        } catch (error) {
          // If we can't read the directory, assume no existing hooks
          hasExistingHooks = false;
        }
      }

      console.log('');
      console.log(chalk.bold('🔗 Git Hooks Installation'));
      console.log('');
      if (hasExistingHooks) {
        console.log(chalk.yellow('  ⚠️  Existing git hooks detected in .git/hooks/'));
        console.log('');
        console.log('  CxtManager can add its hooks alongside your existing ones:');
        console.log('  • Switch plan.md when you change branches');
        console.log('  • Validate context files before commits');
        console.log('  • Auto-heal alignment issues after merges');
        console.log('');
        console.log('  Your existing hooks will continue to work.');
        console.log('');
        const hooksAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'installHooks',
            message: 'Add CxtManager hooks?',
            default: true
          }
        ]);
        installHooks = hooksAnswer.installHooks;
      } else {
        console.log('  CxtManager can automatically:');
        console.log('  • Switch plan.md when you change branches');
        console.log('  • Validate context files before commits');
        console.log('  • Auto-heal alignment issues after merges');
        console.log('');
        const hooksAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'installHooks',
            message: 'Install git hooks?',
            default: true
          }
        ]);
        installHooks = hooksAnswer.installHooks;
      }
      console.log('');

      // Question 3: Update Mode
      console.log('');
      console.log(chalk.bold('🤖 Context Update Mode'));
      console.log('');
      console.log('  How should CxtManager handle context file updates?');
      console.log('');
      let updateMode: 'auto' | 'manual' = 'manual';
      const updateAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'updateMode',
          message: 'Choose an option:',
          choices: [
            {
              name: '1) Manual (Recommended) - Shows warnings, you decide when to update',
              value: 'manual',
              short: 'Manual'
            },
            {
              name: '2) Auto - AI tool updates automatically, you review changes',
              value: 'auto',
              short: 'Auto'
            }
          ],
          default: 0
        }
      ]);
      updateMode = updateAnswer.updateMode;
      console.log('');
      
      // Show additional info about the chosen mode
      if (updateMode === 'manual') {
        console.log(chalk.gray('  💡 Manual mode: Shows warnings when context files are out of sync'));
        console.log(chalk.gray('     You (and/or AI) decide when to update (via \'cit status\' warnings)'));
        console.log(chalk.gray('     You review all changes before committing'));
        console.log(chalk.gray('     Best for: Teams, critical projects, full control'));
      } else {
        console.log(chalk.gray('  💡 Auto mode: Detects drift and notifies your AI tool'));
        console.log(chalk.gray('     AI tool updates context files automatically'));
        console.log(chalk.gray('     Changes appear in editor for you to review/accept'));
        console.log(chalk.gray('     Best for: Solo dev, AI-driven workflows, rapid iteration'));
      }
      console.log('');
      console.log(chalk.gray('  💡 You can change this later in .cxt/.cxtconfig.json'));
      console.log('');

      // Question 4: Track in Git
      console.log('');
      console.log(chalk.bold('🔒 Privacy & Git Tracking'));
      console.log('');
      console.log('  Should .cxt/ folder be tracked in Git?');
      console.log('');
      console.log('  • Tracked (Recommended): Share context with team via Git');
      console.log('  • Private: Keep context local, add .cxt/ to .gitignore');
      console.log('');
      const trackAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'trackInGit',
          message: 'Choose an option:',
          choices: [
            {
              name: '1) Tracked (Recommended) - Share context with team',
              value: true,
              short: 'Tracked'
            },
            {
              name: '2) Private - Keep context local only',
              value: false,
              short: 'Private'
            }
          ],
          default: 0
        }
      ]);
      console.log('');
      
      if (trackAnswer.trackInGit) {
        console.log(chalk.gray('  💡 Context files will be committed to Git for team sharing'));
      } else {
        console.log(chalk.gray('  💡 Context files will be added to .gitignore (private)'));
      }
      console.log('');
      console.log(chalk.gray('  💡 You can change this later in .cxt/.cxtconfig.json'));
      console.log('');

      const spinner = ora('Initializing CxtManager...').start();
      spinner.text = `Initializing with mode: ${mode}`;

      // Add trackInGit to init options
      initOptions.trackInGit = trackAnswer.trackInGit;

      // Execute initialization
      await manager.init(initOptions);
      
      // Update config with user's choices
      const config = await manager.getConfig();
      const configPath = path.join(process.cwd(), '.cxt', '.cxtconfig.json');
      
      if (config.context) {
        config.context.update_mode = updateMode;
        config.context.drift_detection = true;
      }
      
      if (installHooks && config.git_integration) {
        config.git_integration.enabled = true;
        config.git_integration.auto_install_hooks = true;
      } else if (!installHooks && config.git_integration) {
        config.git_integration.enabled = false;
        config.git_integration.auto_install_hooks = false;
      }
      
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      
      // Install git hooks if user chose to
      let hooksInstalled = false;
      if (installHooks) {
        try {
          const hooksManager = new GitHooksManager(process.cwd(), config);
          await hooksManager.installHooks();
          
          const installedHooks = await hooksManager.getInstalledHooks();
          if (installedHooks.length > 0) {
            hooksInstalled = true;
            if (hasExistingHooks) {
              spinner.succeed('CxtManager initialized successfully! Git hooks added to existing hooks');
            } else {
              spinner.succeed(`CxtManager initialized successfully! Git hooks installed (${installedHooks.join(', ')})`);
            }
          } else {
            spinner.succeed('CxtManager initialized successfully!');
          }
        } catch (error: any) {
          // Don't fail init if hooks fail to install
          spinner.succeed('CxtManager initialized successfully!');
          console.log(chalk.yellow(`⚠️  Warning: Could not install git hooks: ${error.message}`));
          console.log(chalk.gray('   You can install them manually with: cit hooks install'));
        }
      } else {
        spinner.succeed('CxtManager initialized successfully!');
      }
      
      // Show next steps
      console.log('');
      console.log(chalk.green('✅ Your project now has AI context management!'));
      console.log('');
      console.log(chalk.bold('📁 Context files created:'));
      console.log(chalk.gray('   .cxt/context.md      - Project background & goals (STABLE - same across branches)'));
      console.log(chalk.gray('   .cxt/plan.md         - Architecture & roadmap (BRANCH-SPECIFIC - changes per branch)'));
      console.log(chalk.gray('   .cxt/guardrail.md    - Rules & constraints (STABLE - same across branches)'));
      console.log(chalk.gray('   .cxt/.cxtconfig.json - Configuration'));
      console.log('');
      console.log(chalk.bold('💡 What to do next:'));
      console.log(chalk.cyan('   1. Edit .cxt/context.md with your project\'s purpose and goals'));
      console.log(chalk.cyan('   2. Edit .cxt/plan.md with your implementation approach'));
      console.log(chalk.cyan('   3. Edit .cxt/guardrail.md with your project constraints'));
      if (hooksInstalled) {
        console.log(chalk.cyan('   4. When you create a feature branch, plan.md will switch automatically'));
      } else {
        console.log(chalk.cyan('   4. Run "cit hooks install" to enable automatic plan.md switching on branch changes'));
      }
      console.log('');
      console.log(chalk.bold('🤖 For AI tools:'));
      console.log(chalk.gray('   • AI should read these files to understand your project'));
      console.log(chalk.gray('   • AI can update plan.md as implementation progresses'));
      console.log(chalk.gray('   • Changes are automatically tracked with attribution'));
      console.log('');
      console.log(chalk.bold('🚀 Useful commands:'));
      console.log(chalk.yellow('   cit status           - Check context health and see what needs attention'));
      console.log(chalk.yellow('   cit validate         - Verify file alignment'));
      console.log(chalk.yellow('   cit log              - View context file history'));
      
      if (mode === 'manual') {
        console.log(chalk.yellow('   cit auto-heal        - Auto-fix any issues'));
        console.log('');
        console.log(chalk.blue('💡 The context files contain helpful comments explaining what to fill in.'));
        console.log(chalk.blue('   Edit them to document your project - CxtManager manages the files, you provide the content.'));
      } else {
        console.log('');
        console.log(chalk.blue('💡 Review and edit the generated context files.'));
        console.log(chalk.blue('   The files contain template content - customize them with your project details.'));
      }

    } catch (error: any) { // TODO: Properly type error instead of using any
      ora().fail('Failed to initialize CxtManager');
      console.error(chalk.red('❌'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

function determineInitMode(options: any): InitOptions['mode'] {
  if (options.manual) return 'manual';
  if (options.minimal) return 'auto';
  
  // Default mode
  return 'auto';
} 