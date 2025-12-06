"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@cxtmanager/core");
exports.addCommand = new commander_1.Command('add')
    .description('Stage context file changes')
    .argument('[files...]', 'Context files to stage (default: all modified files)')
    .action(async (files) => {
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CxtManager not initialized'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            return;
        }
        // If no files specified, stage all modified context files
        const filesToAdd = files.length > 0 ? files : ['.cxt/'];
        // Validate file paths if specified
        if (files.length > 0) {
            const fs = require('fs');
            const path = require('path');
            for (const file of files) {
                const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
                if (!fs.existsSync(fullPath)) {
                    console.log(chalk_1.default.red(`❌ File not found: ${file}`));
                    console.log(chalk_1.default.yellow('💡 Make sure the file path is correct'));
                    return;
                }
                // Warn if trying to add files outside .cxt/ (but allow it)
                if (!file.startsWith('.cxt/') && !file.startsWith('.cxt\\')) {
                    console.log(chalk_1.default.yellow(`⚠️  Warning: ${file} is outside .cxt/ directory`));
                }
            }
        }
        console.log(chalk_1.default.blue('📋 Staging context files...'));
        // Use the GitRepository from core to add files
        const gitRepo = manager.gitRepo;
        await gitRepo.git.add(filesToAdd);
        console.log(chalk_1.default.green('✅ Context files staged successfully'));
        // Show what was staged
        const status = await gitRepo.getStatus();
        if (status.staged.length > 0) {
            console.log('');
            console.log(chalk_1.default.bold('📁 Staged files:'));
            status.staged.forEach((file) => {
                console.log(chalk_1.default.green(`   ${file}`));
            });
        }
    }
    catch (error) {
        // Handle specific error types with helpful messages
        if (error.message.includes('Not a Git repository')) {
            console.error(chalk_1.default.red('❌ Not a Git repository'));
            console.log(chalk_1.default.yellow('💡 Run "git init" to initialize a Git repository'));
            console.log(chalk_1.default.yellow('💡 Or run "cit init" which will initialize Git automatically'));
        }
        else if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
            console.error(chalk_1.default.red('❌ Permission denied'));
            console.log(chalk_1.default.yellow('💡 Check file system permissions'));
            console.log(chalk_1.default.yellow('💡 Ensure you have write access to .git/ directory'));
        }
        else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
            console.error(chalk_1.default.red('❌ File or directory not found'));
            console.log(chalk_1.default.yellow('💡 Make sure the file path is correct'));
            console.log(chalk_1.default.yellow('💡 Ensure .cxt/ folder exists (run "cit init" if needed)'));
        }
        else {
            console.error(chalk_1.default.red('❌ Failed to stage files:'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
//# sourceMappingURL=add.js.map