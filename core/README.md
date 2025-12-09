# @cxtmanager/core

Core library for CxtManager - context file management and Git integration.

## Philosophy

**Manager, not Enforcer.** This package provides the infrastructure for managing AI project context files, but never enforces what content goes into them. It's a framework-agnostic library that can be used by CLI tools, IDE extensions, web apps, or any other interface.

## What It Does

- **Context File Management** - Create, read, update context files (context.md, plan.md, guardrail.md)
- **Git Integration** - Version control for context files using Git
- **Branch Awareness** - Automatic switching of plan.md content based on Git branches
- **Validation** - Check context file alignment and consistency
- **Template Generation** - Provide structure templates (you fill the content)
- **Git Hooks** - Manage Git hooks for automatic context synchronization

## Core Concepts

### Context Files
- `context.md` - High-level project truth (stable, rarely changes)
- `plan.md` - Feature-specific implementation (changes per branch)
- `guardrail.md` - Universal constraints and rules

### Branch Awareness
`plan.md` content is branch-specific. When you switch Git branches, CxtManager automatically:
1. Saves current branch's plan.md to `.plan-history/`
2. Restores the target branch's plan.md (or creates template if new)

### Alignment
Context files should cross-reference each other and tell a consistent story. The validation engine checks for:
- Structural consistency
- Cross-references
- Content quality warnings (empty, short content)
- Drift detection (code changes outpacing context updates)

## Installation

```bash
npm install @cxtmanager/core
```

## Usage

```typescript
import { ContextManager } from '@cxtmanager/core';

const manager = new ContextManager(projectRoot);

// Initialize context files
await manager.init({
  mode: 'blank',
  autoInstallHooks: true,
  updateMode: 'manual'
});

// Check if initialized
const isInit = await manager.isInitialized();

// Get status
const status = await manager.getStatus();

// Validate alignment
const validation = await manager.validate();

// Sync plan.md for current branch
const result = await manager.syncPlan();
```

## API Overview

### ContextManager
Main orchestrator class for context file operations.

### GitRepository
Handles all Git operations (commits, diffs, history, etc.).

### PlanManager
Manages branch-specific plan.md content and switching.

### ValidationEngine
Checks context file alignment, structure, and completeness.

### GitHooksManager
Manages Git hook installation and removal.

## Configuration

Configuration is stored in `.cxt/.cxtconfig.json`:

```json
{
  "version": "1.0.0",
  "mode": "blank",
  "git_integration": {
    "auto_install_hooks": true
  },
  "plan_management": {
    "branch_aware": true
  },
  "context": {
    "update_mode": "manual",
    "drift_detection": {
      "enabled": true,
      "warn_threshold": 3
    },
    "content_quality": {
      "min_content_length": 100,
      "min_content_lines": 3,
      "empty_section_warning": true,
      "short_content_warning": 200
    }
  }
}
```

## Development

```bash
# Build
npm run build

# Test
npm test

# Watch mode
npm run dev
```

## License

AGPL-3.0

