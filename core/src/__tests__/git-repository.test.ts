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
});

