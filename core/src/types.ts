export interface PlanManagementConfig {
  backup_on_switch: boolean;
  plan_template_style?: PlanTemplateStyle; // Override init mode for plan.md (defaults to config.mode)
  // Deprecated/Unused:
  // auto_commit_ai_changes: Removed - conflicts with "Manager, not Enforcer" philosophy
  // archive_completed: Removed - not implemented
}

export interface GitIntegrationConfig {
  enabled: boolean;
  hooks: {
    post_checkout?: string;
    pre_commit?: string;
    post_merge?: string; // Reserved for future use (auto-heal removed)
  };
  silent_mode: boolean;
  auto_install_hooks: boolean;
  track_in_git?: boolean; // If false, adds .cxt/ to .gitignore for privacy (default: true)
}

export interface ContentQualityThresholds {
  min_content_length: number;      // Minimum characters of actual content (default: 100)
  min_content_lines: number;        // Minimum lines of actual content (default: 3)
  empty_section_warning: boolean;    // Warn if sections are empty in template mode (default: true)
  short_content_warning: number;    // Warn if content is below this length (default: 200)
}

export type InitMode = 'blank' | 'template';
export type PlanTemplateStyle = 'blank' | 'template';
export type ContentStatus = 'empty' | 'short' | 'populated';

export interface ContextUpdateConfig {
  drift_detection?: boolean;
  warn_threshold?: number;  // Number of commits before warning (default: 3)
  content_quality?: ContentQualityThresholds;
  // Deprecated/Unused:
  // show_in_changed_files: Removed - not implemented
  // auto_commit_context_updates: Removed - conflicts with "Manager, not Enforcer" philosophy
}

export interface SyncPlanOptions {
  silent?: boolean;
  createIfMissing?: boolean;
  template?: PlanTemplateStyle; // 'blank' or 'template'
}

export interface SyncPlanResult {
  previousBranch: string;
  currentBranch: string;
  restored: boolean;
  created: boolean;
}

export interface CxtConfig {
  version: string;
  mode: InitMode;
  context: {
    health_checks: boolean;
    ai_attribution: boolean;
    drift_detection?: boolean;
    warn_threshold?: number;
    content_quality?: ContentQualityThresholds;
    // Deprecated/Unused:
    // auto_sync: Removed - not implemented
    // show_in_changed_files: Removed - not implemented
    // auto_commit_context_updates: Removed - conflicts with "Manager, not Enforcer" philosophy
  };
  // Deprecated/Unused:
  // template: Removed - not implemented
  // ai_model: Removed - not implemented
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
  mode: 'blank' | 'template';
  trackInGit?: boolean; // If false, adds .cxt/ to .gitignore for privacy (default: true)
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
  packageJson: Record<string, unknown> | null;
  readme: string;
  structure: ProjectStructure;
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
  alignments?: {
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
    contentStatus?: ContentStatus;
    contentQuality?: {
      status: ContentStatus;
      contentLength: number;
      contentLines: number;
      emptySections?: number;
    };
    size?: number;
  }>;
  lastUpdated: Date;
}

export interface CommitHistoryEntry {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: Date;
  refs?: string;
}

export interface BlameEntry {
  line: number;
  hash: string;
  author: string;
  email: string;
  date: Date;
  content: string;
} 