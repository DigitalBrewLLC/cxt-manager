"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWatcher = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * FileWatcher - Monitors .cxt/ folder for changes
 * Supports the health monitoring and auto-sync features
 */
class FileWatcher {
    constructor(cxtPath) {
        this.watchers = [];
        this.isWatching = false;
        this.cxtPath = cxtPath;
    }
    /**
     * Start watching context files for changes
     */
    async startWatching(callback) {
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
    stopWatching() {
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
    isCurrentlyWatching() {
        return this.isWatching;
    }
    /**
     * Get last modified times for all context files
     */
    async getLastModifiedTimes() {
        const times = new Map();
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
    async hasChangedSince(timestamp) {
        const changedFiles = [];
        const times = await this.getLastModifiedTimes();
        for (const [fileName, modTime] of times) {
            if (modTime > timestamp) {
                changedFiles.push(fileName);
            }
        }
        return changedFiles;
    }
}
exports.FileWatcher = FileWatcher;
//# sourceMappingURL=file-watcher.js.map