import { CxtConfig, InitOptions, StatusInfo, HealthStatus, ContextFile, SyncPlanOptions, SyncPlanResult } from './types';
export declare class ContextManager {
    private projectRoot;
    private cxtPath;
    private configPath;
    private gitRepo;
    private fileWatcher;
    private validationEngine;
    private planManager;
    private config;
    constructor(projectRoot?: string);
    init(options: InitOptions): Promise<void>;
    isInitialized(): Promise<boolean>;
    status(): Promise<StatusInfo>;
    validate(quick?: boolean): Promise<HealthStatus>;
    /**
     * Sync .gitignore with track_in_git setting from config
     * Call this after manually changing git_integration.track_in_git in .cxtconfig.json
     */
    syncGitignore(): Promise<void>;
    autoHeal(dryRun?: boolean): Promise<string[]>;
    loadConfig(): Promise<CxtConfig>;
    /**
     * Get the current configuration (public API)
     */
    getConfig(): Promise<CxtConfig>;
    getContextFiles(): Promise<ContextFile[]>;
    /**
     * Get or create PlanManager instance
     */
    private getPlanManager;
    /**
     * Sync plan.md for current branch (save current, restore for new branch)
     */
    syncPlan(options?: SyncPlanOptions): Promise<SyncPlanResult>;
    /**
     * Get list of branches with saved plans
     */
    getBranchPlans(): Promise<string[]>;
    private createCxtStructure;
    private analyzeProject;
    private analyzeStructure;
    private detectTechnologies;
    private createManualTemplates;
    private createBasicContent;
    private getManualTemplate;
    private createConfig;
    private getContextFileStatus;
    /**
     * Detect if file content is mostly template/placeholder content
     * Returns status and percentage of template content (0-100)
     */
    private detectContentStatus;
}
//# sourceMappingURL=context-manager.d.ts.map