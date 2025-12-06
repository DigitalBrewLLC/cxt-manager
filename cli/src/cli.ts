#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '@cxtmanager/core';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { validateCommand } from './commands/validate';
import { autoHealCommand } from './commands/auto-heal';
import { blameCommand } from './commands/blame';
import { addCommand } from './commands/add';
import { commitCommand } from './commands/commit';
import { logCommand } from './commands/log';
import { diffCommand } from './commands/diff';
import { checkoutCommand } from './commands/checkout';
import { syncPlanCommand } from './commands/sync-plan';
import { hooksCommand } from './commands/hooks';
import { syncGitignoreCommand } from './commands/sync-gitignore';

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
  .description('Git for AI Context - Stop being the context monkey')
  .version(packageJson.version);

// Add all commands
program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(validateCommand);
program.addCommand(autoHealCommand);
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

// Parse and execute
program.parse(); 