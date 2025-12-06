import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager, StatusInfo } from '@cxtmanager/core';

export const statusCommand = new Command('status')
  .description('Show context file status and alignment health')
  .option('--detailed', 'Show detailed health report')
  .action(async (options) => {
    try {
      const manager = new ContextManager();
      
      // Check if initialized
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ CxtManager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      // Get status information
      const status: StatusInfo = await manager.status();
      
      // Get config for thresholds
      const config = await manager.getConfig();
      const thresholds = config.context?.template_thresholds || {
        well_populated: 30,
        mild_warning: 50,
        critical: 70
      };
      
      // Display Git status
      console.log(chalk.bold('📊 Git Status:'));
      if (status.gitStatus.staged.length > 0) {
        console.log(chalk.green('  Changes staged for commit:'));
        status.gitStatus.staged.forEach(file => {
          console.log(chalk.green(`    modified: ${file}`));
        });
      }
      
      if (status.gitStatus.modified.length > 0) {
        console.log(chalk.yellow('  Changes not staged for commit:'));
        status.gitStatus.modified.forEach(file => {
          console.log(chalk.yellow(`    modified: ${file}`));
        });
      }
      
      if (status.gitStatus.untracked.length > 0) {
        console.log(chalk.red('  Untracked files:'));
        status.gitStatus.untracked.forEach(file => {
          console.log(chalk.red(`    ${file}`));
        });
      }

      if (status.gitStatus.staged.length === 0 && 
          status.gitStatus.modified.length === 0 && 
          status.gitStatus.untracked.length === 0) {
        console.log(chalk.green('  Working tree clean'));
      }

      console.log('');

      // Display context health
      console.log(chalk.bold('🏥 Context Health:'));
      
      const healthIcon = status.health.overall === 'healthy' ? '🟢' : 
                         status.health.overall === 'warning' ? '🟡' : '🔴';
      
      console.log(`  ${healthIcon} Overall: ${status.health.overall}`);
      
      // Show alignment status
      if (options.detailed) {
        console.log('');
        console.log(chalk.bold('🔗 File Alignments:'));
        console.log(`  context.md ←→ plan.md     ${getAlignmentIcon(status.health.alignments.contextToPlan)}`);
        console.log(`  All ←→ guardrail.md       ${getAlignmentIcon(status.health.alignments.allToGuardrails)}`);
      }

      // Show issues if any
      if (status.health.issues.length > 0) {
        console.log('');
        console.log(chalk.bold('⚠️  Issues Found:'));
        status.health.issues.forEach((issue, index) => {
          const icon = issue.type === 'error' ? '❌' : '⚠️';
          console.log(`  ${icon} ${issue.file}: ${issue.message}`);
          if (issue.suggestion) {
            console.log(chalk.gray(`     💡 ${issue.suggestion}`));
          }
        });
      }

      // Show suggestions
      if (status.health.suggestions.length > 0) {
        console.log('');
        console.log(chalk.bold('💡 Suggestions:'));
        status.health.suggestions.forEach(suggestion => {
          console.log(`  ${suggestion}`);
        });
      }

      // Show context files status
      console.log('');
      console.log(chalk.bold('📁 Context Files:'));
      const suggestions: string[] = [];
      
      status.contextFiles.forEach((file: StatusInfo['contextFiles'][0]) => {
        const statusIcon = file.status === 'clean' ? '✅' : 
                          file.status === 'modified' ? '📝' : 
                          file.status === 'new' ? '🆕' : '❌';
        const stagedText = file.staged ? chalk.green(' (staged)') : '';
        
        // Show content status
        let contentIcon = '';
        let contentText = '';
        const contentStatus = file.contentStatus;
        const templatePercentage = file.templatePercentage;
        const fileSize = file.size;
        
        // Graduated warning system with configurable thresholds
        const WELL_POPULATED = thresholds.well_populated;
        const MILD_WARNING = thresholds.mild_warning;
        const CRITICAL = thresholds.critical;
        
        const percentage = templatePercentage ?? 0;
        
        if (contentStatus === 'empty') {
          contentIcon = '📭';
          contentText = chalk.red(' (empty - 100% template)');
          suggestions.push(`${file.file} is empty. Consider populating it with relevant information.`);
        } else if (contentStatus === 'template-only' || percentage >= CRITICAL) {
          // Critical: 70%+ template
          contentIcon = '🔴';
          if (percentage >= 90) {
            contentText = chalk.red(` (${percentage}% template)`);
          } else {
            contentText = chalk.red(` (${percentage}% template)`);
          }
          suggestions.push(`🔴 ${file.file} is ${percentage}% template content and needs significant work.`);
        } else if (percentage >= MILD_WARNING) {
          // Warning: 50-70% template
          contentIcon = '⚠️';
          contentText = chalk.yellow(` (${percentage}% template)`);
          suggestions.push(`⚠️  ${file.file} is ${percentage}% template content. Consider adding more project-specific information.`);
        } else if (percentage > WELL_POPULATED) {
          // Mild suggestion: 30-50% template
          contentIcon = '💡';
          contentText = chalk.blue(` (${percentage}% template)`);
          suggestions.push(`💡 ${file.file} is ${percentage}% template content. Consider adding more content.`);
        } else if (percentage > 0 && percentage <= WELL_POPULATED) {
          // Well populated: <= 30% template - show positive feedback
          contentIcon = '✅';
          contentText = chalk.green(` (${percentage}% template - well populated!)`);
        }
        
        const sizeText = fileSize !== undefined ? chalk.gray(` (${(fileSize / 1024).toFixed(1)} KB)`) : '';
        console.log(`  ${statusIcon} ${contentIcon} ${file.file}${stagedText}${contentText}${sizeText}`);
      });

      // Show suggestions if any
      if (suggestions.length > 0) {
        console.log('');
        console.log(chalk.bold('💡 Suggestions:'));
        suggestions.forEach(suggestion => {
          console.log(chalk.yellow(`  • ${suggestion}`));
        });
        console.log('');
        console.log(chalk.gray('💡 TIP: Edit the context files to add project-specific information.'));
        console.log(chalk.gray('   AI tools can read these files to better understand your project.'));
      }

      console.log('');
      console.log(chalk.gray(`Last health check: ${status.health.lastChecked.toLocaleString()}`));

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
        console.error(chalk.red('❌ .cxt/ folder not found'));
        console.log(chalk.yellow('💡 Run "cit init" to initialize CxtManager'));
      } else {
        console.error(chalk.red('❌ Failed to get status:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

function getAlignmentIcon(alignment: string): string {
  switch (alignment) {
    case 'aligned': return '✅ Aligned';
    case 'warning': return '⚠️  Warning';
    case 'conflict': return '🔴 Conflict';
    default: return '❓ Unknown';
  }
} 