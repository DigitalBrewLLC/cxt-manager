"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@cxtmanager/core");
exports.validateCommand = new commander_1.Command('validate')
    .description('Validate context file alignment and consistency')
    .option('--detailed', 'Show detailed validation report')
    .option('--quick', 'Quick validation (faster, less thorough)')
    .option('--silent', 'No output unless errors (for git hooks)')
    .action(async (options) => {
    try {
        const manager = new core_1.ContextManager();
        if (!await manager.isInitialized()) {
            if (!options.silent) {
                console.log(chalk_1.default.red('❌ CxtManager not initialized'));
                console.log(chalk_1.default.yellow('💡 Run "cit init" to get started'));
            }
            process.exit(1);
            return;
        }
        if (!options.silent) {
            console.log(chalk_1.default.blue('🔍 Validating context file alignment...'));
            console.log('');
        }
        const health = await manager.validate(options.quick);
        // In silent mode, only show errors
        if (options.silent) {
            const hasErrors = health.issues.some(i => i.type === 'error');
            if (hasErrors) {
                console.error(chalk_1.default.red('❌ Context validation failed'));
                console.error(chalk_1.default.yellow('💡 Run "cit status" to see details'));
                process.exit(1);
            }
            // No errors, exit silently
            return;
        }
        // Overall health status
        const healthIcon = health.overall === 'healthy' ? '🟢' :
            health.overall === 'warning' ? '🟡' : '🔴';
        console.log(chalk_1.default.bold(`${healthIcon} Overall Health: ${health.overall.toUpperCase()}`));
        console.log('');
        // Detailed alignment status
        if (options.detailed || health.overall !== 'healthy') {
            console.log(chalk_1.default.bold('🔗 Context File Alignments:'));
            console.log(`├── context.md ←→ plan.md     ${getDetailedAlignmentStatus(health.alignments.contextToPlan)}`);
            console.log(`└── All ←→ guardrail.md       ${getDetailedAlignmentStatus(health.alignments.allToGuardrails)}`);
            console.log('');
        }
        // Show issues
        if (health.issues.length > 0) {
            console.log(chalk_1.default.bold('⚠️  Issues Found:'));
            health.issues.forEach((issue, index) => {
                const icon = issue.type === 'error' ? '❌' : '⚠️';
                const prefix = index === health.issues.length - 1 ? '└──' : '├──';
                console.log(`${prefix} ${icon} ${chalk_1.default.bold(issue.file)}`);
                console.log(`    ${issue.message}`);
                if (issue.line) {
                    console.log(chalk_1.default.gray(`    Line ${issue.line}`));
                }
                if (issue.suggestion) {
                    console.log(chalk_1.default.blue(`    💡 ${issue.suggestion}`));
                }
                if (issue.autoFixable) {
                    console.log(chalk_1.default.green(`    🔧 Auto-fixable`));
                }
                if (index < health.issues.length - 1) {
                    console.log('│');
                }
            });
            console.log('');
        }
        // Show suggestions
        if (health.suggestions.length > 0) {
            console.log(chalk_1.default.bold('💡 Recommendations:'));
            health.suggestions.forEach((suggestion, index) => {
                const prefix = index === health.suggestions.length - 1 ? '└──' : '├──';
                console.log(`${prefix} ${suggestion}`);
            });
            console.log('');
        }
        // Summary and next steps
        if (health.overall === 'healthy') {
            console.log(chalk_1.default.green('✅ All context files are well-aligned!'));
            console.log(chalk_1.default.gray('   Your AI assistants can confidently reference these files.'));
        }
        else {
            const autoFixableCount = health.issues.filter(i => i.autoFixable).length;
            if (autoFixableCount > 0) {
                console.log(chalk_1.default.yellow(`🔧 ${autoFixableCount} issues can be fixed automatically:`));
                console.log(chalk_1.default.blue('   cit auto-heal --dry-run    # Preview fixes'));
                console.log(chalk_1.default.blue('   cit auto-heal              # Apply fixes'));
            }
            const manualCount = health.issues.filter(i => !i.autoFixable).length;
            if (manualCount > 0) {
                console.log(chalk_1.default.yellow(`✏️  ${manualCount} issues need manual attention.`));
            }
        }
        console.log('');
        console.log(chalk_1.default.gray(`Validation completed at ${health.lastChecked.toLocaleString()}`));
        // Exit with error code if there are errors
        const hasErrors = health.issues.some(i => i.type === 'error');
        if (hasErrors) {
            process.exit(1);
        }
    }
    catch (error) {
        // Handle specific error types with helpful messages
        if (error.message.includes('Not a Git repository')) {
            if (!options.silent) {
                console.error(chalk_1.default.red('❌ Not a Git repository'));
                console.log(chalk_1.default.yellow('💡 Run "git init" to initialize a Git repository'));
                console.log(chalk_1.default.yellow('💡 Or run "cit init" which will initialize Git automatically'));
            }
        }
        else if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
            console.error(chalk_1.default.red('❌ Permission denied'));
            console.log(chalk_1.default.yellow('💡 Check file system permissions'));
            console.log(chalk_1.default.yellow('💡 Ensure you have read access to .cxt/ directory'));
        }
        else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
            if (!options.silent) {
                console.error(chalk_1.default.red('❌ .cxt/ folder not found'));
                console.log(chalk_1.default.yellow('💡 Run "cit init" to initialize CxtManager'));
            }
        }
        else {
            if (!options.silent) {
                console.error(chalk_1.default.red('❌ Validation failed:'), error.message);
            }
        }
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
function getDetailedAlignmentStatus(alignment) {
    switch (alignment) {
        case 'aligned': return chalk_1.default.green('✅ Goals aligned');
        case 'warning': return chalk_1.default.yellow('⚠️  Timeline mismatch detected');
        case 'conflict': return chalk_1.default.red('🔴 Feature conflicts found');
        default: return chalk_1.default.gray('❓ Unknown status');
    }
}
//# sourceMappingURL=validate.js.map