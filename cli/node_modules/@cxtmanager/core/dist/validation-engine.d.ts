import { HealthStatus, HealthIssue, TemplateThresholds } from './types';
export declare class ValidationEngine {
    private cxtPath;
    private templateThresholds;
    constructor(cxtPath: string, templateThresholds?: TemplateThresholds);
    checkHealth(quick?: boolean): Promise<HealthStatus>;
    autoHeal(issues: HealthIssue[], dryRun?: boolean): Promise<string[]>;
    private loadContextFiles;
    private checkAlignments;
    private checkCommonIssues;
    /**
     * Calculate template percentage and determine if content is template-only
     */
    private getTemplatePercentage;
    /**
     * Get human-readable purpose of each file
     */
    private getFilePurpose;
    private checkOutdatedInfo;
    private isMissingRequiredSections;
    private generateSuggestions;
    private applyFix;
    private fixMissingSections;
    private updateLastModifiedDate;
}
//# sourceMappingURL=validation-engine.d.ts.map