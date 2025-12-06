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
exports.GitRepository = void 0;
const simple_git_1 = require("simple-git");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * GitRepository - Handles all Git operations for CxtManager
 * Implements Git-like commands and ensures .cxt/ folder is tracked
 */
class GitRepository {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.git = (0, simple_git_1.simpleGit)(projectRoot);
    }
    /**
     * Ensure Git repository exists, initialize if needed
     */
    async ensureGitRepo() {
        const isRepo = await this.isGitRepo();
        if (!isRepo) {
            console.log('📁 Initializing Git repository...');
            await this.git.init();
            // Create .gitignore if it doesn't exist (trackInGit will be set later)
            await this.ensureGitignore(true);
        }
    }
    /**
     * Check if current directory is a Git repository
     */
    async isGitRepo() {
        try {
            await this.git.status();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Add files and create a commit
     */
    async addAndCommit(files, message, author) {
        if (!await this.isGitRepo()) {
            throw new Error('Not a Git repository.\n' +
                '  💡 Run "git init" to initialize a Git repository\n' +
                '  💡 Or run "cit init" which will initialize Git automatically');
        }
        // Ensure files is an array
        const fileArray = Array.isArray(files) ? files : [files];
        try {
            // Add files to staging
            await this.git.add(fileArray);
            // Create commit with optional author attribution
            if (author) {
                await this.git.commit(message, undefined, {
                    '--author': author
                });
            }
            else {
                await this.git.commit(message);
            }
        }
        catch (error) {
            if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
                throw new Error('Permission denied. Cannot write to Git repository.\n' +
                    '  💡 Check file system permissions\n' +
                    '  💡 Ensure you have write access to .git/ directory');
            }
            if (error.message.includes('not a git repository')) {
                throw new Error('Not a Git repository.\n' +
                    '  💡 Run "git init" to initialize a Git repository\n' +
                    '  💡 Or run "cit init" which will initialize Git automatically');
            }
            throw error;
        }
    }
    /**
     * Get current Git status
     */
    async getStatus() {
        if (!await this.isGitRepo()) {
            throw new Error('Not a Git repository.\n' +
                '  💡 Run "git init" to initialize a Git repository\n' +
                '  💡 Or run "cit init" which will initialize Git automatically');
        }
        try {
            const status = await this.git.status();
            return {
                staged: status.staged,
                modified: status.modified,
                untracked: status.not_added
            };
        }
        catch (error) {
            if (error.message.includes('not a git repository')) {
                throw new Error('Not a Git repository.\n' +
                    '  💡 Run "git init" to initialize a Git repository\n' +
                    '  💡 Or run "cit init" which will initialize Git automatically');
            }
            throw error;
        }
    }
    /**
     * Get Git repository information
     */
    async getInfo() {
        if (!await this.isGitRepo()) {
            return {
                isRepo: false,
                branch: '',
                hasRemote: false,
                commitCount: 0,
                lastCommit: undefined
            };
        }
        try {
            const [status, branches, log] = await Promise.all([
                this.git.status(),
                this.git.branch(),
                this.git.log({ maxCount: 1 }).catch(() => null)
            ]);
            const commitCount = await this.getCommitCount();
            // Check for remote
            const remotes = await this.git.getRemotes(true);
            const hasRemote = remotes.length > 0;
            const remoteUrl = hasRemote ? remotes[0].refs.fetch : undefined;
            // Build lastCommit object if we have log data
            let lastCommit = undefined;
            if (log?.latest) {
                lastCommit = {
                    hash: log.latest.hash,
                    message: log.latest.message,
                    author: log.latest.author_name,
                    date: new Date(log.latest.date)
                };
            }
            return {
                isRepo: true,
                branch: branches.current,
                hasRemote,
                remoteUrl,
                commitCount,
                lastCommit
            };
        }
        catch (error) {
            return {
                isRepo: true,
                branch: '',
                hasRemote: false,
                commitCount: 0,
                lastCommit: undefined
            };
        }
    }
    /**
     * Get file blame information
     */
    async blame(filePath) {
        try {
            const blame = await this.git.raw(['blame', '--line-porcelain', filePath]);
            return this.parseBlameOutput(blame);
        }
        catch (error) {
            console.warn(`Could not get blame for ${filePath}:`, error);
            return [];
        }
    }
    /**
     * Get commit log for a file
     */
    async getFileHistory(filePath) {
        try {
            const log = await this.git.log({ file: filePath });
            return log.all.map(commit => ({
                hash: commit.hash,
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email,
                date: new Date(commit.date),
                refs: commit.refs
            }));
        }
        catch (error) {
            console.warn(`Could not get history for ${filePath}:`, error);
            return [];
        }
    }
    /**
     * Get diff for a file or between commits
     */
    async getDiff(filePath, fromCommit, toCommit) {
        try {
            const options = ['diff'];
            if (fromCommit) {
                options.push(fromCommit);
                if (toCommit) {
                    options.push(toCommit);
                }
            }
            if (filePath) {
                options.push('--', filePath);
            }
            return await this.git.raw(options);
        }
        catch (error) {
            console.warn('Could not get diff:', error);
            return '';
        }
    }
    /**
     * Checkout a specific commit or branch
     */
    async checkout(target) {
        await this.git.checkout(target);
    }
    /**
     * Get list of branches
     */
    async getBranches() {
        const branches = await this.git.branch();
        return {
            current: branches.current,
            all: branches.all
        };
    }
    // Private helper methods
    async getCommitCount() {
        try {
            const result = await this.git.raw(['rev-list', '--count', 'HEAD']);
            return parseInt(result.trim(), 10);
        }
        catch {
            return 0;
        }
    }
    parseBlameOutput(blameText) {
        // TODO: Implement proper blame parsing
        // This is a simplified version - full implementation would parse the porcelain format
        const lines = blameText.split('\n');
        return lines.map((line, index) => ({
            line: index + 1,
            content: line,
            author: 'unknown',
            hash: 'unknown',
            timestamp: new Date()
        }));
    }
    /**
     * Ensure .gitignore exists and configure .cxt/ tracking
     * @param trackInGit - If false, adds .cxt/ to .gitignore for privacy (default: true)
     */
    async ensureGitignore(trackInGit = true) {
        const gitignorePath = path.join(this.projectRoot, '.gitignore');
        // Default .gitignore content for CxtManager projects
        const defaultGitignore = `# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local

# IDE files
.vscode/settings.json
.idea/

# OS files
.DS_Store
Thumbs.db

${trackInGit ? '# CxtManager: Track .cxt/ folder - this is important!\n# .cxt/ folder should be committed to share context with team' : '# CxtManager: .cxt/ folder is private (not tracked in Git)\n.cxt/'}
`;
        if (!await fs.pathExists(gitignorePath)) {
            await fs.writeFile(gitignorePath, defaultGitignore);
        }
        else {
            const gitignore = await fs.readFile(gitignorePath, 'utf-8');
            const hasCxtIgnore = gitignore.includes('.cxt/') || gitignore.includes('.cxt');
            if (trackInGit && hasCxtIgnore) {
                // Remove .cxt/ from gitignore if it exists (only CxtManager entries)
                const lines = gitignore.split('\n');
                const updated = lines
                    .filter((line, index) => {
                    // Remove lines that are .cxt/ or .cxt (with or without comment)
                    const trimmed = line.trim();
                    if (trimmed === '.cxt/' || trimmed === '.cxt' || trimmed.startsWith('.cxt/') || trimmed.startsWith('.cxt ')) {
                        // Also remove preceding CxtManager comment if present
                        if (index > 0 && lines[index - 1].includes('CxtManager')) {
                            return false; // Remove comment line too
                        }
                        return false;
                    }
                    // Remove CxtManager comment lines about .cxt/
                    if (trimmed.includes('CxtManager') && (trimmed.includes('.cxt/') || trimmed.includes('.cxt'))) {
                        return false;
                    }
                    return true;
                })
                    .join('\n');
                await fs.writeFile(gitignorePath, updated);
                console.log('✅ Removed .cxt/ from .gitignore (context will be tracked in Git)');
            }
            else if (!trackInGit && !hasCxtIgnore) {
                // Add .cxt/ to gitignore
                const updated = gitignore.trim() + '\n\n# CxtManager: .cxt/ folder is private (not tracked in Git)\n.cxt/\n';
                await fs.writeFile(gitignorePath, updated);
                console.log('✅ Added .cxt/ to .gitignore (context will remain private)');
            }
        }
    }
}
exports.GitRepository = GitRepository;
//# sourceMappingURL=git-repository.js.map