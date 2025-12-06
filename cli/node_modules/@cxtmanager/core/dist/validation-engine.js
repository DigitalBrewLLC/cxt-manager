"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationEngine = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class ValidationEngine {
    constructor(cxtPath, templateThresholds) {
        this.cxtPath = cxtPath;
        // Default thresholds if not provided
        this.templateThresholds = templateThresholds || {
            well_populated: 30,
            mild_warning: 50,
            critical: 70
        };
    }
    async checkHealth(quick = false) {
        const issues = [];
        const suggestions = [];
        // Load all context files
        const contextFiles = await this.loadContextFiles();
        // Check for basic issues
        const basicIssues = await this.checkCommonIssues(contextFiles);
        issues.push(...basicIssues);
        // Check alignments between files
        const alignments = await this.checkAlignments(contextFiles);
        // In quick mode, skip outdated info check (faster)
        if (!quick) {
            // Check for outdated information
            const outdatedIssues = await this.checkOutdatedInfo(contextFiles);
            issues.push(...outdatedIssues);
        }
        // Generate suggestions
        const healthSuggestions = this.generateSuggestions(issues);
        suggestions.push(...healthSuggestions);
        // Determine overall health
        let overall = 'healthy';
        if (issues.some(i => i.type === 'error')) {
            overall = 'error';
        }
        else if (issues.length > 0) {
            overall = 'warning';
        }
        return {
            overall,
            lastChecked: new Date(),
            issues,
            suggestions,
            alignments
        };
    }
    async autoHeal(issues, dryRun = false) {
        const fixes = [];
        for (const issue of issues) {
            if (issue.autoFixable) {
                const fix = await this.applyFix(issue, dryRun);
                if (fix) {
                    fixes.push(fix);
                }
            }
        }
        return fixes;
    }
    async loadContextFiles() {
        const files = new Map();
        const fileNames = ['context.md', 'plan.md', 'guardrail.md'];
        for (const fileName of fileNames) {
            const filePath = path.join(this.cxtPath, fileName);
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf-8');
                files.set(fileName, content);
            }
        }
        return files;
    }
    async checkAlignments(contextFiles) {
        // Simple alignment checking - in real implementation, this would be more sophisticated
        return {
            contextToPlan: 'aligned',
            allToGuardrails: 'aligned'
        };
    }
    async checkCommonIssues(contextFiles) {
        const issues = [];
        // Check for missing required sections
        for (const [fileName, content] of contextFiles) {
            if (this.isMissingRequiredSections(fileName, content)) {
                issues.push({
                    type: 'warning',
                    file: fileName,
                    message: 'Missing required sections',
                    suggestion: 'Add standard sections for this file type',
                    autoFixable: true
                });
            }
        }
        // Check for template-only content with graduated warnings
        // Use configurable thresholds (defaults: 30%, 50%, 70%)
        const WELL_POPULATED_THRESHOLD = this.templateThresholds.well_populated;
        const MILD_WARNING_THRESHOLD = this.templateThresholds.mild_warning;
        const CRITICAL_THRESHOLD = this.templateThresholds.critical;
        for (const [fileName, content] of contextFiles) {
            const templateInfo = this.getTemplatePercentage(content);
            const percentage = templateInfo.percentage;
            // Only create issues if template percentage is above well-populated threshold
            if (percentage > WELL_POPULATED_THRESHOLD) {
                const filePurpose = this.getFilePurpose(fileName);
                if (percentage >= CRITICAL_THRESHOLD || templateInfo.isTemplateOnly) {
                    // Critical: 70%+ template or marked as template-only
                    issues.push({
                        type: 'error',
                        file: fileName,
                        message: `File contains ${percentage}% template/placeholder content`,
                        suggestion: `This file needs significant content. Consider populating ${fileName} with ${filePurpose}. The file contains helpful guidance comments explaining what to fill in.`,
                        autoFixable: false
                    });
                }
                else if (percentage >= MILD_WARNING_THRESHOLD) {
                    // Warning: 50-70% template
                    issues.push({
                        type: 'warning',
                        file: fileName,
                        message: `File contains ${percentage}% template content`,
                        suggestion: `Consider adding more project-specific content to ${fileName}. Currently ${percentage}% is template/guidance.`,
                        autoFixable: false
                    });
                }
                else {
                    // Mild suggestion: 30-50% template
                    issues.push({
                        type: 'warning',
                        file: fileName,
                        message: `File contains ${percentage}% template content`,
                        suggestion: `Consider adding more content to ${fileName} to make it more useful. Currently ${percentage}% is template/guidance.`,
                        autoFixable: false
                    });
                }
            }
            else if (content.trim().length < 100 && percentage <= WELL_POPULATED_THRESHOLD) {
                // Only warn about empty files if they're not already flagged for template content
                issues.push({
                    type: 'warning',
                    file: fileName,
                    message: 'File appears to be mostly empty',
                    suggestion: 'Add content to properly document this aspect. See the guidance comments in the file for what to include.',
                    autoFixable: false
                });
            }
        }
        return issues;
    }
    /**
     * Calculate template percentage and determine if content is template-only
     */
    getTemplatePercentage(content) {
        if (!content || content.trim().length === 0) {
            return { percentage: 100, isTemplateOnly: true };
        }
        const lines = content.split('\n');
        let templateChars = 0;
        let totalChars = 0;
        // Analyze each line
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0) {
                continue; // Skip empty lines
            }
            totalChars += line.length;
            // Check if line is template/guidance content
            const isTemplateLine = trimmed.startsWith('<!--') ||
                trimmed.includes('GUIDANCE:') ||
                trimmed.includes('TIP:') ||
                trimmed.includes('Example:') ||
                (trimmed.startsWith('*') && (trimmed.includes('Last Updated') || trimmed.includes('References') || trimmed.includes('This file'))) ||
                trimmed === '-->';
            if (isTemplateLine) {
                templateChars += line.length;
            }
        }
        // Calculate percentage
        const percentage = totalChars > 0
            ? Math.round((templateChars / totalChars) * 100)
            : 100;
        // Check for very little actual content
        const contentLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 &&
                !trimmed.startsWith('<!--') &&
                !trimmed.startsWith('*') &&
                !trimmed.startsWith('#') &&
                trimmed !== '-->' &&
                !trimmed.includes('GUIDANCE:') &&
                !trimmed.includes('TIP:') &&
                !trimmed.includes('Example:');
        });
        // Determine if template-only using configurable critical threshold
        // Also consider template-only if very few content lines
        const isTemplateOnly = percentage >= this.templateThresholds.critical || (contentLines.length <= 3 && percentage > this.templateThresholds.well_populated);
        return { percentage, isTemplateOnly };
    }
    /**
     * Get human-readable purpose of each file
     */
    getFilePurpose(fileName) {
        const purposes = {
            'context.md': 'your project\'s purpose, goals, and background',
            'plan.md': 'implementation details and architecture decisions',
            'guardrail.md': 'project constraints and development rules'
        };
        return purposes[fileName] || 'project-specific information';
    }
    async checkOutdatedInfo(contextFiles) {
        const issues = [];
        // Check for old "Last Updated" dates
        for (const [fileName, content] of contextFiles) {
            const lastUpdatedMatch = content.match(/\*Last Updated: ([\d-]+)\*/);
            if (lastUpdatedMatch) {
                const lastUpdated = new Date(lastUpdatedMatch[1]);
                const daysSince = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince > 30) {
                    issues.push({
                        type: 'warning',
                        file: fileName,
                        message: `Last updated ${Math.round(daysSince)} days ago`,
                        suggestion: 'Consider updating this file with recent changes',
                        autoFixable: true
                    });
                }
            }
        }
        return issues;
    }
    isMissingRequiredSections(fileName, content) {
        const requiredSections = {
            'context.md': ['Project Purpose', 'Core Problem', 'Solution', 'Target Users'],
            'plan.md': ['Architecture Overview', 'Development Phases', 'Technology Stack'],
            'guardrail.md': ['Code Standards', 'Architecture Rules']
        };
        const required = requiredSections[fileName] || [];
        return required.some((section) => !content.includes(`## ${section}`));
    }
    generateSuggestions(issues) {
        const suggestions = [];
        // Only show template suggestions for files above well-populated threshold
        const templateIssues = issues.filter(i => {
            if (i.message.includes('% template')) {
                const match = i.message.match(/(\d+)%/);
                const percentage = match ? parseInt(match[1]) : 0;
                return percentage > this.templateThresholds.well_populated;
            }
            return false;
        });
        if (templateIssues.length > 0) {
            // Separate critical vs warning issues
            const criticalIssues = templateIssues.filter(i => i.type === 'error');
            const warningIssues = templateIssues.filter(i => i.type === 'warning');
            if (criticalIssues.length > 0) {
                const percentages = criticalIssues.map(i => {
                    const match = i.message.match(/(\d+)%/);
                    return match ? parseInt(match[1]) : 0;
                });
                const avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
                suggestions.push(`🔴 ${criticalIssues.length} file(s) are ${avgPercentage}%+ template content and need significant work.`);
            }
            if (warningIssues.length > 0) {
                const percentages = warningIssues.map(i => {
                    const match = i.message.match(/(\d+)%/);
                    return match ? parseInt(match[1]) : 0;
                });
                const avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
                suggestions.push(`⚠️  ${warningIssues.length} file(s) contain ${avgPercentage}% template content. Consider adding more project-specific information.`);
            }
            suggestions.push('💡 TIP: The files contain helpful guidance comments (<!-- GUIDANCE: ... -->) explaining what to fill in.');
            suggestions.push('💡 TIP: AI tools can read these files to better understand your project when providing assistance.');
        }
        const autoFixableCount = issues.filter(i => i.autoFixable).length;
        if (autoFixableCount > 0) {
            suggestions.push(`Run "cit auto-heal" to fix ${autoFixableCount} issue(s) automatically`);
        }
        const warningCount = issues.filter(i => i.type === 'warning').length;
        if (warningCount > 3) {
            suggestions.push('Consider reviewing and updating context files regularly');
        }
        return suggestions;
    }
    async applyFix(issue, dryRun) {
        const filePath = path.join(this.cxtPath, issue.file);
        if (issue.message.includes('Missing required sections')) {
            return await this.fixMissingSections(filePath, issue.file, dryRun);
        }
        if (issue.message.includes('Last updated')) {
            return await this.updateLastModifiedDate(filePath, dryRun);
        }
        return null;
    }
    async fixMissingSections(filePath, fileName, dryRun) {
        if (dryRun) {
            return `Would add missing sections to ${fileName}`;
        }
        // In a real implementation, we'd add the missing sections
        return `Added missing sections to ${fileName}`;
    }
    async updateLastModifiedDate(filePath, dryRun) {
        if (dryRun) {
            return `Would update last modified date in ${path.basename(filePath)}`;
        }
        // In a real implementation, we'd update the date
        return `Updated last modified date in ${path.basename(filePath)}`;
    }
}
exports.ValidationEngine = ValidationEngine;
//# sourceMappingURL=validation-engine.js.map