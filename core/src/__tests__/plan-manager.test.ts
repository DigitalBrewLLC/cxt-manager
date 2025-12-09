import { PlanManager } from '../plan-manager';
import { GitRepository } from '../git-repository';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import type { CxtConfig } from '../types';

describe('PlanManager', () => {
  let testDir: string;
  let gitRepo: GitRepository;
  let manager: PlanManager;
  let config: CxtConfig;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `cxtmanager-plan-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    
    // Initialize git repo
    gitRepo = new GitRepository(testDir);
    await gitRepo.ensureGitRepo();
    
    // Set git user for commits
    const { execSync } = require('child_process');
    execSync('git config user.name "Test User"', { cwd: testDir });
    execSync('git config user.email "test@example.com"', { cwd: testDir });
    
    // Create .cxt directory
    const cxtDir = path.join(testDir, '.cxt');
    await fs.ensureDir(cxtDir);
    
    // Default config
    config = {
      version: '1.0.0',
      mode: 'blank',
      git_integration: {
        enabled: true,
        hooks: {},
        silent_mode: true,
        auto_install_hooks: false,
        track_in_git: true
      },
      plan_management: {
        backup_on_switch: true,
        // auto_commit_ai_changes and archive_completed removed
      },
      context: {
        health_checks: true,
        ai_attribution: true,
        drift_detection: true,
        warn_threshold: 3,
        content_quality: {
          min_content_length: 100,
          min_content_lines: 3,
          empty_section_warning: true,
          short_content_warning: 200
        }
      },
      created: new Date().toISOString()
    };
    
    manager = new PlanManager(cxtDir, gitRepo, config);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('createBlankPlan - respects init mode', () => {
    it('should create blank plan when config.mode is blank', async () => {
      config.mode = 'blank';
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      await manager.createBlankPlan();
      
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      expect(await fs.pathExists(planPath)).toBe(true);
      
      const content = await fs.readFile(planPath, 'utf-8');
      expect(content).toContain('# Development Plan');
      expect(content).not.toContain('GUIDANCE');
      expect(content).not.toContain('##');
    });

    it('should create template plan when config.mode is template', async () => {
      config.mode = 'template';
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      await manager.createBlankPlan('template');
      
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      expect(await fs.pathExists(planPath)).toBe(true);
      
      const content = await fs.readFile(planPath, 'utf-8');
      expect(content).toContain('# Current Branch Implementation');
      expect(content).toContain('GUIDANCE');
      expect(content).toContain('##');
    });

    it('should respect plan_management.plan_template_style override', async () => {
      config.mode = 'template'; // Init was template
      config.plan_management!.plan_template_style = 'blank'; // But override to blank
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      await manager.createBlankPlan();
      
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      const content = await fs.readFile(planPath, 'utf-8');
      
      // Should use blank despite init mode being template
      expect(content).toContain('# Development Plan');
      expect(content).not.toContain('GUIDANCE');
      expect(content).not.toContain('##');
    });

    it('should use config.mode when plan_template_style is not set', async () => {
      config.mode = 'blank';
      config.plan_management!.plan_template_style = undefined;
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      await manager.createBlankPlan();
      
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      const content = await fs.readFile(planPath, 'utf-8');
      
      // Should use config.mode (blank)
      expect(content).toContain('# Development Plan');
      expect(content).not.toContain('GUIDANCE');
    });

    it('should use template when template mode is set', async () => {
      config.mode = 'template';
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      await manager.createBlankPlan();
      
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      const content = await fs.readFile(planPath, 'utf-8');
      
      // Should use template (structured with guidance)
      expect(content).toContain('# Current Branch Implementation');
      expect(content).toContain('GUIDANCE');
      expect(content).toContain('##');
    });
  });

  describe('syncPlan - backup_on_switch', () => {
    it('should backup plan when backup_on_switch is true', async () => {
      config.plan_management!.backup_on_switch = true;
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      // Create initial plan
      await manager.createBlankPlan();
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      await fs.writeFile(planPath, '# Test Plan\n\nInitial content');
      
      // Create state file to simulate branch switch
      const statePath = path.join(testDir, '.cxt', '.plan-state.json');
      await fs.writeJson(statePath, { lastBranch: 'feature-branch' });
      
      // Switch to new branch (simulated)
      const { execSync } = require('child_process');
      execSync('git checkout -b main', { cwd: testDir });
      
      await manager.syncPlan({ silent: true });
      
      // Plan should be backed up
      const backupPath = path.join(testDir, '.cxt', '.plan-history', 'feature-branch.md');
      expect(await fs.pathExists(backupPath)).toBe(true);
      
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      expect(backupContent).toContain('Initial content');
    });

    it('should not backup plan when backup_on_switch is false', async () => {
      config.plan_management!.backup_on_switch = false;
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      // Create initial plan
      await manager.createBlankPlan();
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      await fs.writeFile(planPath, '# Test Plan\n\nInitial content');
      
      // Create state file to simulate branch switch
      const statePath = path.join(testDir, '.cxt', '.plan-state.json');
      await fs.writeJson(statePath, { lastBranch: 'feature-branch' });
      
      // Switch to new branch (simulated)
      const { execSync } = require('child_process');
      execSync('git checkout -b main', { cwd: testDir });
      
      await manager.syncPlan({ silent: true });
      
      // Plan should NOT be backed up
      const backupPath = path.join(testDir, '.cxt', '.plan-history', 'feature-branch.md');
      expect(await fs.pathExists(backupPath)).toBe(false);
    });

    it('should backup plan when backup_on_switch is undefined (defaults to true)', async () => {
      config.plan_management!.backup_on_switch = undefined as any;
      manager = new PlanManager(path.join(testDir, '.cxt'), gitRepo, config);
      
      // Create initial plan
      await manager.createBlankPlan();
      const planPath = path.join(testDir, '.cxt', 'plan.md');
      await fs.writeFile(planPath, '# Test Plan\n\nInitial content');
      
      // Create state file to simulate branch switch
      const statePath = path.join(testDir, '.cxt', '.plan-state.json');
      await fs.writeJson(statePath, { lastBranch: 'feature-branch' });
      
      // Switch to new branch (simulated)
      const { execSync } = require('child_process');
      execSync('git checkout -b main', { cwd: testDir });
      
      await manager.syncPlan({ silent: true });
      
      // Plan should be backed up (default behavior)
      const backupPath = path.join(testDir, '.cxt', '.plan-history', 'feature-branch.md');
      expect(await fs.pathExists(backupPath)).toBe(true);
    });
  });
});

