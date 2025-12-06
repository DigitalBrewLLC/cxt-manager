/**
 * Core types for CxtManager - Git for AI Context
 */
export interface CxtConfig {
    version: string;
    mcp: {
        enabled: boolean;
        auto_discover: boolean;
        sources: {
            local_files: {
                enabled: boolean;
                readme: boolean;
                package_json: boolean;
                git_history: boolean;
            };
            claude_desktop: {
                enabled: boolean;
                auto_discovered: boolean;
            };
            github: {
                enabled: boolean;
                repo: string | null;
                include_issues: boolean;
                include_prs: boolean;
            };
            external_apis: {
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
    };
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
    template?: string;
    ai_model?: string;
    sources?: string[];
    deep_analysis?: boolean;
    trackInGit?: boolean;
}
export interface GitInfo {
    isRepo: boolean;
    currentBranch: string | null;
    hasChanges: boolean;
    commitCount: number;
    lastCommit: string | null;
}
export interface ProjectAnalysis {
    projectName: string;
    description: string;
    technologies: string[];
    structure: ProjectStructure;
    gitInfo: GitInfo;
    dependencies: string[];
    endpoints: string[];
    hasDocumentation: boolean;
}
export interface ProjectStructure {
    folders: string[];
    files: string[];
    hasPackageJson: boolean;
    hasReadme: boolean;
    hasTests: boolean;
    hasDocs: boolean;
}
declare enum ContextSource {
    AI = "ai",
    HUMAN = "human",
    CODE_TRIGGERED = "code-triggered",
    EXTERNAL = "external"
}
declare enum AlignmentStatus {
    ALIGNED = "aligned",
    WARNING = "warning",
    CONFLICT = "conflict"
}
export interface AttributionInfo {
    author: string;
    timestamp: Date;
    commit: string;
    source: ContextSource;
    aiModel?: string;
    reason?: string;
}
export interface HealthStatus {
    overall: 'healthy' | 'warning' | 'error';
    alignments: {
        contextToPlan: AlignmentStatus;
        allToGuardrails: AlignmentStatus;
    };
    issues: HealthIssue[];
    suggestions: string[];
    lastChecked: Date;
}
export interface HealthIssue {
    type: 'warning' | 'error';
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
    contextFiles: Array<{
        file: string;
        status: string;
        staged: boolean;
        contentStatus?: 'populated' | 'template-only' | 'empty';
        templatePercentage?: number;
        size?: number;
    }>;
    health: HealthStatus;
    gitStatus: {
        staged: string[];
        modified: string[];
        untracked: string[];
    };
    lastUpdated: Date;
}
export {};
//# sourceMappingURL=index.d.ts.map