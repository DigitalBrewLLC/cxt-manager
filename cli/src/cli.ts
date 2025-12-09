#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { validateCommand } from './commands/validate';
import { blameCommand } from './commands/blame';
import { addCommand } from './commands/add';
import { commitCommand } from './commands/commit';
import { logCommand } from './commands/log';
import { diffCommand } from './commands/diff';
import { checkoutCommand } from './commands/checkout';
import { syncPlanCommand } from './commands/sync-plan';
import { hooksCommand } from './commands/hooks';
import { syncGitignoreCommand } from './commands/sync-gitignore';
import { versionCommand } from './commands/version';

const program = new Command();

// Read version from package.json
import { readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8')
);

// Global CLI setup
program
  .name('cit')
  .description('Git for AI Context - Stop being the context monkey');

// Add all commands
program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(validateCommand);
program.addCommand(blameCommand);
program.addCommand(addCommand);
program.addCommand(commitCommand);
program.addCommand(logCommand);
program.addCommand(diffCommand);
program.addCommand(checkoutCommand);
program.addCommand(syncPlanCommand);
program.addCommand(hooksCommand);
program.addCommand(syncGitignoreCommand);

// Global error handling
program.exitOverride((err) => {
  if (err.code === 'commander.unknownCommand') {
    console.error(chalk.red(`❌ Unknown command: ${err.message}`));
    console.log(chalk.yellow('💡 Run "cit --help" to see available commands'));
  } else if (err.code === 'commander.help') {
    // Help is expected, don't treat as error
    process.exit(0);
  } else if (err.code === 'commander.version') {
    // Version is handled by our custom option, don't treat as error
    process.exit(0);
  } else {
    console.error(chalk.red(`❌ ${err.message}`));
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  console.error(chalk.red('❌ Unhandled error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Handle version flag before parsing (to avoid Commander's default version handler)
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  // Execute version command directly
  versionCommand.parseAsync(['version'], { from: 'user' }).catch(() => {
    // If parsing fails, just show version and exit
    console.log(packageJson.version);
    process.exit(0);
  });
} else {
  // Parse and execute normally
  program.parse();
} 