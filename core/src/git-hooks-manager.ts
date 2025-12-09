import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { CxtConfig } from './types';

export class GitHooksManager {
  private projectRoot: string;
  private hooksPath: string;
  private config: CxtConfig;

  constructor(projectRoot: string, config: CxtConfig) {
    this.projectRoot = projectRoot;
    this.hooksPath = path.join(projectRoot, '.git', 'hooks');
    this.config = config;
  }

  /**
   * Install all configured hooks
   */
  async installHooks(): Promise<void> {
    const gitIntegration = this.config.git_integration;
    
    if (!gitIntegration || !gitIntegration.enabled) {
      return; // Hooks not enabled
    }

    // Ensure .git/hooks directory exists
    await fs.ensureDir(this.hooksPath);

    const hooks = gitIntegration.hooks;
    
    // Install post-checkout hook
    if (hooks.post_checkout) {
      await this.installHook('post-checkout', hooks.post_checkout);
    }

    // Install pre-commit hook
    if (hooks.pre_commit) {
      await this.installHook('pre-commit', hooks.pre_commit);
    }

    // Install post-merge hook
    if (hooks.post_merge) {
      await this.installHook('post-merge', hooks.post_merge);
    }
  }

  /**
   * Install specific hook
   */
  async installHook(hookName: 'post-checkout' | 'pre-commit' | 'post-merge', command: string): Promise<void> {
    const hookPath = path.join(this.hooksPath, hookName);
    const isWindows = os.platform() === 'win32';
    
    // Check if hook already exists
    if (await fs.pathExists(hookPath)) {
      const existingContent = await fs.readFile(hookPath, 'utf-8');
      
      // If it's already a cxt-manager hook, replace it
      if (existingContent.includes('cxt-manager')) {
        // Replace existing cxt-manager hook
      } else {
        // Existing hook from another tool - append cxt-manager hook
        // This allows multiple tools to coexist
        const newScript = this.getHookScript(hookName, command, isWindows);
        const combinedScript = `${existingContent}\n\n${newScript}`;
        await fs.writeFile(hookPath, combinedScript, { mode: 0o755 });
        return;
      }
    }
    
    // Write new hook script
    const script = this.getHookScript(hookName, command, isWindows);
    await fs.writeFile(hookPath, script, { mode: 0o755 });
  }

  /**
   * Get hook script (unified method)
   */
  private getHookScript(hookName: string, command: string, isWindows: boolean): string {
    if (isWindows) {
      return this.getPowerShellHookScript(hookName, command);
    } else {
      return this.getBashHookScript(hookName, command);
    }
  }

  /**
   * Remove all cxt-manager hooks
   */
  async removeHooks(): Promise<void> {
    const hooks = ['post-checkout', 'pre-commit', 'post-merge'];
    
    for (const hookName of hooks) {
      const hookPath = path.join(this.hooksPath, hookName);
      
      if (await fs.pathExists(hookPath)) {
        const content = await fs.readFile(hookPath, 'utf-8');
        
        // Only remove if it's a cxt-manager hook
        if (content.includes('cxt-manager')) {
          await fs.remove(hookPath);
        }
      }
    }
  }

  /**
   * Check if hooks are installed
   */
  async areHooksInstalled(): Promise<boolean> {
    const gitIntegration = this.config.git_integration;
    
    if (!gitIntegration || !gitIntegration.enabled) {
      return false;
    }

    const hooks = gitIntegration.hooks;
    const requiredHooks: Array<'post-checkout' | 'pre-commit' | 'post-merge'> = [];
    
    if (hooks.post_checkout) requiredHooks.push('post-checkout');
    if (hooks.pre_commit) requiredHooks.push('pre-commit');
    if (hooks.post_merge) requiredHooks.push('post-merge');

    for (const hookName of requiredHooks) {
      const hookPath = path.join(this.hooksPath, hookName);
      if (!await fs.pathExists(hookPath)) {
        return false;
      }
      
      const content = await fs.readFile(hookPath, 'utf-8');
      if (!content.includes('cxt-manager')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get list of installed hooks
   */
  async getInstalledHooks(): Promise<string[]> {
    const installed: string[] = [];
    const hooks = ['post-checkout', 'pre-commit', 'post-merge'];
    
    for (const hookName of hooks) {
      const hookPath = path.join(this.hooksPath, hookName);
      
      if (await fs.pathExists(hookPath)) {
        const content = await fs.readFile(hookPath, 'utf-8');
        if (content.includes('cxt-manager')) {
          installed.push(hookName);
        }
      }
    }
    
    return installed;
  }

  /**
   * Get bash hook script content (macOS/Linux)
   */
  private getBashHookScript(hookName: string, command: string): string {
    const silentFlag = this.config.git_integration?.silent_mode ? '--silent' : '';
    const commandWithFlags = command.includes('validate') ? `${command} --quick ${silentFlag}` :
                            `${command} ${silentFlag}`;
    
    return `#!/bin/sh
# cxt-manager: ${hookName} hook
# This hook was installed by cxt-manager (cit init)
# To remove: cit hooks remove

# Check if cit is available (don't fail if not in PATH)
if command -v cit >/dev/null 2>&1; then
  cit ${commandWithFlags} || true
fi
exit 0
`;
  }

  /**
   * Get PowerShell hook script content (Windows)
   */
  private getPowerShellHookScript(hookName: string, command: string): string {
    const silentFlag = this.config.git_integration?.silent_mode ? '--silent' : '';
    const commandWithFlags = command.includes('validate') ? `${command} --quick ${silentFlag}` :
                            `${command} ${silentFlag}`;
    
    return `#!/usr/bin/env pwsh
# cxt-manager: ${hookName} hook
# This hook was installed by cxt-manager (cit init)
# To remove: cit hooks remove

# Check if cit is available (don't fail if not in PATH)
if (Get-Command cit -ErrorAction SilentlyContinue) {
    cit ${commandWithFlags}
}
exit 0  # Don't block git operations on errors
`;
  }
}

