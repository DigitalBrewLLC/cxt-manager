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
exports.GitHooksManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class GitHooksManager {
    constructor(projectRoot, config) {
        this.projectRoot = projectRoot;
        this.hooksPath = path.join(projectRoot, '.git', 'hooks');
        this.config = config;
    }
    /**
     * Install all configured hooks
     */
    async installHooks() {
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
    async installHook(hookName, command) {
        const hookPath = path.join(this.hooksPath, hookName);
        const isWindows = os.platform() === 'win32';
        // Check if hook already exists
        if (await fs.pathExists(hookPath)) {
            const existingContent = await fs.readFile(hookPath, 'utf-8');
            // If it's already a CxtManager hook, replace it
            if (existingContent.includes('CxtManager')) {
                // Replace existing CxtManager hook
            }
            else {
                // Existing hook from another tool - append CxtManager hook
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
    getHookScript(hookName, command, isWindows) {
        if (isWindows) {
            return this.getPowerShellHookScript(hookName, command);
        }
        else {
            return this.getBashHookScript(hookName, command);
        }
    }
    /**
     * Remove all CxtManager hooks
     */
    async removeHooks() {
        const hooks = ['post-checkout', 'pre-commit', 'post-merge'];
        for (const hookName of hooks) {
            const hookPath = path.join(this.hooksPath, hookName);
            if (await fs.pathExists(hookPath)) {
                const content = await fs.readFile(hookPath, 'utf-8');
                // Only remove if it's a CxtManager hook
                if (content.includes('CxtManager')) {
                    await fs.remove(hookPath);
                }
            }
        }
    }
    /**
     * Check if hooks are installed
     */
    async areHooksInstalled() {
        const gitIntegration = this.config.git_integration;
        if (!gitIntegration || !gitIntegration.enabled) {
            return false;
        }
        const hooks = gitIntegration.hooks;
        const requiredHooks = [];
        if (hooks.post_checkout)
            requiredHooks.push('post-checkout');
        if (hooks.pre_commit)
            requiredHooks.push('pre-commit');
        if (hooks.post_merge)
            requiredHooks.push('post-merge');
        for (const hookName of requiredHooks) {
            const hookPath = path.join(this.hooksPath, hookName);
            if (!await fs.pathExists(hookPath)) {
                return false;
            }
            const content = await fs.readFile(hookPath, 'utf-8');
            if (!content.includes('CxtManager')) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get list of installed hooks
     */
    async getInstalledHooks() {
        const installed = [];
        const hooks = ['post-checkout', 'pre-commit', 'post-merge'];
        for (const hookName of hooks) {
            const hookPath = path.join(this.hooksPath, hookName);
            if (await fs.pathExists(hookPath)) {
                const content = await fs.readFile(hookPath, 'utf-8');
                if (content.includes('CxtManager')) {
                    installed.push(hookName);
                }
            }
        }
        return installed;
    }
    /**
     * Get bash hook script content (macOS/Linux)
     */
    getBashHookScript(hookName, command) {
        const silentFlag = this.config.git_integration?.silent_mode ? '--silent' : '';
        const commandWithFlags = command.includes('validate') ? `${command} --quick ${silentFlag}` :
            command.includes('auto-heal') ? `${command} --if-needed ${silentFlag}` :
                `${command} ${silentFlag}`;
        return `#!/bin/sh
# CxtManager: ${hookName} hook
# This hook was installed by CxtManager (cit init)
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
    getPowerShellHookScript(hookName, command) {
        const silentFlag = this.config.git_integration?.silent_mode ? '--silent' : '';
        const commandWithFlags = command.includes('validate') ? `${command} --quick ${silentFlag}` :
            command.includes('auto-heal') ? `${command} --if-needed ${silentFlag}` :
                `${command} ${silentFlag}`;
        return `#!/usr/bin/env pwsh
# CxtManager: ${hookName} hook
# This hook was installed by CxtManager (cit init)
# To remove: cit hooks remove

# Check if cit is available (don't fail if not in PATH)
if (Get-Command cit -ErrorAction SilentlyContinue) {
    cit ${commandWithFlags}
}
exit 0  # Don't block git operations on errors
`;
    }
}
exports.GitHooksManager = GitHooksManager;
//# sourceMappingURL=git-hooks-manager.js.map