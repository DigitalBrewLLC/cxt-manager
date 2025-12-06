#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const init_1 = require("./commands/init");
const status_1 = require("./commands/status");
const validate_1 = require("./commands/validate");
const auto_heal_1 = require("./commands/auto-heal");
const blame_1 = require("./commands/blame");
const add_1 = require("./commands/add");
const commit_1 = require("./commands/commit");
const log_1 = require("./commands/log");
const diff_1 = require("./commands/diff");
const checkout_1 = require("./commands/checkout");
const sync_plan_1 = require("./commands/sync-plan");
const hooks_1 = require("./commands/hooks");
const program = new commander_1.Command();
// Global CLI setup
program
    .name('cit')
    .description('Git for AI Context - Stop being the context monkey')
    .version('1.0.0');
// Add all commands
program.addCommand(init_1.initCommand);
program.addCommand(status_1.statusCommand);
program.addCommand(validate_1.validateCommand);
program.addCommand(auto_heal_1.autoHealCommand);
program.addCommand(blame_1.blameCommand);
program.addCommand(add_1.addCommand);
program.addCommand(commit_1.commitCommand);
program.addCommand(log_1.logCommand);
program.addCommand(diff_1.diffCommand);
program.addCommand(checkout_1.checkoutCommand);
program.addCommand(sync_plan_1.syncPlanCommand);
program.addCommand(hooks_1.hooksCommand);
// Global error handling
program.exitOverride((err) => {
    if (err.code === 'commander.unknownCommand') {
        console.error(chalk_1.default.red(`❌ Unknown command: ${err.message}`));
        console.log(chalk_1.default.yellow('💡 Run "cit --help" to see available commands'));
    }
    else if (err.code === 'commander.help') {
        // Help is expected, don't treat as error
        process.exit(0);
    }
    else {
        console.error(chalk_1.default.red(`❌ ${err.message}`));
    }
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error(chalk_1.default.red('❌ Unhandled error:'), error.message);
    if (process.env.DEBUG) {
        console.error(error.stack);
    }
    process.exit(1);
});
// Parse and execute
program.parse();
//# sourceMappingURL=cli.js.map