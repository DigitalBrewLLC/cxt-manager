import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';
import type { HealthIssue, HealthStatus } from '@cxtmanager/core';

export const validateCommand = new Command('validate')
  .description('Validate context file alignment and consistency')
  .option('--detailed', 'Show detailed validation report')
  .option('--quick', 'Quick validation (faster, less thorough)')
  .option('--silent', 'No output unless errors (for git hooks)')
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

      if (!options.silent) {
        console.log(chalk.blue('🔍 Validating context file alignment...'));
        console.log('');
      }

      const health = await manager.validate(options.quick);
      
      // In silent mode, only show errors
      if (options.silent) {
        const hasErrors = health.issues.some((i: HealthIssue) => i.type === 'error');
        if (hasErrors) {
          console.error(chalk.red('❌ Context validation failed'));
          console.error(chalk.yellow('💡 Run "cit status" to see details'));
          process.exit(1);
        }
        // No errors, exit silently
        return;
      }
      
      // Overall health status
      const healthIcon = health.overall === 'healthy' ? '🟢' : 
                         health.overall === 'warning' ? '🟡' : '🔴';
      
      console.log(chalk.bold(`${healthIcon} Overall Health: ${health.overall.toUpperCase()}`));
      console.log('');

      // Detailed alignment status
      if (options.detailed || health.overall !== 'healthy') {
        console.log(chalk.bold('🔗 Context File Alignments:'));
        console.log(`├── context.md ←→ plan.md     ${getDetailedAlignmentStatus(health.alignments.contextToPlan)}`);
        console.log(`└── All ←→ guardrail.md       ${getDetailedAlignmentStatus(health.alignments.allToGuardrails)}`);
        console.log('');
      }

      // Show issues
      if (health.issues.length > 0) {
        console.log(chalk.bold('⚠️  Issues Found:'));
        health.issues.forEach((issue: HealthIssue, index: number) => {
          const icon = issue.type === 'error' ? '❌' : '⚠️';
          const prefix = index === health.issues.length - 1 ? '└──' : '├──';
          
          console.log(`${prefix} ${icon} ${chalk.bold(issue.file)}`);
          console.log(`    ${issue.message}`);
          
          if (issue.line) {
            console.log(chalk.gray(`    Line ${issue.line}`));
          }
          
          if (issue.suggestion) {
            console.log(chalk.blue(`    💡 ${issue.suggestion}`));
          }
          
          if (issue.autoFixable) {
            console.log(chalk.green(`    🔧 Auto-fixable`));
          }
          
          if (index < health.issues.length - 1) {
            console.log('│');
          }
        });
        console.log('');
      }

      // Show suggestions
      if (health.suggestions.length > 0) {
        console.log(chalk.bold('💡 Recommendations:'));
        health.suggestions.forEach((suggestion: string, index: number) => {
          const prefix = index === health.suggestions.length - 1 ? '└──' : '├──';
          console.log(`${prefix} ${suggestion}`);
        });
        console.log('');
      }

      // Summary and next steps
      if (health.overall === 'healthy') {
        console.log(chalk.green('✅ All context files are well-aligned!'));
        console.log(chalk.gray('   Your AI assistants can confidently reference these files.'));
      } else {
        const issueCount = health.issues.length;
        if (issueCount > 0) {
          console.log(chalk.yellow(`✏️  ${issueCount} issue(s) found. Review and update your context files as needed.`));
          console.log(chalk.blue('   Your AI assistant can help you update these files based on the suggestions above.'));
        }
      }

      console.log('');
      console.log(chalk.gray(`Validation completed at ${health.lastChecked.toLocaleString()}`));

      // Exit with error code if there are errors
      const hasErrors = health.issues.some((i: HealthIssue) => i.type === 'error');
      if (hasErrors) {
        process.exit(1);
      }

    } catch (error: unknown) {
      // Handle specific error types with helpful messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Not a Git repository')) {
        if (!options.silent) {
          console.error(chalk.red('❌ Not a Git repository'));
          console.log(chalk.yellow('💡 Run "git init" to initialize a Git repository'));
          console.log(chalk.yellow('💡 Or run "cit init" which will initialize Git automatically'));
        }
      } else if (errorMessage.includes('Permission denied') || errorMessage.includes('EACCES')) {
        console.error(chalk.red('❌ Permission denied'));
        console.log(chalk.yellow('💡 Check file system permissions'));
        console.log(chalk.yellow('💡 Ensure you have read access to .cxt/ directory'));
      } else if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
        if (!options.silent) {
          console.error(chalk.red('❌ .cxt/ folder not found'));
          console.log(chalk.yellow('💡 Run "cit init" to initialize CxtManager'));
        }
      } else {
        if (!options.silent) {
          console.error(chalk.red('❌ Validation failed:'), errorMessage);
        }
      }
      
      if (process.env.DEBUG && error instanceof Error) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

function getDetailedAlignmentStatus(alignment: string): string {
  switch (alignment) {
    case 'aligned': return chalk.green('✅ Goals aligned');
    case 'warning': return chalk.yellow('⚠️  Timeline mismatch detected');
    case 'conflict': return chalk.red('🔴 Feature conflicts found');
    default: return chalk.gray('❓ Unknown status');
  }
} 