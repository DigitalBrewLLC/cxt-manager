"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const core_1 = require("@cxtmanager/core");
exports.commitCommand = new commander_1.Command('commit')
    .description('Commit context file changes with smart prompts')
    .option('-m, --message <message>', 'Commit message')
    .option('--no-verify', 'Skip validation before commit')
    .action(async (options) => {
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CxtManager not initialized'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            return;
        }
        // Get commit message
        let message = options.message;
        if (!message) {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'message',
                    message: 'Commit message:',
                    validate: (input) => input.trim().length > 0 || 'Please enter a commit message'
                }
            ]);
            message = answers.message;
        }
        // Validate context alignment before commit (unless --no-verify)
        if (options.verify !== false) {
            console.log(chalk_1.default.blue('🔍 Validating context alignment before commit...'));
            const health = await manager.validate();
            if (health.overall === 'error') {
                console.log(chalk_1.default.red('❌ Context validation failed'));
                console.log(chalk_1.default.yellow('💡 Run "cit validate" to see issues or use --no-verify to skip'));
                return;
            }
            if (health.overall === 'warning') {
                console.log(chalk_1.default.yellow('⚠️  Context validation has warnings'));
                const proceed = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'continue',
                        message: 'Continue with commit anyway?',
                        default: true
                    }
                ]);
                if (!proceed.continue) {
                    console.log(chalk_1.default.gray('Commit cancelled'));
                    return;
                }
            }
        }
        // Perform the commit
        const gitRepo = manager.gitRepo;
        await gitRepo.git.commit(message);
        console.log(chalk_1.default.green('✅ Committed changes successfully'));
        console.log(chalk_1.default.gray(`📝 ${message}`));
        // Smart prompts for related files
        const status = await manager.status();
        const unstagedContextFiles = status.contextFiles
            .filter(f => f.status === 'modified' && !f.staged)
            .map(f => f.file);
        if (unstagedContextFiles.length > 0) {
            console.log('');
            console.log(chalk_1.default.yellow('💡 Related files may need updates:'));
            unstagedContextFiles.forEach(file => {
                console.log(chalk_1.default.yellow(`   ${file} - consider updating based on your changes`));
            });
            const askStage = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'stage',
                    message: 'Stage and commit related files now?',
                    default: false
                }
            ]);
            if (askStage.stage) {
                await gitRepo.git.add(unstagedContextFiles.map(f => `.cxt/${f}`));
                const relatedMessage = `Update related context files

Related to: ${message}`;
                await gitRepo.git.commit(relatedMessage);
                console.log(chalk_1.default.green('✅ Related files committed'));
            }
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
        else if (error.message.includes('nothing to commit')) {
            console.log(chalk_1.default.yellow('⚠️  Nothing to commit'));
            console.log(chalk_1.default.gray('💡 No changes staged for commit'));
            console.log(chalk_1.default.gray('💡 Use "cit add" to stage changes first'));
        }
        else if (error.message.includes('no changes added to commit')) {
            console.log(chalk_1.default.yellow('⚠️  No changes staged for commit'));
            console.log(chalk_1.default.gray('💡 Use "cit add" to stage changes first'));
        }
        else {
            console.error(chalk_1.default.red('❌ Commit failed:'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
//# sourceMappingURL=commit.js.map