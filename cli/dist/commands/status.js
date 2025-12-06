"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@cxtmanager/core");
exports.statusCommand = new commander_1.Command('status')
    .description('Show context file status and alignment health')
    .option('--detailed', 'Show detailed health report')
    .action(async (options) => {
    try {
        const manager = new core_1.ContextManager();
        // Check if initialized
        if (!await manager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CxtManager not initialized'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            return;
        }
        // Get status information
        const status = await manager.status();
        // Get config for thresholds
        const config = await manager.getConfig();
        const thresholds = config.context?.template_thresholds || {
            well_populated: 30,
            mild_warning: 50,
            critical: 70
        };
        // Display Git status
        console.log(chalk_1.default.bold('📊 Git Status:'));
        if (status.gitStatus.staged.length > 0) {
            console.log(chalk_1.default.green('  Changes staged for commit:'));
            status.gitStatus.staged.forEach(file => {
                console.log(chalk_1.default.green(`    modified: ${file}`));
            });
        }
        if (status.gitStatus.modified.length > 0) {
            console.log(chalk_1.default.yellow('  Changes not staged for commit:'));
            status.gitStatus.modified.forEach(file => {
                console.log(chalk_1.default.yellow(`    modified: ${file}`));
            });
        }
        if (status.gitStatus.untracked.length > 0) {
            console.log(chalk_1.default.red('  Untracked files:'));
            status.gitStatus.untracked.forEach(file => {
                console.log(chalk_1.default.red(`    ${file}`));
            });
        }
        if (status.gitStatus.staged.length === 0 &&
            status.gitStatus.modified.length === 0 &&
            status.gitStatus.untracked.length === 0) {
            console.log(chalk_1.default.green('  Working tree clean'));
        }
        console.log('');
        // Display context health
        console.log(chalk_1.default.bold('🏥 Context Health:'));
        const healthIcon = status.health.overall === 'healthy' ? '🟢' :
            status.health.overall === 'warning' ? '🟡' : '🔴';
        console.log(`  ${healthIcon} Overall: ${status.health.overall}`);
        // Show alignment status
        if (options.detailed) {
            console.log('');
            console.log(chalk_1.default.bold('🔗 File Alignments:'));
            console.log(`  context.md ←→ plan.md     ${getAlignmentIcon(status.health.alignments.contextToPlan)}`);
            console.log(`  All ←→ guardrail.md       ${getAlignmentIcon(status.health.alignments.allToGuardrails)}`);
        }
        // Show issues if any
        if (status.health.issues.length > 0) {
            console.log('');
            console.log(chalk_1.default.bold('⚠️  Issues Found:'));
            status.health.issues.forEach((issue, index) => {
                const icon = issue.type === 'error' ? '❌' : '⚠️';
                console.log(`  ${icon} ${issue.file}: ${issue.message}`);
                if (issue.suggestion) {
                    console.log(chalk_1.default.gray(`     💡 ${issue.suggestion}`));
                }
            });
        }
        // Show suggestions
        if (status.health.suggestions.length > 0) {
            console.log('');
            console.log(chalk_1.default.bold('💡 Suggestions:'));
            status.health.suggestions.forEach(suggestion => {
                console.log(`  ${suggestion}`);
            });
        }
        // Show context files status
        console.log('');
        console.log(chalk_1.default.bold('📁 Context Files:'));
        const suggestions = [];
        status.contextFiles.forEach((file) => {
            const statusIcon = file.status === 'clean' ? '✅' :
                file.status === 'modified' ? '📝' :
                    file.status === 'new' ? '🆕' : '❌';
            const stagedText = file.staged ? chalk_1.default.green(' (staged)') : '';
            // Show content status
            let contentIcon = '';
            let contentText = '';
            const contentStatus = file.contentStatus;
            const templatePercentage = file.templatePercentage;
            const fileSize = file.size;
            // Graduated warning system with configurable thresholds
            const WELL_POPULATED = thresholds.well_populated;
            const MILD_WARNING = thresholds.mild_warning;
            const CRITICAL = thresholds.critical;
            const percentage = templatePercentage ?? 0;
            if (contentStatus === 'empty') {
                contentIcon = '📭';
                contentText = chalk_1.default.red(' (empty - 100% template)');
                suggestions.push(`${file.file} is empty. Consider populating it with relevant information.`);
            }
            else if (contentStatus === 'template-only' || percentage >= CRITICAL) {
                // Critical: 70%+ template
                contentIcon = '🔴';
                if (percentage >= 90) {
                    contentText = chalk_1.default.red(` (${percentage}% template)`);
                }
                else {
                    contentText = chalk_1.default.red(` (${percentage}% template)`);
                }
                suggestions.push(`🔴 ${file.file} is ${percentage}% template content and needs significant work.`);
            }
            else if (percentage >= MILD_WARNING) {
                // Warning: 50-70% template
                contentIcon = '⚠️';
                contentText = chalk_1.default.yellow(` (${percentage}% template)`);
                suggestions.push(`⚠️  ${file.file} is ${percentage}% template content. Consider adding more project-specific information.`);
            }
            else if (percentage > WELL_POPULATED) {
                // Mild suggestion: 30-50% template
                contentIcon = '💡';
                contentText = chalk_1.default.blue(` (${percentage}% template)`);
                suggestions.push(`💡 ${file.file} is ${percentage}% template content. Consider adding more content.`);
            }
            else if (percentage > 0 && percentage <= WELL_POPULATED) {
                // Well populated: <= 30% template - show positive feedback
                contentIcon = '✅';
                contentText = chalk_1.default.green(` (${percentage}% template - well populated!)`);
            }
            const sizeText = fileSize !== undefined ? chalk_1.default.gray(` (${(fileSize / 1024).toFixed(1)} KB)`) : '';
            console.log(`  ${statusIcon} ${contentIcon} ${file.file}${stagedText}${contentText}${sizeText}`);
        });
        // Show suggestions if any
        if (suggestions.length > 0) {
            console.log('');
            console.log(chalk_1.default.bold('💡 Suggestions:'));
            suggestions.forEach(suggestion => {
                console.log(chalk_1.default.yellow(`  • ${suggestion}`));
            });
            console.log('');
            console.log(chalk_1.default.gray('💡 TIP: Edit the context files to add project-specific information.'));
            console.log(chalk_1.default.gray('   AI tools can read these files to better understand your project.'));
        }
        console.log('');
        console.log(chalk_1.default.gray(`Last health check: ${status.health.lastChecked.toLocaleString()}`));
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
            console.error(chalk_1.default.red('❌ .cxt/ folder not found'));
            console.log(chalk_1.default.yellow('💡 Run "cit init" to initialize CxtManager'));
        }
        else {
            console.error(chalk_1.default.red('❌ Failed to get status:'), error.message);
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
function getAlignmentIcon(alignment) {
    switch (alignment) {
        case 'aligned': return '✅ Aligned';
        case 'warning': return '⚠️  Warning';
        case 'conflict': return '🔴 Conflict';
        default: return '❓ Unknown';
    }
}
//# sourceMappingURL=status.js.map