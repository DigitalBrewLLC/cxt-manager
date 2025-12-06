"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@cxtmanager/core");
exports.diffCommand = new commander_1.Command('diff')
    .description('Show changes in context files')
    .argument('[file]', 'Specific context file to diff')
    .option('--staged', 'Show staged changes only')
    .option('--cached', 'Alias for --staged')
    .option('--name-only', 'Show only file names')
    .action(async (file, options) => {
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CxtManager not initialized'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            return;
        }
        const gitRepo = manager.gitRepo;
        const staged = options.staged || options.cached;
        if (file) {
            await showFileDiff(gitRepo, file, staged, options.nameOnly);
        }
        else {
            await showAllContextDiffs(gitRepo, staged, options.nameOnly);
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
            console.log(chalk_1.default.yellow('💡 Ensure you have read access to .git/ directory'));
        }
        else {
            console.error(chalk_1.default.red('❌ Failed to show diff:'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
async function showFileDiff(gitRepo, file, staged, nameOnly) {
    const validFiles = ['context.md', 'plan.md', 'guardrail.md'];
    if (!validFiles.includes(file)) {
        console.log(chalk_1.default.red(`❌ Invalid file: ${file}`));
        console.log(chalk_1.default.yellow(`💡 Valid files: ${validFiles.join(', ')}`));
        return;
    }
    const filePath = `.cxt/${file}`;
    if (nameOnly) {
        console.log(filePath);
        return;
    }
    console.log(chalk_1.default.bold(`📋 Diff: ${file}`));
    console.log('');
    const diff = staged
        ? await gitRepo.getDiff(filePath, '--staged')
        : await gitRepo.getDiff(filePath);
    if (diff.trim()) {
        formatAndShowDiff(diff);
    }
    else {
        console.log(chalk_1.default.gray(`No ${staged ? 'staged ' : ''}changes in ${file}`));
    }
}
async function showAllContextDiffs(gitRepo, staged, nameOnly) {
    const contextFiles = ['context.md', 'plan.md', 'guardrail.md'];
    const changedFiles = [];
    for (const file of contextFiles) {
        const filePath = `.cxt/${file}`;
        const diff = staged
            ? await gitRepo.getDiff(filePath, '--staged')
            : await gitRepo.getDiff(filePath);
        if (diff.trim()) {
            changedFiles.push(file);
            if (nameOnly) {
                console.log(filePath);
            }
            else {
                console.log(chalk_1.default.bold(`📋 ${file}`));
                console.log(chalk_1.default.gray('─'.repeat(50)));
                formatAndShowDiff(diff);
                console.log('');
            }
        }
    }
    if (changedFiles.length === 0) {
        console.log(chalk_1.default.gray(`No ${staged ? 'staged ' : ''}changes in context files`));
        if (!staged) {
            console.log('');
            console.log(chalk_1.default.blue('💡 Use "cit diff --staged" to see staged changes'));
            console.log(chalk_1.default.blue('💡 Use "cit status" to see overall project status'));
        }
    }
    else if (!nameOnly) {
        console.log(chalk_1.default.bold(`📊 Summary: ${changedFiles.length} context file(s) changed`));
        changedFiles.forEach(file => {
            console.log(chalk_1.default.yellow(`  • ${file}`));
        });
    }
}
function formatAndShowDiff(diff) {
    const lines = diff.split('\n');
    lines.forEach(line => {
        if (line.startsWith('+++') || line.startsWith('---')) {
            console.log(chalk_1.default.bold(line));
        }
        else if (line.startsWith('@@')) {
            console.log(chalk_1.default.cyan(line));
        }
        else if (line.startsWith('+')) {
            console.log(chalk_1.default.green(line));
        }
        else if (line.startsWith('-')) {
            console.log(chalk_1.default.red(line));
        }
        else {
            console.log(chalk_1.default.gray(line));
        }
    });
}
//# sourceMappingURL=diff.js.map