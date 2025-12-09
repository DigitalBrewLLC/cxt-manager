import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GitInfo, CommitHistoryEntry, BlameEntry } from './types';

/**
 * GitRepository - Handles all Git operations for CxtManager
 * Implements Git-like commands and ensures .cxt/ folder is tracked
 */
export class GitRepository {
  private git: SimpleGit;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.git = simpleGit(projectRoot);
  }

  /**
   * Ensure Git repository exists, initialize if needed
   */
  async ensureGitRepo(): Promise<void> {
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
  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current Git user configuration
   */
  async getGitUser(): Promise<{ name: string; email: string; usedFallback: boolean }> {
    try {
      let name: string | null = null;
      let email: string | null = null;
      
      // Try to get user.name from local config, then global
      try {
        const nameConfig = await this.git.getConfig('user.name', 'local');
        name = nameConfig.value || null;
      } catch {
        try {
          const nameConfig = await this.git.getConfig('user.name', 'global');
          name = nameConfig.value || null;
        } catch {
          name = null;
        }
      }
      
      // Try to get user.email from local config, then global
      try {
        const emailConfig = await this.git.getConfig('user.email', 'local');
        email = emailConfig.value || null;
      } catch {
        try {
          const emailConfig = await this.git.getConfig('user.email', 'global');
          email = emailConfig.value || null;
        } catch {
          email = null;
        }
      }
      
      const usedFallback = !name || !email;
      
      return {
        name: name || 'CxtManager',
        email: email || 'noreply@cxtmanager.dev',
        usedFallback
      };
    } catch {
      // Fallback if we can't get Git config
      return {
        name: 'CxtManager',
        email: 'noreply@cxtmanager.dev',
        usedFallback: true
      };
    }
  }

  /**
   * Add files and create a commit
   */
  async addAndCommit(files: string | string[], message: string, author?: string): Promise<void> {
    if (!await this.isGitRepo()) {
      throw new Error(
        'Not a Git repository.\n' +
        '  💡 Run "git init" to initialize a Git repository\n' +
        '  💡 Or run "cit init" which will initialize Git automatically'
      );
    }
    
    // Ensure files is an array
    const fileArray = Array.isArray(files) ? files : [files];
    
    try {
      // Add files to staging
      await this.git.add(fileArray);
      
      // Create commit with optional author attribution
      if (author) {
        // If author is provided but not in proper format, try to format it
        let authorString = author;
        let usedFallback = false;
        
        // Check if author is already in "Name <email>" format
        if (!author.includes('<') || !author.includes('>')) {
          // If it's just a name, get current Git user and use their email
          // Or use a properly formatted fallback
          if (author === 'CxtManager Init' || author === 'CxtManager') {
            const gitUser = await this.getGitUser();
            authorString = `${gitUser.name} <${gitUser.email}>`;
            usedFallback = gitUser.usedFallback;
          } else {
            // Try to get current Git user email for the provided name
            const gitUser = await this.getGitUser();
            authorString = `${author} <${gitUser.email}>`;
            usedFallback = gitUser.usedFallback;
          }
        }
        
        // Warn if we're using fallback Git user info
        if (usedFallback) {
          console.warn('');
          console.warn('⚠️  Warning: Git user information not configured');
          console.warn('   Using fallback author: CxtManager <noreply@cxtmanager.dev>');
          console.warn('   To get accurate git blame, configure your Git user:');
          console.warn('     git config --global user.name "Your Name"');
          console.warn('     git config --global user.email "your.email@example.com"');
          console.warn('');
        }
        
        await this.git.commit(message, undefined, {
          '--author': authorString
        });
      } else {
        await this.git.commit(message);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
        throw new Error(
          'Permission denied. Cannot write to Git repository.\n' +
          '  💡 Check file system permissions\n' +
          '  💡 Ensure you have write access to .git/ directory'
        );
      }
      if (errorMessage.includes('not a git repository')) {
        throw new Error(
          'Not a Git repository.\n' +
          '  💡 Run "git init" to initialize a Git repository\n' +
          '  💡 Or run "cit init" which will initialize Git automatically'
        );
      }
      if (errorMessage.includes('--author') && errorMessage.includes('not')) {
        // Handle author format errors more gracefully
        // Try committing without author override, using Git's default user
        try {
          await this.git.commit(message);
        } catch (retryError) {
          throw error; // Re-throw original error if retry fails
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Get current Git status
   */
  async getStatus(): Promise<{
    staged: string[];
    modified: string[];
    untracked: string[];
  }> {
    if (!await this.isGitRepo()) {
      throw new Error(
        'Not a Git repository.\n' +
        '  💡 Run "git init" to initialize a Git repository\n' +
        '  💡 Or run "cit init" which will initialize Git automatically'
      );
    }
    
    try {
      const status: StatusResult = await this.git.status();
      
      return {
        staged: status.staged,
        modified: status.modified,
        untracked: status.not_added
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not a git repository')) {
        throw new Error(
          'Not a Git repository.\n' +
          '  💡 Run "git init" to initialize a Git repository\n' +
          '  💡 Or run "cit init" which will initialize Git automatically'
        );
      }
      throw error;
    }
  }

  /**
   * Get Git repository information
   */
  async getInfo(): Promise<GitInfo> {
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
      let lastCommit: GitInfo['lastCommit'] = undefined;
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
    } catch (error) {
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
  async blame(filePath: string): Promise<BlameEntry[]> {
    try {
      const blame = await this.git.raw(['blame', '--line-porcelain', filePath]);
      return this.parseBlameOutput(blame);
    } catch (error) {
      console.warn(`Could not get blame for ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Get commit log for a file
   */
  async getFileHistory(filePath: string): Promise<CommitHistoryEntry[]> {
    try {
      const log = await this.git.log({ file: filePath });
      return log.all.map((commit: { hash: string; message: string; author_name: string; author_email: string; date: string; refs?: string }): CommitHistoryEntry => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
        date: new Date(commit.date),
        refs: commit.refs
      }));
    } catch (error) {
      console.warn(`Could not get history for ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Get diff for a file or between commits
   */
  async getDiff(filePath?: string, fromCommit?: string, toCommit?: string): Promise<string> {
    try {
      const options: string[] = ['diff'];
      
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
    } catch (error) {
      console.warn('Could not get diff:', error);
      return '';
    }
  }

  /**
   * Checkout a specific commit or branch
   */
  async checkout(target: string): Promise<void> {
    await this.git.checkout(target);
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<{ current: string; all: string[] }> {
    const branches = await this.git.branch();
    return {
      current: branches.current,
      all: branches.all
    };
  }

  // Private helper methods

  private async getCommitCount(): Promise<number> {
    try {
      const result = await this.git.raw(['rev-list', '--count', 'HEAD']);
      return parseInt(result.trim(), 10);
    } catch {
      return 0;
    }
  }

  private parseBlameOutput(blameText: string): BlameEntry[] {
    // TODO: Implement proper blame parsing
    // This is a simplified version - full implementation would parse the porcelain format
    const lines = blameText.split('\n');
    return lines.map((line, index): BlameEntry => ({
      line: index + 1,
      content: line,
      author: 'unknown',
      email: 'unknown',
      hash: 'unknown',
      date: new Date()
    }));
  }

  /**
   * Ensure .gitignore exists and configure .cxt/ tracking
   * @param trackInGit - If false, adds .cxt/ to .gitignore for privacy (default: true)
   */
  async ensureGitignore(trackInGit: boolean = true): Promise<void> {
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
    } else {
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
      } else if (!trackInGit && !hasCxtIgnore) {
        // Add .cxt/ to gitignore
        const updated = gitignore.trim() + '\n\n# CxtManager: .cxt/ folder is private (not tracked in Git)\n.cxt/\n';
        await fs.writeFile(gitignorePath, updated);
        console.log('✅ Added .cxt/ to .gitignore (context will remain private)');
      }
    }
  }
} 