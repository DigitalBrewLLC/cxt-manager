import { CxtConfig } from './types';
export declare class GitHooksManager {
    private projectRoot;
    private hooksPath;
    private config;
    constructor(projectRoot: string, config: CxtConfig);
    /**
     * Install all configured hooks
     */
    installHooks(): Promise<void>;
    /**
     * Install specific hook
     */
    installHook(hookName: 'post-checkout' | 'pre-commit' | 'post-merge', command: string): Promise<void>;
    /**
     * Get hook script (unified method)
     */
    private getHookScript;
    /**
     * Remove all CxtManager hooks
     */
    removeHooks(): Promise<void>;
    /**
     * Check if hooks are installed
     */
    areHooksInstalled(): Promise<boolean>;
    /**
     * Get list of installed hooks
     */
    getInstalledHooks(): Promise<string[]>;
    /**
     * Get bash hook script content (macOS/Linux)
     */
    private getBashHookScript;
    /**
     * Get PowerShell hook script content (Windows)
     */
    private getPowerShellHookScript;
}
//# sourceMappingURL=git-hooks-manager.d.ts.map