import * as fs from 'fs-extra';
import * as path from 'path';
import { GitRepository } from './git-repository';
import { FileWatcher } from './file-watcher';
import { ValidationEngine } from './validation-engine';
import { PlanManager } from './plan-manager';
import { CxtConfig, InitOptions, ProjectAnalysis, StatusInfo, HealthStatus, ContextFile, SyncPlanOptions, SyncPlanResult, ProjectStructure } from './types';

export class ContextManager {
  private projectRoot: string;
  private cxtPath: string;
  private configPath: string;
  private gitRepo: GitRepository;
  private fileWatcher: FileWatcher;
  private validationEngine: ValidationEngine;
  private planManager: PlanManager | null = null;
  private config: CxtConfig | null = null;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.cxtPath = path.join(projectRoot, '.cxt');
    this.configPath = path.join(this.cxtPath, '.cxtconfig.json');
    this.gitRepo = new GitRepository(projectRoot);
    this.fileWatcher = new FileWatcher(this.cxtPath);
    this.validationEngine = new ValidationEngine(this.cxtPath);
  }

  async init(options: InitOptions): Promise<void> {
    try {
      // Ensure we're in a Git repository
      await this.gitRepo.ensureGitRepo();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
        throw new Error(
          'Permission denied. Cannot initialize Git repository.\n' +
          '  💡 Check file system permissions\n' +
          '  💡 Ensure you have write access to the current directory'
        );
      }
      throw error;
    }

    try {
      // Create .cxt structure
      await this.createCxtStructure();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
        throw new Error(
          'Permission denied. Cannot create .cxt/ folder.\n' +
          '  💡 Check file system permissions\n' +
          '  💡 Ensure you have write access to the current directory'
        );
      }
      throw error;
    }

    // Analyze the project
    const analysis = await this.analyzeProject();

    // Create configuration
    await this.createConfig(options);
    
    // Configure .gitignore based on trackInGit setting
    const trackInGit = options.trackInGit !== false; // Default to true
    await this.gitRepo.ensureGitignore(trackInGit);

    // Generate content based on mode
    switch (options.mode) {
      case 'manual':
        await this.createManualTemplates();
        break;
      case 'auto':
        await this.createBasicContent(analysis);
        break;
      default:
        await this.createBasicContent(analysis);
    }

    // Initial Git commit (only if tracking in Git)
    if (trackInGit) {
      await this.gitRepo.addAndCommit(
        ['.cxt/'],
        `feat: initialize CxtManager with ${options.mode} mode\n\nCreated context files: context.md, plan.md, guardrail.md`,
        'CxtManager Init'
      );
    }
  }

  async isInitialized(): Promise<boolean> {
    const cxtExists = await fs.pathExists(this.cxtPath);
    const configExists = await fs.pathExists(this.configPath);
    return cxtExists && configExists;
  }

  async status(): Promise<StatusInfo> {
    if (!await this.isInitialized()) {
      throw new Error('CxtManager not initialized');
    }

    const gitStatus = await this.gitRepo.getStatus();
    const health = await this.validate();
    const contextFiles = await this.getContextFileStatus();

    return {
      gitStatus,
      health,
      contextFiles,
      lastUpdated: new Date()
    };
  }

  async validate(quick: boolean = false): Promise<HealthStatus> {
    if (!await this.isInitialized()) {
      throw new Error('CxtManager not initialized');
    }

    // Update validation engine with current config thresholds
    const config = await this.loadConfig();
    const thresholds = config.context?.template_thresholds || {
      well_populated: 30,
      mild_warning: 50,
      critical: 70
    };
    this.validationEngine = new ValidationEngine(this.cxtPath, thresholds);

    return await this.validationEngine.checkHealth(quick);
  }

  /**
   * Sync .gitignore with track_in_git setting from config
   * Call this after manually changing git_integration.track_in_git in .cxtconfig.json
   */
  async syncGitignore(): Promise<void> {
    if (!await this.isInitialized()) {
      throw new Error('CxtManager not initialized');
    }

    const config = await this.loadConfig();
    const trackInGit = config.git_integration?.track_in_git !== false; // Default to true
    await this.gitRepo.ensureGitignore(trackInGit);
  }

  async autoHeal(dryRun: boolean = false): Promise<string[]> {
    if (!await this.isInitialized()) {
      throw new Error('CxtManager not initialized');
    }

    const health = await this.validate();
    return await this.validationEngine.autoHeal(health.issues, dryRun);
  }

  async loadConfig(): Promise<CxtConfig> {
    if (!this.config) {
      if (!await fs.pathExists(this.configPath)) {
        throw new Error('Configuration file not found');
      }
      
      const configData = await fs.readJson(this.configPath);
      this.config = configData as CxtConfig;
    }
    
    if (!this.config) {
      throw new Error('Failed to load configuration');
    }
    
    return this.config;
  }

  /**
   * Get the current configuration (public API)
   */
  async getConfig(): Promise<CxtConfig> {
    return await this.loadConfig();
  }

  async getContextFiles(): Promise<ContextFile[]> {
    const files = ['context.md', 'plan.md', 'guardrail.md'];
    const contextFiles: ContextFile[] = [];

    for (const file of files) {
      const filePath = path.join(this.cxtPath, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        contextFiles.push({
          name: file,
          path: filePath,
          content,
          lastModified: stats.mtime,
          size: stats.size
        });
      }
    }

    return contextFiles;
  }

  /**
   * Get or create PlanManager instance
   */
  private async getPlanManager(): Promise<PlanManager> {
    if (!this.planManager) {
      const config = await this.loadConfig();
      this.planManager = new PlanManager(this.cxtPath, this.gitRepo, config);
    }
    return this.planManager;
  }

  /**
   * Sync plan.md for current branch (save current, restore for new branch)
   */
  async syncPlan(options?: SyncPlanOptions): Promise<SyncPlanResult> {
    if (!await this.isInitialized()) {
      throw new Error('CxtManager not initialized');
    }

    const planManager = await this.getPlanManager();
    return await planManager.syncPlan(options);
  }

  /**
   * Get list of branches with saved plans
   */
  async getBranchPlans(): Promise<string[]> {
    if (!await this.isInitialized()) {
      throw new Error('CxtManager not initialized');
    }

    const planManager = await this.getPlanManager();
    return await planManager.listBranchPlans();
  }

  private async createCxtStructure(): Promise<void> {
    await fs.ensureDir(this.cxtPath);
    // Create .plan-history directory for branch-aware plan.md
    await fs.ensureDir(path.join(this.cxtPath, '.plan-history'));
  }

  private async analyzeProject(): Promise<ProjectAnalysis> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const readmePath = path.join(this.projectRoot, 'README.md');

    let packageJson = null;
    let readme = '';
    
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
    }
    
    if (await fs.pathExists(readmePath)) {
      readme = await fs.readFile(readmePath, 'utf-8');
    }

    const structure = await this.analyzeStructure();
    const gitInfo = await this.gitRepo.getInfo();
    
    const dependencies = packageJson?.dependencies ? Object.keys(packageJson.dependencies) : [];
    const technologies = this.detectTechnologies(dependencies, structure);

    return {
      packageJson,
      readme,
      structure,
      gitInfo,
      technologies
    };
  }

  private async analyzeStructure(): Promise<any> {
    // Simple structure analysis
    const entries = await fs.readdir(this.projectRoot);
    const structure = {
      hasPackageJson: entries.includes('package.json'),
      hasSrc: entries.includes('src'),
      hasTests: entries.some(e => e.includes('test') || e.includes('spec')),
      hasConfig: entries.some(e => e.includes('config') || e.includes('.config')),
      directories: entries.filter(async e => {
        const stat = await fs.stat(path.join(this.projectRoot, e));
        return stat.isDirectory();
      })
    };
    
    return structure;
  }

  private detectTechnologies(dependencies: string[], structure: ProjectStructure): string[] {
    const technologies: string[] = [];
    
    // Detect based on dependencies
    if (dependencies.includes('react')) technologies.push('React');
    if (dependencies.includes('vue')) technologies.push('Vue');
    if (dependencies.includes('angular')) technologies.push('Angular');
    if (dependencies.includes('express')) technologies.push('Express');
    if (dependencies.includes('next')) technologies.push('Next.js');
    if (dependencies.includes('typescript')) technologies.push('TypeScript');
    
    // Detect based on structure
    if (structure.hasSrc) technologies.push('JavaScript/TypeScript');
    if (structure.hasTests) technologies.push('Testing');
    
    return technologies;
  }

  private async createManualTemplates(): Promise<void> {
    const templates = {
      'context.md': this.getManualTemplate('context'),
      'plan.md': this.getManualTemplate('plan'),
      'guardrail.md': this.getManualTemplate('guardrail')
    };

    for (const [fileName, content] of Object.entries(templates)) {
      const filePath = path.join(this.cxtPath, fileName);
      await fs.writeFile(filePath, content);
    }
  }

  private async createBasicContent(analysis: ProjectAnalysis): Promise<void> {
    // Create basic content based on analysis
    const projectName = analysis.packageJson?.name || 'Project';
    const readmeFirstLine = analysis.readme.split('\n')[0] || '';
    const projectDescription = readmeFirstLine || 'Add your project description here';
    
    const contextContent = `# ${projectName} Context

*This file contains stable project information that doesn't change per branch.*
*See plan.md for branch-specific implementation details.*

*Last Updated: ${new Date().toISOString().split('T')[0]}*

## Project Purpose

${projectDescription}

<!-- 
  GUIDANCE: Describe what this project does and why it exists.
  This helps AI understand the project's goals when providing assistance.
  
  TIP: Be specific about the problem you're solving and who benefits from it.
-->

## Core Problem

<!-- 
  GUIDANCE: What problem does this project solve?
  This helps AI understand the motivation behind the project.
  Example: "Remote teams struggle to track tasks across multiple tools"
  
  TIP: Focus on the user's pain point, not the technical solution.
-->

## Solution

<!-- 
  GUIDANCE: How does this project address the problem?
  This helps AI understand your approach to solving the problem.
  Example: "Unified task management with Slack integration for seamless workflow"
  
  TIP: Explain the high-level approach, not implementation details (those go in plan.md).
-->

## Target Users

<!-- 
  GUIDANCE: Who will use this project?
  This helps AI tailor suggestions to your audience.
  Example: "Remote teams of 5-50 people using Slack for communication"
  
  TIP: Be specific about user characteristics, needs, and constraints.
-->

## Key Features

<!-- 
  GUIDANCE: What are the main features and capabilities?
  This helps AI understand what functionality is important.
  Example: "Task creation, team collaboration, Slack notifications, deadline tracking"
  
  TIP: List the core features that define your project's value proposition.
-->
`;

    await fs.writeFile(path.join(this.cxtPath, 'context.md'), contextContent);
    await fs.writeFile(path.join(this.cxtPath, 'plan.md'), this.getManualTemplate('plan'));
    await fs.writeFile(path.join(this.cxtPath, 'guardrail.md'), this.getManualTemplate('guardrail'));
  }


  private getManualTemplate(type: string): string {
    const templates: Record<string, string> = {
      context: `# Project Context

*This file contains stable project information that doesn't change per branch.*
*See plan.md for branch-specific implementation details.*

*Last Updated: ${new Date().toISOString().split('T')[0]}*

## Project Purpose
<!-- 
  GUIDANCE: Describe what this project does and why it exists.
  This helps AI understand the project's goals when providing assistance.
  Example: "A task management app for remote teams"
  
  TIP: Be specific about the problem you're solving and who benefits from it.
-->

## Core Problem  
<!-- 
  GUIDANCE: What problem does this project solve?
  This helps AI understand the motivation behind the project.
  Example: "Remote teams struggle to track tasks across multiple tools"
  
  TIP: Focus on the user's pain point, not the technical solution.
-->

## Solution
<!-- 
  GUIDANCE: How does this project address the problem?
  This helps AI understand your approach to solving the problem.
  Example: "Unified task management with Slack integration for seamless workflow"
  
  TIP: Explain the high-level approach, not implementation details (those go in plan.md).
-->

## Target Users
<!-- 
  GUIDANCE: Who will use this project?
  This helps AI tailor suggestions to your audience.
  Example: "Remote teams of 5-50 people using Slack for communication"
  
  TIP: Be specific about user characteristics, needs, and constraints.
-->

## Key Features
<!-- 
  GUIDANCE: What are the main features and capabilities?
  This helps AI understand what functionality is important.
  Example: "Task creation, team collaboration, Slack notifications, deadline tracking"
  
  TIP: List the core features that define your project's value proposition.
-->
`,
      plan: `# Development Plan

*This file contains branch-specific implementation details.*
*When you switch branches, this file automatically switches to that branch's plan.*
*See context.md for stable project background.*

*Last Updated: ${new Date().toISOString().split('T')[0]}*
*References: context.md for project vision*

## Architecture Overview
<!-- 
  GUIDANCE: Describe the technical architecture for this branch/feature.
  This helps AI understand how the code is structured.
  Example: "REST API with Express.js, PostgreSQL database, React frontend"
  
  TIP: Focus on the architecture decisions relevant to current work.
  AI will update this as implementation progresses.
-->

## Development Phases
<!-- 
  GUIDANCE: Break down development into phases or milestones.
  This helps AI understand the development timeline and priorities.
  Example: "Phase 1: Authentication, Phase 2: Core features, Phase 3: Integrations"
  
  TIP: Update this as work progresses. AI can help track completion status.
-->

## Technology Stack
<!-- 
  GUIDANCE: List technologies, frameworks, and tools being used.
  This helps AI make appropriate suggestions and avoid incompatible solutions.
  Example: "Node.js 18+, TypeScript, React 18, PostgreSQL 14, Docker"
  
  TIP: Include versions and important constraints (e.g., "must support Node 16+").
-->

## Success Criteria
<!-- 
  GUIDANCE: Define what success looks like for this branch/feature.
  This helps AI understand when work is complete.
  Example: "Users can create accounts, login, and reset passwords"
  
  TIP: Be specific and measurable. AI can help verify completion.
-->
`,
      guardrail: `# Development Guardrails

*This file contains universal project constraints and rules.*
*These apply across all branches and should be respected by AI tools.*

*Last Updated: ${new Date().toISOString().split('T')[0]}*

## Code Standards
<!-- 
  GUIDANCE: Coding standards and conventions.
  This helps AI generate code that matches your project's style.
  Example: "Use TypeScript strict mode, ESLint rules, 2-space indentation"
  
  TIP: Reference your linter config, style guide, or team conventions.
-->

## Architecture Rules
<!-- 
  GUIDANCE: Architectural constraints and patterns.
  This helps AI make decisions that align with your architecture.
  Example: "No direct database access from components, use service layer"
  
  TIP: Document patterns to follow and anti-patterns to avoid.
-->

## Security Requirements
<!-- 
  GUIDANCE: Security guidelines and requirements.
  This helps AI avoid security vulnerabilities.
  Example: "All user input must be sanitized, use HTTPS only, no secrets in code"
  
  TIP: Include authentication, authorization, data protection requirements.
-->

## Performance Constraints
<!-- 
  GUIDANCE: Performance requirements and limits.
  This helps AI optimize code appropriately.
  Example: "API responses < 200ms, support 1000 concurrent users"
  
  TIP: Include response time targets, scalability requirements, resource limits.
-->
`
    };
    
    return templates[type] || '';
  }

  private async createConfig(options: InitOptions): Promise<void> {
    const trackInGit = options.trackInGit !== false; // Default to true
    
    const config: CxtConfig = {
      version: '1.0.0',
      mode: options.mode,
      git_integration: {
        enabled: true,
        hooks: {
          post_checkout: 'sync-plan',
          pre_commit: 'validate',
          post_merge: 'auto-heal'
        },
        silent_mode: true,
        auto_install_hooks: true, // MVP: Auto-install hooks on init
        track_in_git: trackInGit
      },
      plan_management: {
        backup_on_switch: true,
        template: 'minimal',
        auto_commit_ai_changes: true,
        archive_completed: false
      },
      mcp: {
        enabled: false,
        sources: {
          local_files: {
            enabled: true,
            readme: true,
            package_json: true,
            git_history: true
          }
        }
      },
      context: {
        auto_sync: false,
        health_checks: true,
        ai_attribution: true,
        update_mode: 'manual',
        drift_detection: true,
        warn_threshold: 3,
        template_thresholds: {
          well_populated: 30,
          mild_warning: 50,
          critical: 70
        },
        show_in_changed_files: true,
        auto_commit_context_updates: false
      },
      created: new Date().toISOString()
    };

    await fs.writeJson(this.configPath, config, { spaces: 2 });
    this.config = config;
  }

  private async getContextFileStatus(): Promise<Array<{
    file: string;
    status: string;
    staged: boolean;
    contentStatus: 'populated' | 'template-only' | 'empty';
    templatePercentage?: number;
    size: number;
  }>> {
    const files = ['context.md', 'plan.md', 'guardrail.md'];
    const gitStatus = await this.gitRepo.getStatus();
    
    const results = await Promise.all(files.map(async (file) => {
      const filePath = `.cxt/${file}`;
      const fullPath = path.join(this.cxtPath, file);
      let status = 'clean';
      let staged = false;
      let contentStatus: 'populated' | 'template-only' | 'empty' = 'populated';
      let fileSize = 0;

      if (gitStatus.untracked.includes(filePath)) {
        status = 'new';
      } else if (gitStatus.modified.includes(filePath)) {
        status = 'modified';
      }
      
      if (gitStatus.staged.includes(filePath)) {
        staged = true;
      }

      // Check file content status
      let templatePercentage: number | undefined;
      if (await fs.pathExists(fullPath)) {
        const stats = await fs.stat(fullPath);
        fileSize = stats.size;
        
        if (fileSize === 0) {
          contentStatus = 'empty';
          templatePercentage = 100; // Empty is 100% template
        } else {
          const content = await fs.readFile(fullPath, 'utf-8');
          const detectionResult = this.detectContentStatus(content, file);
          contentStatus = detectionResult.status;
          templatePercentage = detectionResult.templatePercentage;
        }
      } else {
        contentStatus = 'empty';
        templatePercentage = 100; // Missing file is 100% template
      }

      return {
        file,
        status,
        staged,
        contentStatus,
        templatePercentage,
        size: fileSize
      };
    }));

    return results;
  }

  /**
   * Detect if file content is mostly template/placeholder content
   * Returns status and percentage of template content (0-100)
   */
  private detectContentStatus(content: string, fileName: string): {
    status: 'populated' | 'template-only' | 'empty';
    templatePercentage: number;
  } {
    if (!content || content.trim().length === 0) {
      return { status: 'empty', templatePercentage: 100 };
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
      const isTemplateLine = 
        trimmed.startsWith('<!--') ||
        trimmed.includes('GUIDANCE:') ||
        trimmed.includes('TIP:') ||
        trimmed.includes('Example:') ||
        trimmed.startsWith('*') && (trimmed.includes('Last Updated') || trimmed.includes('References') || trimmed.includes('This file')) ||
        trimmed === '-->';
      
      if (isTemplateLine) {
        templateChars += line.length;
      }
    }
    
    // Calculate percentage
    const templatePercentage = totalChars > 0 
      ? Math.round((templateChars / totalChars) * 100)
      : 100;
    
    // Count actual content lines
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
    
    // Determine status based on percentage (unified threshold: 70%)
    // If very few content lines, consider it template-only even if percentage is lower
    let status: 'populated' | 'template-only' | 'empty';
    if (templatePercentage >= 70 || (contentLines.length <= 3 && templatePercentage > 30)) {
      status = 'template-only';
      // If low content lines but percentage is borderline, adjust to reflect severity
      if (contentLines.length <= 3 && templatePercentage <= 70) {
        return { status, templatePercentage: Math.max(templatePercentage, 70) };
      }
    } else {
      status = 'populated';
    }

    return { status, templatePercentage };
  }
} 