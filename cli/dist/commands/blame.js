"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blameCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@cxtmanager/core");
exports.blameCommand = new commander_1.Command('blame')
    .description('Show context file attribution with AI/Human/Code-triggered/External breakdown')
    .argument('<file>', 'Context file to analyze (context.md, plan.md, guardrail.md)')
    .option('--by-source', 'Group by attribution source')
    .option('--timeline', 'Show chronological evolution')
    .option('--diff <commit>', 'Show changes since commit')
    .action(async (file, options) => {
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CxtManager not initialized'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            return;
        }
        // Validate file name
        const validFiles = ['context.md', 'plan.md', 'guardrail.md'];
        if (!validFiles.includes(file)) {
            console.log(chalk_1.default.red(`❌ Invalid file: ${file}`));
            console.log(chalk_1.default.yellow(`💡 Valid files: ${validFiles.join(', ')}`));
            return;
        }
        const filePath = `.cxt/${file}`;
        console.log(chalk_1.default.bold(`📍 Context Attribution: ${file}`));
        console.log('');
        // Get blame information from GitRepository
        const gitRepo = manager.gitRepo;
        const blameInfo = await gitRepo.blame(filePath);
        if (options.bySource) {
            await showAttributionBySource(blameInfo, file);
        }
        else if (options.timeline) {
            await showTimelineView(gitRepo, filePath);
        }
        else if (options.diff) {
            await showDiffView(gitRepo, filePath, options.diff);
        }
        else {
            await showDetailedBlame(blameInfo, file);
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
        else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
            console.error(chalk_1.default.red('❌ File not found'));
            console.log(chalk_1.default.yellow('💡 Make sure the file exists in .cxt/ directory'));
        }
        else {
            console.error(chalk_1.default.red('❌ Blame analysis failed:'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
async function showDetailedBlame(blameInfo, file) {
    console.log(chalk_1.default.bold('📝 Line-by-line attribution:'));
    console.log('');
    // This is a simplified version - in real implementation we'd parse actual git blame
    blameInfo.slice(0, 10).forEach((line, index) => {
        const lineNum = (index + 1).toString().padStart(3, ' ');
        const attribution = getAttributionIcon('human'); // Placeholder
        console.log(chalk_1.default.gray(`${lineNum}│`) + ` ${attribution} ${line.content?.slice(0, 80) || 'Line content'}`);
    });
    if (blameInfo.length > 10) {
        console.log(chalk_1.default.gray(`... and ${blameInfo.length - 10} more lines`));
    }
}
async function showAttributionBySource(blameInfo, file) {
    console.log(chalk_1.default.bold('📊 Attribution by source:'));
    console.log('');
    // Mock data - in real implementation we'd analyze actual attribution
    const breakdown = {
        'AI Decisions': 45,
        'Human Edits': 35,
        'Code-Triggered': 15,
        'External Sync': 5
    };
    Object.entries(breakdown).forEach(([source, percentage]) => {
        const icon = getAttributionIcon(source.toLowerCase());
        const bar = '█'.repeat(Math.floor(percentage / 5));
        console.log(`${icon} ${source.padEnd(16)} ${percentage}% ${chalk_1.default.blue(bar)}`);
    });
    console.log('');
    console.log(chalk_1.default.gray('💡 Run "cit blame --timeline" to see chronological evolution'));
}
async function showTimelineView(gitRepo, filePath) {
    console.log(chalk_1.default.bold('📅 Chronological evolution:'));
    console.log('');
    const history = await gitRepo.getFileHistory(filePath);
    history.slice(0, 5).forEach((commit) => {
        const date = new Date(commit.date).toLocaleDateString();
        const author = commit.author.length > 20 ? commit.author.slice(0, 17) + '...' : commit.author;
        console.log(chalk_1.default.yellow(`${commit.hash.slice(0, 7)}`), chalk_1.default.gray(`${date}`), chalk_1.default.blue(`${author.padEnd(20)}`), commit.message.slice(0, 50));
    });
    if (history.length > 5) {
        console.log(chalk_1.default.gray(`... and ${history.length - 5} more commits`));
    }
}
async function showDiffView(gitRepo, filePath, fromCommit) {
    console.log(chalk_1.default.bold(`📋 Changes since ${fromCommit}:`));
    console.log('');
    const diff = await gitRepo.getDiff(filePath, fromCommit);
    if (diff.trim()) {
        console.log(diff);
    }
    else {
        console.log(chalk_1.default.gray('No changes since specified commit'));
    }
}
function getAttributionIcon(source) {
    switch (source.toLowerCase()) {
        case 'ai':
        case 'ai decisions':
            return '🧠';
        case 'human':
        case 'human edits':
            return '👨‍💻';
        case 'code':
        case 'code-triggered':
            return '🔄';
        case 'external':
        case 'external sync':
            return '🌐';
        default:
            return '❓';
    }
}
//# sourceMappingURL=blame.js.map