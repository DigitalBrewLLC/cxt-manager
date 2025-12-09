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

    it('should format author string properly when author is just a name', async () => {
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
      
      // Use 'CxtManager Init' which should be formatted to use Git user's info
      await gitRepo.addAndCommit(['test.txt'], 'Test commit', 'CxtManager Init');
      
      const log = await git.log();
      expect(log.total).toBe(1);
      expect(log.latest?.message).toBe('Test commit');
      // Author should be formatted as "Test User <test@example.com>"
      expect(log.latest?.author_name).toBe('Test User');
      expect(log.latest?.author_email).toBe('test@example.com');
    });

    it('should use fallback author when Git user is not configured', async () => {
      const git = simpleGit(testDir);
      await git.init();
      
      // Don't set Git user config - should use fallback
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      
      // Capture console.warn output
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await gitRepo.addAndCommit(['test.txt'], 'Test commit', 'CxtManager Init');
      
      // Should have warned about using fallback
      expect(warnSpy).toHaveBeenCalled();
      const warnCalls = warnSpy.mock.calls.flat().join(' ');
      expect(warnCalls).toContain('Warning: Git user information not configured');
      expect(warnCalls).toContain('CxtManager <noreply@cxtmanager.dev>');
      expect(warnCalls).toContain('git config --global user.name');
      
      warnSpy.mockRestore();
      
      const log = await git.log();
      expect(log.total).toBe(1);
      // Should use fallback author
      expect(log.latest?.author_name).toBe('CxtManager');
      expect(log.latest?.author_email).toBe('noreply@cxtmanager.dev');
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
  });

});

