import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';

export const autoHealCommand = new Command('auto-heal')
  .description('Automatically fix context alignment issues')
  .option('--dry-run', 'Preview fixes without applying them')
  .option('--if-needed', 'Only run if issues are detected (for git hooks)')
  .option('--silent', 'No output unless fixes are applied (for git hooks)')
  .action(async (options) => {
    try {
      const manager = new ContextManager();
      
      if (!await manager.isInitialized()) {
        if (!options.silent) {
          console.log(chalk.red('❌ CxtManager not initialized'));
          console.log(chalk.yellow('💡 Run "cit init" to get started'));
        }
        process.exit(1);
        return;
      }

      const dryRun = options.dryRun || false;
      const ifNeeded = options.ifNeeded || false;
      const silent = options.silent || false;
      
      // If --if-needed, check health first
      if (ifNeeded) {
        const health = await manager.validate(true); // Quick validation
        const hasAutoFixableIssues = health.issues.some(i => i.autoFixable);
        
        if (!hasAutoFixableIssues) {
          // No issues to fix, exit silently
          if (!silent) {
            console.log(chalk.green('✅ No fixes needed - all context files are aligned!'));
          }
          return;
        }
      }

      if (!silent) {
        console.log(chalk.blue(`🔧 ${dryRun ? 'Previewing' : 'Applying'} auto-heal fixes...`));
        console.log('');
      }

      const fixes = await manager.autoHeal(dryRun);
      
      if (fixes.length === 0) {
        if (!silent) {
          console.log(chalk.green('✅ No fixes needed - all context files are aligned!'));
        }
        return;
      }

      if (!silent) {
        console.log(chalk.bold(`${dryRun ? '📋 Would make these changes:' : '✅ Applied fixes:'}`));
        fixes.forEach((fix, index) => {
          const prefix = index === fixes.length - 1 ? '└──' : '├──';
          console.log(`${prefix} ${fix}`);
        });
        console.log('');

        if (dryRun) {
          console.log(chalk.blue('💡 Run without --dry-run to apply these fixes'));
        } else {
          console.log(chalk.green('🎉 Auto-heal completed successfully!'));
          console.log(chalk.gray('📝 Changes have been committed to Git'));
          console.log('');
          console.log(chalk.blue('💡 Run "cit validate" to verify all issues are resolved'));
        }
      } else if (fixes.length > 0 && !dryRun) {
        // Silent mode but fixes were applied - show minimal output
        console.log(chalk.green(`✅ Auto-healed ${fixes.length} issue(s)`));
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
        console.log(chalk.yellow('💡 Ensure you have write access to .cxt/ directory'));
      } else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        console.error(chalk.red('❌ .cxt/ folder not found'));
        console.log(chalk.yellow('💡 Run "cit init" to initialize CxtManager'));
      } else {
        console.error(chalk.red('❌ Auto-heal failed:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }); 