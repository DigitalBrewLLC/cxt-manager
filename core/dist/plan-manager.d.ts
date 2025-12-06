import { GitRepository } from './git-repository';
import { CxtConfig, SyncPlanOptions, SyncPlanResult } from './types';
export declare class PlanManager {
    private cxtPath;
    private planPath;
    private planHistoryPath;
    private gitRepo;
    private config;
    constructor(cxtPath: string, gitRepo: GitRepository, config: CxtConfig);
    /**
     * Get current branch name
     */
    getCurrentBranch(): Promise<string>;
    /**
     * Get sanitized branch name for file system (remove special chars)
     */
    private sanitizeBranchName;
    /**
     * Get path to branch-specific plan backup
     */
    private getBranchPlanPath;
    /**
     * Save current plan.md to .plan-history/{branch}.md
     */
    saveCurrentPlan(branch: string): Promise<void>;
    /**
     * Restore plan.md from .plan-history/{branch}.md
     */
    restorePlan(branch: string): Promise<boolean>;
    /**
     * Create blank plan.md template
     */
    createBlankPlan(template?: 'minimal' | 'detailed'): Promise<void>;
    /**
     * Check if plan.md has uncommitted changes
     */
    hasUncommittedChanges(): Promise<boolean>;
    /**
     * Main sync method: save current, restore for new branch
     */
    syncPlan(options?: SyncPlanOptions): Promise<SyncPlanResult>;
    /**
     * Check if branch has saved plan
     */
    hasBranchPlan(branch: string): Promise<boolean>;
    /**
     * List all saved branch plans
     */
    listBranchPlans(): Promise<string[]>;
    /**
     * Archive completed branch plan
     */
    archivePlan(branch: string): Promise<void>;
}
//# sourceMappingURL=plan-manager.d.ts.map