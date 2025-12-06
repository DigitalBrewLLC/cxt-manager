"use strict";
/**
 * @cxtmanager/core - Core functionality for CxtManager
 * Git for AI Context - Stop being the context monkey
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHooksManager = exports.PlanTemplates = exports.PlanManager = exports.ValidationEngine = exports.FileWatcher = exports.GitRepository = exports.ContextManager = void 0;
var context_manager_1 = require("./context-manager");
Object.defineProperty(exports, "ContextManager", { enumerable: true, get: function () { return context_manager_1.ContextManager; } });
var git_repository_1 = require("./git-repository");
Object.defineProperty(exports, "GitRepository", { enumerable: true, get: function () { return git_repository_1.GitRepository; } });
var file_watcher_1 = require("./file-watcher");
Object.defineProperty(exports, "FileWatcher", { enumerable: true, get: function () { return file_watcher_1.FileWatcher; } });
var validation_engine_1 = require("./validation-engine");
Object.defineProperty(exports, "ValidationEngine", { enumerable: true, get: function () { return validation_engine_1.ValidationEngine; } });
var plan_manager_1 = require("./plan-manager");
Object.defineProperty(exports, "PlanManager", { enumerable: true, get: function () { return plan_manager_1.PlanManager; } });
var plan_templates_1 = require("./plan-templates");
Object.defineProperty(exports, "PlanTemplates", { enumerable: true, get: function () { return plan_templates_1.PlanTemplates; } });
var git_hooks_manager_1 = require("./git-hooks-manager");
Object.defineProperty(exports, "GitHooksManager", { enumerable: true, get: function () { return git_hooks_manager_1.GitHooksManager; } });
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map