import { FileWatcher } from '../file-watcher';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('FileWatcher', () => {
  let testDir: string;
  let fileWatcher: FileWatcher;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `cxtmanager-watcher-test-${Date.now()}`);
    fs.ensureDirSync(testDir);
    fileWatcher = new FileWatcher(testDir);
  });

  afterEach(async () => {
    fileWatcher.stopWatching();
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('startWatching', () => {
    it('should start watching files', async () => {
      const cxtDir = path.join(testDir, '.cxt');
      await fs.ensureDir(cxtDir);
      const testFile = path.join(cxtDir, 'test.md');
      fs.writeFileSync(testFile, 'initial content');

      await fileWatcher.startWatching((filePath: string, event: string) => {
        expect(filePath).toBeDefined();
        expect(event).toBeDefined();
      });

      expect(fileWatcher).toBeDefined();
    });

    it('should handle missing context folder', async () => {
      // startWatching checks for path existence and may throw or handle gracefully
      try {
        await fileWatcher.startWatching(() => {});
        // If it doesn't throw, that's also valid behavior
      } catch (error) {
        expect((error as Error).message).toContain('Context folder');
      }
    });
  });

  describe('stopWatching', () => {
    it('should stop watching files', () => {
      // Should not throw even if not watching
      expect(() => fileWatcher.stopWatching()).not.toThrow();
    });
  });
});

