import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * FileWatcher - Monitors .cxt/ folder for changes
 * Supports the health monitoring and auto-sync features
 */
export class FileWatcher {
  private cxtPath: string;
  private watchers: fs.FSWatcher[] = [];
  private isWatching: boolean = false;

  constructor(cxtPath: string) {
    this.cxtPath = cxtPath;
  }

  /**
   * Start watching context files for changes
   */
  async startWatching(callback: (filePath: string, event: string) => void): Promise<void> {
    if (this.isWatching) {
      return;
    }

    if (!await fs.pathExists(this.cxtPath)) {
      throw new Error('Context folder not found. Run "cit init" first.');
    }

    console.log(`👁️  Starting file watcher for ${this.cxtPath}`);

    const contextFiles = ['context.md', 'plan.md', 'guardrail.md', '.cxtconfig.json'];

    for (const fileName of contextFiles) {
      const filePath = path.join(this.cxtPath, fileName);
      
      if (await fs.pathExists(filePath)) {
        const watcher = fs.watch(filePath, (eventType, filename) => {
          if (filename) {
            callback(filePath, eventType);
          }
        });
        
        this.watchers.push(watcher);
      }
    }

    this.isWatching = true;
  }

  /**
   * Stop watching files
   */
  stopWatching(): void {
    console.log('👁️  Stopping file watcher');
    
    this.watchers.forEach(watcher => {
      watcher.close();
    });
    
    this.watchers = [];
    this.isWatching = false;
  }

  /**
   * Check if currently watching
   */
  isCurrentlyWatching(): boolean {
    return this.isWatching;
  }

  /**
   * Get last modified times for all context files
   */
  async getLastModifiedTimes(): Promise<Map<string, Date>> {
    const times = new Map<string, Date>();
    const contextFiles = ['context.md', 'plan.md', 'guardrail.md'];

    for (const fileName of contextFiles) {
      const filePath = path.join(this.cxtPath, fileName);
      
      if (await fs.pathExists(filePath)) {
        const stats = await fs.stat(filePath);
        times.set(fileName, stats.mtime);
      }
    }

    return times;
  }

  /**
   * Check if files have been modified since given timestamp
   */
  async hasChangedSince(timestamp: Date): Promise<string[]> {
    const changedFiles: string[] = [];
    const times = await this.getLastModifiedTimes();

    for (const [fileName, modTime] of times) {
      if (modTime > timestamp) {
        changedFiles.push(fileName);
      }
    }

    return changedFiles;
  }
} 