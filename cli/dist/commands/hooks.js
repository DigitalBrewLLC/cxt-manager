"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hooksCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const core_1 = require("@cxtmanager/core");
exports.hooksCommand = new commander_1.Command('hooks')
    .description('Manage git hooks for CxtManager')
    .command('install', 'Install git hooks')
    .command('remove', 'Remove git hooks')
    .command('status', 'Show hook installation status')
    .action(async () => {
    // Show help if no subcommand
    exports.hooksCommand.help();
});
const installCommand = new commander_1.Command('install')
    .description('Install git hooks for CxtManager')
    .action(async () => {
    const spinner = (0, ora_1.default)({ text: 'Installing git hooks...', spinner: 'dots' }).start();
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            spinner.fail(chalk_1.default.red('CxtManager not initialized.'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started.'));
            process.exit(1);
        }
        const config = await manager.getConfig();
        if (!config.git_integration?.enabled) {
            spinner.fail(chalk_1.default.red('Git integration is disabled in .cxt/.cxtconfig.json'));
            console.log(chalk_1.default.yellow('💡 Enable it by setting "git_integration.enabled" to true'));
            process.exit(1);
        }
        const hooksManager = new core_1.GitHooksManager(process.cwd(), config);
        await hooksManager.installHooks();
        const installedHooks = await hooksManager.getInstalledHooks();
        spinner.succeed(chalk_1.default.green(`Git hooks installed successfully!`));
        console.log('');
        console.log(chalk_1.default.bold('📋 Installed hooks:'));
        installedHooks.forEach(hook => {
            console.log(chalk_1.default.green(`   ✅ ${hook}`));
        });
        console.log('');
        console.log(chalk_1.default.gray('💡 Hooks will run automatically on git operations'));
        console.log(chalk_1.default.gray('   To remove: cit hooks remove'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to install git hooks'));
        // Handle specific error types with helpful messages
        if (error.message.includes('Not a Git repository')) {
            console.error(chalk_1.default.red('❌ Not a Git repository'));
            console.log(chalk_1.default.yellow('💡 Run "git init" to initialize a Git repository'));
            console.log(chalk_1.default.yellow('💡 Or run "cit init" which will initialize Git automatically'));
        }
        else if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
            console.error(chalk_1.default.red('❌ Permission denied'));
            console.log(chalk_1.default.yellow('💡 Check file system permissions'));
            console.log(chalk_1.default.yellow('💡 Ensure you have write access to .git/hooks/ directory'));
        }
        else {
            console.error(chalk_1.default.red('❌'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
const removeCommand = new commander_1.Command('remove')
    .description('Remove CxtManager git hooks')
    .action(async () => {
    const spinner = (0, ora_1.default)({ text: 'Removing git hooks...', spinner: 'dots' }).start();
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            spinner.fail(chalk_1.default.red('CxtManager not initialized.'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started.'));
            process.exit(1);
        }
        const config = await manager.getConfig();
        const hooksManager = new core_1.GitHooksManager(process.cwd(), config);
        const installedHooks = await hooksManager.getInstalledHooks();
        if (installedHooks.length === 0) {
            spinner.info(chalk_1.default.yellow('No CxtManager hooks found'));
            return;
        }
        await hooksManager.removeHooks();
        spinner.succeed(chalk_1.default.green(`Git hooks removed successfully!`));
        console.log('');
        console.log(chalk_1.default.gray(`Removed ${installedHooks.length} hook(s)`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to remove git hooks'));
        // Handle specific error types with helpful messages
        if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
            console.error(chalk_1.default.red('❌ Permission denied'));
            console.log(chalk_1.default.yellow('💡 Check file system permissions'));
            console.log(chalk_1.default.yellow('💡 Ensure you have write access to .git/hooks/ directory'));
        }
        else {
            console.error(chalk_1.default.red('❌'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
const statusCommand = new commander_1.Command('status')
    .description('Show git hook installation status')
    .action(async () => {
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CxtManager not initialized'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            process.exit(1);
        }
        const config = await manager.getConfig();
        const hooksManager = new core_1.GitHooksManager(process.cwd(), config);
        const installedHooks = await hooksManager.getInstalledHooks();
        const areInstalled = await hooksManager.areHooksInstalled();
        console.log(chalk_1.default.bold('🔗 Git Hooks Status'));
        console.log('');
        if (!config.git_integration?.enabled) {
            console.log(chalk_1.default.yellow('⚠️  Git integration is disabled'));
            console.log(chalk_1.default.gray('   Enable it in .cxt/.cxtconfig.json'));
            return;
        }
        if (areInstalled && installedHooks.length > 0) {
            console.log(chalk_1.default.green('✅ Git hooks are installed'));
            console.log('');
            console.log(chalk_1.default.bold('📋 Installed hooks:'));
            installedHooks.forEach(hook => {
                console.log(chalk_1.default.green(`   ✅ ${hook}`));
            });
            console.log('');
            console.log(chalk_1.default.gray('💡 Hooks run automatically on git operations'));
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  Git hooks are not installed'));
            console.log('');
            console.log(chalk_1.default.gray('💡 Install with: cit hooks install'));
        }
    }
    catch (error) {
        // Handle specific error types with helpful messages
        if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
            console.error(chalk_1.default.red('❌ Permission denied'));
            console.log(chalk_1.default.yellow('💡 Check file system permissions'));
            console.log(chalk_1.default.yellow('💡 Ensure you have read access to .git/hooks/ directory'));
        }
        else {
            console.error(chalk_1.default.red('❌ Failed to check hook status:'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
// Register subcommands
exports.hooksCommand.addCommand(installCommand);
exports.hooksCommand.addCommand(removeCommand);
exports.hooksCommand.addCommand(statusCommand);
//# sourceMappingURL=hooks.js.map