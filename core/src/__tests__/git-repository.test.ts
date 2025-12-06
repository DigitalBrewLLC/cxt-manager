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
  });
});

