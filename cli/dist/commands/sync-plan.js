"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPlanCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@cxtmanager/core");
exports.syncPlanCommand = new commander_1.Command('sync-plan')
    .description('Sync plan.md for current branch (save current, restore for new branch)')
    .option('--silent', 'No output unless errors')
    .option('--create-if-missing', 'Create blank plan if branch has no saved plan')
    .option('--template <type>', 'Template type for new plans (minimal/detailed)', 'minimal')
    .action(async (options) => {
    try {
        const manager = new core_1.ContextManager();
        // Check if initialized
        if (!await manager.isInitialized()) {
            if (!options.silent) {
                console.log(chalk_1.default.red('❌ CxtManager not initialized'));
                console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            }
            process.exit(1);
            return;
        }
        // Execute sync
        const result = await manager.syncPlan({
            silent: options.silent,
            createIfMissing: options.createIfMissing !== false, // Default true
            template: options.template
        });
        // Output results (unless silent)
        if (!options.silent) {
            if (result.previousBranch !== result.currentBranch) {
                console.log(chalk_1.default.blue(`🔄 Switched plan.md from '${result.previousBranch}' to '${result.currentBranch}'`));
            }
            if (result.restored) {
                console.log(chalk_1.default.green(`✅ Restored plan.md for branch '${result.currentBranch}'`));
            }
            else if (result.created) {
                console.log(chalk_1.default.green(`✅ Created new plan.md for branch '${result.currentBranch}'`));
                console.log(chalk_1.default.gray('💡 Edit plan.md to add implementation details for this branch'));
            }
            else {
                console.log(chalk_1.default.yellow(`⚠️  No saved plan found for branch '${result.currentBranch}'`));
                console.log(chalk_1.default.gray('💡 Use --create-if-missing to create a blank plan template'));
            }
        }
    }
    catch (error) {
        if (!options.silent) {
            // Handle specific error types with helpful messages
            if (error.message.includes('Not a Git repository')) {
                console.error(chalk_1.default.red('❌ Not a Git repository'));
                console.log(chalk_1.default.yellow('💡 Run "git init" to initialize a Git repository'));
                console.log(chalk_1.default.yellow('💡 Or run "cit init" which will initialize Git automatically'));
            }
            else if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
                console.error(chalk_1.default.red('❌ Permission denied'));
                console.log(chalk_1.default.yellow('💡 Check file system permissions'));
                console.log(chalk_1.default.yellow('💡 Ensure you have write access to .cxt/ directory'));
            }
            else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
                console.error(chalk_1.default.red('❌ .cxt/ folder not found'));
                console.log(chalk_1.default.yellow('💡 Run "cit init" to initialize CxtManager'));
            }
            else {
                console.error(chalk_1.default.red('❌ Failed to sync plan:'), error.message);
            }
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
        }
        process.exit(1);
    }
});
//# sourceMappingURL=sync-plan.js.map