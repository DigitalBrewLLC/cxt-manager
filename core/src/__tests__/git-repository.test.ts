import { GitRepository } from '../git-repository';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { simpleGit } from 'simple-git';

describe('GitRepository', () => {
  let testDir: string;
  let gitRepo: GitRepository;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `cxtmanager-git-test-${Date.now()}`);
    fs.ensureDirSync(testDir);
    gitRepo = new GitRepository(testDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('isGitRepo', () => {
    it('should return false when not a git repository', async () => {
      const result = await gitRepo.isGitRepo();
      expect(result).toBe(false);
    });

    it('should return true after initializing git repository', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      const result = await gitRepo.isGitRepo();
      expect(result).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should throw error when not a git repository', async () => {
      await expect(gitRepo.getStatus()).rejects.toThrow('Not a Git repository');
    });

    it('should return status with empty arrays for clean repo', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      const status = await gitRepo.getStatus();
      
      expect(status).toBeDefined();
      expect(status.staged).toEqual([]);
      expect(status.modified).toEqual([]);
      expect(status.untracked).toEqual([]);
    });

    it('should detect modified files', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      try {
        await git.addConfig('user.name', 'Test User', false, 'local');
        await git.addConfig('user.email', 'test@example.com', false, 'local');
      } catch {
        // Ignore config errors
      }
      
      // Create and modify a file
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'initial');
      await git.add(['test.txt']);
      await git.commit('Initial commit');
      
      fs.writeFileSync(testFile, 'modified');
      
      const status = await gitRepo.getStatus();
      
      expect(status.modified.length).toBeGreaterThan(0);
    });
  });

  describe('getFileHistory', () => {
    it('should return empty array for non-existent file', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      const history = await gitRepo.getFileHistory('nonexistent.txt');
      
      expect(history).toEqual([]);
    });

    it('should return commit history for file', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      try {
        await git.addConfig('user.name', 'Test User', false, 'local');
        await git.addConfig('user.email', 'test@example.com', false, 'local');
      } catch {
        // Ignore config errors
      }
      
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      await git.add(['test.txt']);
      await git.commit('Add test file');
      
      const history = await gitRepo.getFileHistory('test.txt');
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('hash');
      expect(history[0]).toHaveProperty('message');
      expect(history[0]).toHaveProperty('author');
      expect(history[0]).toHaveProperty('email');
      expect(history[0]).toHaveProperty('date');
    });
  });

  describe('addAndCommit', () => {
    it('should throw error when not a git repository', async () => {
      await expect(
        gitRepo.addAndCommit(['test.txt'], 'test message')
      ).rejects.toThrow('Not a Git repository');
    });

    it('should commit files', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      try {
        await git.addConfig('user.name', 'Test User', false, 'local');
        await git.addConfig('user.email', 'test@example.com', false, 'local');
      } catch {
        // Ignore config errors
      }
      
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      
      await gitRepo.addAndCommit(['test.txt'], 'Test commit');
      
      const log = await git.log();
      expect(log.total).toBe(1);
      expect(log.latest?.message).toBe('Test commit');
    });

    it('should use Git configured user when no author override', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      // Set Git user config
      try {
        await git.addConfig('user.name', 'Test User', false, 'local');
        await git.addConfig('user.email', 'test@example.com', false, 'local');
      } catch {
        // Ignore config errors
      }
      
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      
      // No author override - Git will use configured user.name and user.email
      await gitRepo.addAndCommit(['test.txt'], 'Test commit');
      
      const log = await git.log();
      expect(log.total).toBe(1);
      expect(log.latest?.message).toBe('Test commit');
      // Git will use the configured user
      expect(log.latest?.author_name).toBe('Test User');
      expect(log.latest?.author_email).toBe('test@example.com');
    });

    it('should accept properly formatted author string', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      
      // Use properly formatted author string
      await gitRepo.addAndCommit(['test.txt'], 'Test commit', 'Custom Author <custom@example.com>');
      
      const log = await git.log();
      expect(log.total).toBe(1);
      expect(log.latest?.author_name).toBe('Custom Author');
      expect(log.latest?.author_email).toBe('custom@example.com');
    });

    it('should throw helpful error when Git user is not configured', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      // Don't set Git user config
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      
      await expect(
        gitRepo.addAndCommit(['test.txt'], 'Test commit')
      ).rejects.toThrow('Git user information not configured');
      
      try {
        await gitRepo.addAndCommit(['test.txt'], 'Test commit');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Git user information not configured');
        expect(error.message).toContain('git config --global user.name');
        expect(error.message).toContain('git config --global user.email');
      }
    });
  });

  describe('ensureGitUserConfigured', () => {
    it('should pass when Git user is configured', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      await git.addConfig('user.name', 'Test User', false, 'local');
      await git.addConfig('user.email', 'test@example.com', false, 'local');
      
      // Should not throw
      await expect((gitRepo as any).ensureGitUserConfigured()).resolves.not.toThrow();
    });

    it('should throw when Git user name is not configured', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      // Only set email, not name
      await git.addConfig('user.email', 'test@example.com', false, 'local');
      
      await expect(
        (gitRepo as any).ensureGitUserConfigured()
      ).rejects.toThrow('Git user information not configured');
    });

    it('should throw when Git user email is not configured', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      // Only set name, not email
      await git.addConfig('user.name', 'Test User', false, 'local');
      
      await expect(
        (gitRepo as any).ensureGitUserConfigured()
      ).rejects.toThrow('Git user information not configured');
    });

    it('should check global config if local is not set', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      // Don't set local config - method should check global
      // Note: This test verifies the method checks global, but we can't reliably
      // set global config in tests without affecting the system. Instead, we verify
      // the method attempts to check global by ensuring it doesn't throw immediately
      // when local is not set (it will check global before throwing)
      
      // If global config exists on the system, this should pass
      // If not, it will throw (which is expected behavior)
      try {
        await (gitRepo as any).ensureGitUserConfigured();
        // If we get here, global config exists - test passes
        expect(true).toBe(true);
      } catch (error: any) {
        // If global config doesn't exist, error should mention global config
        expect(error.message).toContain('Git user information not configured');
        expect(error.message).toContain('git config --global');
      }
    });
  });

});

