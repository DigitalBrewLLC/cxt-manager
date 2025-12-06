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
exports.PlanManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const plan_templates_1 = require("./plan-templates");
class PlanManager {
    constructor(cxtPath, gitRepo, config) {
        this.cxtPath = cxtPath;
        this.planPath = path.join(cxtPath, 'plan.md');
        this.planHistoryPath = path.join(cxtPath, '.plan-history');
        this.gitRepo = gitRepo;
        this.config = config;
    }
    /**
     * Get current branch name
     */
    async getCurrentBranch() {
        const branches = await this.gitRepo.getBranches();
        return branches.current;
    }
    /**
     * Get sanitized branch name for file system (remove special chars)
     */
    sanitizeBranchName(branch) {
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
    getBranchPlanPath(branch) {
        const sanitized = this.sanitizeBranchName(branch);
        return path.join(this.planHistoryPath, `${sanitized}.md`);
    }
    /**
     * Save current plan.md to .plan-history/{branch}.md
     */
    async saveCurrentPlan(branch) {
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
    async restorePlan(branch) {
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
    async createBlankPlan(template = 'minimal') {
        const branch = await this.getCurrentBranch();
        const date = new Date().toISOString().split('T')[0];
        const content = template === 'detailed'
            ? plan_templates_1.PlanTemplates.getDetailed(branch, date)
            : plan_templates_1.PlanTemplates.getMinimal(branch, date);
        await fs.writeFile(this.planPath, content, 'utf-8');
    }
    /**
     * Check if plan.md has uncommitted changes
     */
    async hasUncommittedChanges() {
        try {
            const status = await this.gitRepo.getStatus();
            return status.modified.includes('.cxt/plan.md') ||
                status.untracked.includes('.cxt/plan.md');
        }
        catch {
            return false;
        }
    }
    /**
     * Main sync method: save current, restore for new branch
     */
    async syncPlan(options = {}) {
        const { silent = false, createIfMissing = true, template = 'minimal' } = options;
        // Get current branch
        const currentBranch = await this.getCurrentBranch();
        // Check for uncommitted changes
        const hasChanges = await this.hasUncommittedChanges();
        if (hasChanges && !silent) {
            throw new Error('plan.md has uncommitted changes. Please commit or stash changes before switching branches.\n' +
                '  git add .cxt/plan.md && git commit -m "Update plan.md"\n' +
                '  OR\n' +
                '  git stash');
        }
        // Get previous branch from stored state (if available)
        // For now, we'll track this in a simple way
        const statePath = path.join(this.cxtPath, '.plan-state.json');
        let previousBranch = 'main';
        if (await fs.pathExists(statePath)) {
            try {
                const state = await fs.readJson(statePath);
                previousBranch = state.lastBranch || 'main';
            }
            catch {
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
    async hasBranchPlan(branch) {
        const branchPlanPath = this.getBranchPlanPath(branch);
        return await fs.pathExists(branchPlanPath);
    }
    /**
     * List all saved branch plans
     */
    async listBranchPlans() {
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
    async archivePlan(branch) {
        const branchPlanPath = this.getBranchPlanPath(branch);
        const archivePath = path.join(this.planHistoryPath, 'completed');
        if (await fs.pathExists(branchPlanPath)) {
            await fs.ensureDir(archivePath);
            const archiveFile = path.join(archivePath, path.basename(branchPlanPath));
            await fs.move(branchPlanPath, archiveFile);
        }
    }
}
exports.PlanManager = PlanManager;
//# sourceMappingURL=plan-manager.js.map