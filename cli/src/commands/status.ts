import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';
import type { StatusInfo } from '@cxtmanager/core';

export const statusCommand = new Command('status')
  .description('Show context file status and health')
  .option('--detailed', 'Show detailed health report')
  .action(async (options) => {
    try {
      const manager = new ContextManager();
      
      // Check if initialized
      if (!await manager.isInitialized()) {
        console.log(chalk.red('❌ cxt-manager not initialized'));
        console.log(chalk.yellow('💡 Run "cit init" to get started'));
        return;
      }

      // Get status information
      const status: StatusInfo = await manager.status();
      
      // Get config for content quality thresholds
      const config = await manager.getConfig();
      const thresholds = config.context?.content_quality || {
        min_content_length: 100,
        min_content_lines: 3,
        empty_section_warning: true,
        short_content_warning: 200
      };
      
      // Display Git status
      console.log(chalk.bold('📊 Git Status:'));
      if (status.gitStatus.staged.length > 0) {
        console.log(chalk.green('  Changes staged for commit:'));
        status.gitStatus.staged.forEach((file: string) => {
          console.log(chalk.green(`    modified: ${file}`));
        });
      }
      
      if (status.gitStatus.modified.length > 0) {
        console.log(chalk.yellow('  Changes not staged for commit:'));
        status.gitStatus.modified.forEach((file: string) => {
          console.log(chalk.yellow(`    modified: ${file}`));
        });
      }
      
      if (status.gitStatus.untracked.length > 0) {
        console.log(chalk.red('  Untracked files:'));
        status.gitStatus.untracked.forEach((file: string) => {
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
      
      // Show issues if any
      if (status.health.issues.length > 0) {
        console.log('');
        console.log(chalk.bold('⚠️  Issues Found:'));
        status.health.issues.forEach((issue: StatusInfo['health']['issues'][number], index: number) => {
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
        status.health.suggestions.forEach((suggestion: string) => {
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
        const contentQuality = file.contentQuality;
        const fileSize = file.size;
        
        if (contentStatus === 'empty') {
          contentIcon = '📭';
          contentText = chalk.red(' (empty)');
          suggestions.push(`${file.file} is empty. Consider populating it with relevant information.`);
        } else if (contentStatus === 'short') {
          // Short content - below minimum thresholds
          contentIcon = '⚠️';
          const length = contentQuality?.contentLength ?? 0;
          const lines = contentQuality?.contentLines ?? 0;
          contentText = chalk.yellow(` (short: ${length} chars, ${lines} lines)`);
          suggestions.push(`⚠️  ${file.file} has very little content (${length} chars, ${lines} lines). Minimum recommended: ${thresholds.min_content_length} chars, ${thresholds.min_content_lines} lines.`);
        } else if (contentQuality && contentQuality.contentLength < thresholds.short_content_warning) {
          // Populated but relatively short - use config threshold
          contentIcon = '💡';
          contentText = chalk.blue(` (${contentQuality.contentLength} chars)`);
          suggestions.push(`💡 ${file.file} could use more content (currently ${contentQuality.contentLength} chars).`);
        } else {
          // Well populated
          contentIcon = '✅';
          if (contentQuality) {
            contentText = chalk.green(` (${contentQuality.contentLength} chars, ${contentQuality.contentLines} lines)`);
          }
        }
        
        // Show empty sections warning if applicable
        if (contentQuality?.emptySections && contentQuality.emptySections > 0) {
          contentText += chalk.yellow(` [${contentQuality.emptySections} empty section${contentQuality.emptySections > 1 ? 's' : ''}]`);
          suggestions.push(`💡 ${file.file} has ${contentQuality.emptySections} empty section${contentQuality.emptySections > 1 ? 's' : ''}. Consider filling them in.`);
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
        console.log(chalk.yellow('💡 Run "cit init" to initialize cxt-manager'));
      } else {
        console.error(chalk.red('❌ Failed to get status:'), error.message);
      }
      
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }); 