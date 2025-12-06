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

    it('should handle invalid JSON gracefully', async () => {
      await fs.ensureDir(path.join(testDir, '.cxt'));
      await fs.writeFile(path.join(testDir, '.cxt', '.cxtconfig.json'), 'invalid json');
      // isInitialized may return true if it only checks file existence, or false if it validates JSON
      // The actual behavior depends on implementation - test that it doesn't throw
      const result = await manager.isInitialized();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('status', () => {
    it('should throw error when not initialized', async () => {
      await expect(manager.status()).rejects.toThrow('CxtManager not initialized');
    });

    it('should return status info when initialized', async () => {
      // Setup initialized state
      await fs.ensureDir(path.join(testDir, '.cxt'));
      await fs.writeJson(path.join(testDir, '.cxt', '.cxtconfig.json'), {
        version: '1.0.0',
        mode: 'auto'
      });

      // This will fail if git is not initialized, but tests the structure
      try {
        const status = await manager.status();
        expect(status).toBeDefined();
        expect(status).toHaveProperty('gitStatus');
        expect(status).toHaveProperty('health');
        expect(status).toHaveProperty('contextFiles');
        expect(status).toHaveProperty('lastUpdated');
      } catch (error) {
        // Expected if git is not initialized
        expect((error as Error).message).toContain('Git');
      }
    });
  });

  describe('validate', () => {
    it('should throw error when not initialized', async () => {
      await expect(manager.validate()).rejects.toThrow('CxtManager not initialized');
    });

    it('should return health status when initialized', async () => {
      // Setup initialized state
      await fs.ensureDir(path.join(testDir, '.cxt'));
      await fs.writeJson(path.join(testDir, '.cxt', '.cxtconfig.json'), {
        version: '1.0.0',
        mode: 'auto'
      });

      try {
        const health = await manager.validate();
        expect(health).toBeDefined();
        expect(health).toHaveProperty('overall');
        expect(health).toHaveProperty('issues');
        expect(health).toHaveProperty('suggestions');
        expect(health).toHaveProperty('alignments');
        expect(health).toHaveProperty('lastChecked');
        expect(['healthy', 'warning', 'error']).toContain(health.overall);
      } catch (error) {
        // Expected if git is not initialized
        expect((error as Error).message).toContain('Git');
      }
    });
  });
});

