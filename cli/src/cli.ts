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

const program = new Command();

// Global CLI setup
program
  .name('cit')
  .description('Git for AI Context - Stop being the context monkey')
  .version('1.0.0');

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