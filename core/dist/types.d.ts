export interface PlanManagementConfig {
    backup_on_switch: boolean;
    template: 'minimal' | 'detailed' | 'custom';
    auto_commit_ai_changes: boolean;
    archive_completed: boolean;
}
export interface GitIntegrationConfig {
    enabled: boolean;
    hooks: {
        post_checkout?: string;
        pre_commit?: string;
        post_merge?: string;
    };
    silent_mode: boolean;
    auto_install_hooks: boolean;
}
export interface TemplateThresholds {
    well_populated: number;
    mild_warning: number;
    critical: number;
}
export interface ContextUpdateConfig {
    update_mode?: 'auto' | 'manual';
    drift_detection?: boolean;
    warn_threshold?: number;
    template_thresholds?: TemplateThresholds;
    show_in_changed_files?: boolean;
    auto_commit_context_updates?: boolean;
}
export interface SyncPlanOptions {
    silent?: boolean;
    createIfMissing?: boolean;
    template?: 'minimal' | 'detailed';
}
export interface SyncPlanResult {
    previousBranch: string;
    currentBranch: string;
    restored: boolean;
    created: boolean;
}
export interface CxtConfig {
    version: string;
    mode: 'auto' | 'manual';
    mcp: {
        enabled: boolean;
        sources: {
            local_files: {
                enabled: boolean;
                readme: boolean;
                package_json: boolean;
                git_history: boolean;
            };
            claude_desktop?: {
                enabled: boolean;
                auto_discovered: boolean;
            };
            github?: {
                enabled: boolean;
                repo: string | null;
                include_issues: boolean;
                include_prs: boolean;
            };
            external_apis?: {
                notion: {
                    enabled: boolean;
                    api_key: string | null;
                };
                linear: {
                    enabled: boolean;
                    api_key: string | null;
                };
            };
        };
    };
    context: {
        auto_sync: boolean;
        health_checks: boolean;
        ai_attribution: boolean;
        update_mode?: 'auto' | 'manual';
        drift_detection?: boolean;
        warn_threshold?: number;
        template_thresholds?: TemplateThresholds;
        show_in_changed_files?: boolean;
        auto_commit_context_updates?: boolean;
    };
    template?: string;
    ai_model?: string;
    created: string;
    git_integration?: GitIntegrationConfig;
    plan_management?: PlanManagementConfig;
}
export interface ContextFile {
    name: string;
    path: string;
    content: string;
    lastModified: Date;
    size: number;
}
export interface InitOptions {
    mode: 'auto' | 'manual';
}
export interface GitInfo {
    isRepo: boolean;
    branch: string;
    hasRemote: boolean;
    remoteUrl?: string;
    commitCount: number;
    lastCommit?: {
        hash: string;
        message: string;
        author: string;
        date: Date;
    };
}
export interface ProjectAnalysis {
    packageJson: any | null;
    readme: string;
    structure: any;
    gitInfo: GitInfo;
    technologies: string[];
}
export interface ProjectStructure {
    hasPackageJson: boolean;
    hasSrc: boolean;
    hasTests: boolean;
    hasConfig: boolean;
    directories: string[];
}
export interface AttributionInfo {
    type: 'ai' | 'human' | 'code-triggered' | 'external';
    author: string;
    timestamp: Date;
    source?: string;
}
export interface HealthStatus {
    overall: 'healthy' | 'warning' | 'error';
    lastChecked: Date;
    issues: HealthIssue[];
    suggestions: string[];
    alignments: {
        contextToPlan: string;
        allToGuardrails: string;
    };
}
export interface HealthIssue {
    type: 'error' | 'warning';
    file: string;
    line?: number;
    message: string;
    suggestion?: string;
    autoFixable: boolean;
}
export interface BlameInfo extends AttributionInfo {
    line: number;
    content: string;
}
export interface StatusInfo {
    gitStatus: {
        staged: string[];
        modified: string[];
        untracked: string[];
    };
    health: HealthStatus;
    contextFiles: Array<{
        file: string;
        status: string;
        staged: boolean;
        contentStatus?: 'populated' | 'template-only' | 'empty';
        templatePercentage?: number;
        size?: number;
    }>;
    lastUpdated: Date;
}
//# sourceMappingURL=types.d.ts.map