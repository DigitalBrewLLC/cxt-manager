import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GitInfo } from './types';

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
      
      // Create .gitignore if it doesn't exist
      await this.ensureGitignore();
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
        await this.git.commit(message, undefined, {
          '--author': author
        });
      } else {
        await this.git.commit(message);
      }
    } catch (error: any) {
      if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
        throw new Error(
          'Permission denied. Cannot write to Git repository.\n' +
          '  💡 Check file system permissions\n' +
          '  💡 Ensure you have write access to .git/ directory'
        );
      }
      if (error.message.includes('not a git repository')) {
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
    } catch (error: any) {
      if (error.message.includes('not a git repository')) {
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
  async blame(filePath: string): Promise<any[]> {
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
  async getFileHistory(filePath: string): Promise<any[]> {
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

  private parseBlameOutput(blameText: string): any[] {
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

  private async ensureGitignore(): Promise<void> {
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

# CxtManager: Track .cxt/ folder - this is important!
# .cxt/ folder should be committed to share context with team
`;

    if (!await fs.pathExists(gitignorePath)) {
      await fs.writeFile(gitignorePath, defaultGitignore);
    } else {
      // Check if .cxt/ is already in gitignore and warn if it is
      const gitignore = await fs.readFile(gitignorePath, 'utf-8');
      if (gitignore.includes('.cxt/') || gitignore.includes('.cxt')) {
        console.warn('⚠️  Warning: .cxt/ folder appears to be in .gitignore');
        console.warn('   CxtManager context should be tracked in Git for team sharing');
      }
    }
  }
} 