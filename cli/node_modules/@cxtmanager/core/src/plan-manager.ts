import * as fs from 'fs-extra';
import * as path from 'path';
import { GitRepository } from './git-repository';
import { CxtConfig, SyncPlanOptions, SyncPlanResult } from './types';
import { PlanTemplates } from './plan-templates';

export class PlanManager {
  private cxtPath: string;
  private planPath: string;
  private planHistoryPath: string;
  private gitRepo: GitRepository;
  private config: CxtConfig;

  constructor(
    cxtPath: string,
    gitRepo: GitRepository,
    config: CxtConfig
  ) {
    this.cxtPath = cxtPath;
    this.planPath = path.join(cxtPath, 'plan.md');
    this.planHistoryPath = path.join(cxtPath, '.plan-history');
    this.gitRepo = gitRepo;
    this.config = config;
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const branches = await this.gitRepo.getBranches();
    return branches.current;
  }

  /**
   * Get sanitized branch name for file system (remove special chars)
   */
  private sanitizeBranchName(branch: string): string {
    // Replace / with -, remove invalid characters
    return branch
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9\-_]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get path to branch-specific plan backup
   */
  private getBranchPlanPath(branch: string): string {
    const sanitized = this.sanitizeBranchName(branch);
    return path.join(this.planHistoryPath, `${sanitized}.md`);
  }

  /**
   * Save current plan.md to .plan-history/{branch}.md
   */
  async saveCurrentPlan(branch: string): Promise<void> {
    // Ensure .plan-history directory exists
    await fs.ensureDir(this.planHistoryPath);

    // Check if plan.md exists
    if (!await fs.pathExists(this.planPath)) {
      return; // Nothing to save
    }

    const branchPlanPath = this.getBranchPlanPath(branch);
    const currentContent = await fs.readFile(this.planPath, 'utf-8');
    
    // Only save if there's actual content (not just template)
    if (currentContent.trim().length > 0) {
      await fs.writeFile(branchPlanPath, currentContent, 'utf-8');
    }
  }

  /**
   * Restore plan.md from .plan-history/{branch}.md
   */
  async restorePlan(branch: string): Promise<boolean> {
    const branchPlanPath = this.getBranchPlanPath(branch);
    
    if (await fs.pathExists(branchPlanPath)) {
      const savedContent = await fs.readFile(branchPlanPath, 'utf-8');
      await fs.writeFile(this.planPath, savedContent, 'utf-8');
      return true;
    }
    
    return false;
  }

  /**
   * Create blank plan.md template
   */
  async createBlankPlan(template: 'minimal' | 'detailed' = 'minimal'): Promise<void> {
    const branch = await this.getCurrentBranch();
    const date = new Date().toISOString().split('T')[0];
    
    const content = template === 'detailed' 
      ? PlanTemplates.getDetailed(branch, date)
      : PlanTemplates.getMinimal(branch, date);
    
    await fs.writeFile(this.planPath, content, 'utf-8');
  }

  /**
   * Check if plan.md has uncommitted changes
   */
  async hasUncommittedChanges(): Promise<boolean> {
    try {
      const status = await this.gitRepo.getStatus();
      return status.modified.includes('.cxt/plan.md') || 
             status.untracked.includes('.cxt/plan.md');
    } catch {
      return false;
    }
  }

  /**
   * Main sync method: save current, restore for new branch
   */
  async syncPlan(options: SyncPlanOptions = {}): Promise<SyncPlanResult> {
    const { silent = false, createIfMissing = true, template = 'minimal' } = options;

    // Get current branch
    const currentBranch = await this.getCurrentBranch();
    
    // Check for uncommitted changes
    const hasChanges = await this.hasUncommittedChanges();
    if (hasChanges && !silent) {
      throw new Error(
        'plan.md has uncommitted changes. Please commit or stash changes before switching branches.\n' +
        '  git add .cxt/plan.md && git commit -m "Update plan.md"\n' +
        '  OR\n' +
        '  git stash'
      );
    }

    // Get previous branch from stored state (if available)
    // For now, we'll track this in a simple way
    const statePath = path.join(this.cxtPath, '.plan-state.json');
    let previousBranch = 'main';
    
    if (await fs.pathExists(statePath)) {
      try {
        const state = await fs.readJson(statePath);
        previousBranch = state.lastBranch || 'main';
      } catch {
        // Ignore errors reading state
      }
    }

    // Save current plan if we're switching from a different branch
    if (previousBranch !== currentBranch && previousBranch) {
      await this.saveCurrentPlan(previousBranch);
    }

    // Try to restore plan for current branch
    const restored = await this.restorePlan(currentBranch);

    // If no saved plan exists and createIfMissing is true, create blank template
    let created = false;
    if (!restored && createIfMissing) {
      await this.createBlankPlan(template);
      created = true;
    }

    // Save current branch to state
    await fs.writeJson(statePath, { lastBranch: currentBranch }, { spaces: 2 });

    return {
      previousBranch,
      currentBranch,
      restored,
      created
    };
  }

  /**
   * Check if branch has saved plan
   */
  async hasBranchPlan(branch: string): Promise<boolean> {
    const branchPlanPath = this.getBranchPlanPath(branch);
    return await fs.pathExists(branchPlanPath);
  }

  /**
   * List all saved branch plans
   */
  async listBranchPlans(): Promise<string[]> {
    if (!await fs.pathExists(this.planHistoryPath)) {
      return [];
    }

    const files = await fs.readdir(this.planHistoryPath);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  }

  /**
   * Archive completed branch plan
   */
  async archivePlan(branch: string): Promise<void> {
    const branchPlanPath = this.getBranchPlanPath(branch);
    const archivePath = path.join(this.planHistoryPath, 'completed');
    
    if (await fs.pathExists(branchPlanPath)) {
      await fs.ensureDir(archivePath);
      const archiveFile = path.join(archivePath, path.basename(branchPlanPath));
      await fs.move(branchPlanPath, archiveFile);
    }
  }
}

