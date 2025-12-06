import { ContextManager } from '../context-manager';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('ContextManager', () => {
  let testDir: string;
  let manager: ContextManager;

  beforeEach(() => {
    // Create a temporary directory for each test
    testDir = path.join(os.tmpdir(), `cxtmanager-test-${Date.now()}`);
    fs.ensureDirSync(testDir);
    manager = new ContextManager(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('isInitialized', () => {
    it('should return false when .cxt folder does not exist', async () => {
      const result = await manager.isInitialized();
      expect(result).toBe(false);
    });

    it('should return false when .cxt folder exists but config does not', async () => {
      await fs.ensureDir(path.join(testDir, '.cxt'));
      const result = await manager.isInitialized();
      expect(result).toBe(false);
    });

    it('should return true when both .cxt folder and config exist', async () => {
      await fs.ensureDir(path.join(testDir, '.cxt'));
      await fs.writeJson(path.join(testDir, '.cxt', '.cxtconfig.json'), {
        version: '1.0.0',
        mode: 'auto'
      });
      const result = await manager.isInitialized();
      expect(result).toBe(true);
    });
  });
});

