/**
 * FileWatcher - Monitors .cxt/ folder for changes
 * Supports the health monitoring and auto-sync features
 */
export declare class FileWatcher {
    private cxtPath;
    private watchers;
    private isWatching;
    constructor(cxtPath: string);
    /**
     * Start watching context files for changes
     */
    startWatching(callback: (filePath: string, event: string) => void): Promise<void>;
    /**
     * Stop watching files
     */
    stopWatching(): void;
    /**
     * Check if currently watching
     */
    isCurrentlyWatching(): boolean;
    /**
     * Get last modified times for all context files
     */
    getLastModifiedTimes(): Promise<Map<string, Date>>;
    /**
     * Check if files have been modified since given timestamp
     */
    hasChangedSince(timestamp: Date): Promise<string[]>;
}
//# sourceMappingURL=file-watcher.d.ts.map