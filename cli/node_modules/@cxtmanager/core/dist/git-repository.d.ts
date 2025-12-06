import { GitInfo } from './types';
/**
 * GitRepository - Handles all Git operations for CxtManager
 * Implements Git-like commands and ensures .cxt/ folder is tracked
 */
export declare class GitRepository {
    private git;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Ensure Git repository exists, initialize if needed
     */
    ensureGitRepo(): Promise<void>;
    /**
     * Check if current directory is a Git repository
     */
    isGitRepo(): Promise<boolean>;
    /**
     * Add files and create a commit
     */
    addAndCommit(files: string | string[], message: string, author?: string): Promise<void>;
    /**
     * Get current Git status
     */
    getStatus(): Promise<{
        staged: string[];
        modified: string[];
        untracked: string[];
    }>;
    /**
     * Get Git repository information
     */
    getInfo(): Promise<GitInfo>;
    /**
     * Get file blame information
     */
    blame(filePath: string): Promise<any[]>;
    /**
     * Get commit log for a file
     */
    getFileHistory(filePath: string): Promise<any[]>;
    /**
     * Get diff for a file or between commits
     */
    getDiff(filePath?: string, fromCommit?: string, toCommit?: string): Promise<string>;
    /**
     * Checkout a specific commit or branch
     */
    checkout(target: string): Promise<void>;
    /**
     * Get list of branches
     */
    getBranches(): Promise<{
        current: string;
        all: string[];
    }>;
    private getCommitCount;
    private parseBlameOutput;
    /**
     * Ensure .gitignore exists and configure .cxt/ tracking
     * @param trackInGit - If false, adds .cxt/ to .gitignore for privacy (default: true)
     */
    ensureGitignore(trackInGit?: boolean): Promise<void>;
}
//# sourceMappingURL=git-repository.d.ts.map