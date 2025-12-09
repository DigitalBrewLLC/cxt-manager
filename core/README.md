# @cxtmanager/core

Core library for cxt-manager - context file management and Git integration.

## Philosophy

**Manager, not Enforcer.** This package provides the infrastructure for managing AI project context files, but never enforces what content goes into them. It's a framework-agnostic library that can be used by CLI tools, IDE extensions, web apps, or any other interface.

## What It Does

- **Context File Management** - Create, read, update context files (context.md, plan.md, guardrail.md)
- **Git Integration** - Version control for context files using Git
- **Branch Awareness** - Automatic switching of plan.md content based on Git branches
- **Validation** - Check context file quality and health
- **Template Generation** - Provide structure templates (you fill the content)
- **Git Hooks** - Manage Git hooks for automatic context synchronization

## Core Concepts

### Context Files
- `context.md` - High-level project truth (stable, rarely changes)
- `plan.md` - Feature-specific implementation (changes per branch)
- `guardrail.md` - Universal constraints and rules

### Branch Awareness
`plan.md` content is branch-specific. When you switch Git branches, cxt-manager automatically:
1. Saves current branch's plan.md to `.plan-history/`
2. Restores the target branch's plan.md (or creates template if new)

### Validation

**Content Quality Validation (Not Markdown Syntax)**

The validation engine checks for content quality and usefulness, not markdown syntax errors:

**What we check:**
- ✅ **Content quality** - Empty files, short content, empty sections
- ✅ **Content analysis** - Filters structural elements, counts actual content
- ✅ **Drift detection** - Outdated information warnings
- ✅ **File completeness** - Ensures files have meaningful content

**What we don't check:**
- ❌ Markdown syntax errors (broken links, invalid formatting)
- ❌ Markdown style (heading levels, list formatting)
- ❌ Semantic alignment (deferred to future MCP/agent integration)

**Why this approach:**
- **Manager, not Enforcer** - Focus on content quality, not formatting rules
- **AI-focused** - Check what matters for AI understanding
- **Flexible** - Any markdown style is fine; we just ensure there's content

**Configuration:**
Quality thresholds are configurable:
```json
{
  "context": {
    "content_quality": {
      "min_content_length": 100,
      "min_content_lines": 3,
      "empty_section_warning": true,
      "short_content_warning": 200
    }
  }
}
```

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
  trackInGit: true
});

// Check if initialized
const isInit = await manager.isInitialized();

// Get status
const status = await manager.getStatus();

// Validate context health
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
Checks context file quality, health, and completeness. Provides warnings for empty/short content and drift detection.

### GitHooksManager
Manages Git hook installation and removal.

## Configuration

Configuration is stored in `.cxt/.cxtconfig.json`:

```json
{
  "version": "1.0.0",
  "mode": "blank",
  "git_integration": {
    "enabled": true,
    "hooks": {
      "post_checkout": "sync-plan",
      "pre_commit": "validate"
    },
    "silent_mode": true,
    "auto_install_hooks": true,
    "track_in_git": true
  },
  "plan_management": {
    "backup_on_switch": true,
    "plan_template_style": undefined
  },
  "mcp": {
    "enabled": false,
    "sources": {
      "local_files": {
        "enabled": true,
        "readme": true,
        "package_json": true,
        "git_history": true
      }
    }
  },
  "context": {
    "health_checks": true,
    "ai_attribution": true,
    "drift_detection": true,
    "warn_threshold": 3,
    "content_quality": {
      "min_content_length": 100,
      "min_content_lines": 3,
      "empty_section_warning": true,
      "short_content_warning": 200
    }
  },
  "created": "2025-01-15T10:30:00.000Z"
}
```

**Note:** The `mcp` section is reserved for future MCP/agent integration and currently has no effect.

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

MIT License

Copyright (c) 2025 Digital Brew LLC

