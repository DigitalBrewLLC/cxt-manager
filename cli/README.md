# cxtmanager-cli

Command-line interface for CxtManager - Git-like commands for managing AI project context.

## Philosophy

**Manager, not Enforcer.** The CLI provides structure and tools, but you (and your AI tools) decide what content goes into context files. The CLI helps you organize, version, and maintain consistency - it never enforces content.

## What It Does

Provides the `cit` command with Git-like operations for managing project context files:
- `cit init` - Initialize `.cxt/` folder with context files
- `cit status` - Show context file status and health
- `cit add` - Stage context file changes
- `cit commit` - Commit context changes
- `cit log` - View context change history
- `cit diff` - Show changes in context files
- `cit checkout` - Revert to previous context state
- `cit validate` - Check context file alignment
- `cit blame` - Show context file attribution
- `cit sync-plan` - Sync plan.md for current branch
- `cit hooks` - Manage Git hooks

## The Problem We Solve

**Lost Context in AI Development:**
- Project context scattered across AI conversations
- AI assistants lack project memory between sessions
- No shared understanding of goals, decisions, constraints
- Context drift as projects evolve
- Time wasted re-explaining project details

**The Solution:**
- Centralized `.cxt/` folder with context files
- Git-like versioning for context evolution
- Branch-aware plan.md (switches with Git branches)
- Alignment checking and warnings
- Offline-first, Git-first architecture

## Installation

```bash
npm install -g @cxtmanager/cli
```

## Quick Start

```bash
# Initialize in any project
cit init

# Interactive setup asks:
# 1. Template style (blank/template)
# 2. Git hooks installation (auto-switch plan.md)
# 3. Privacy & Git tracking (tracked/private)

# Or use flags
cit init --template
# or
cit init --blank

# Check status
cit status

# Stage and commit context changes
cit add context.md
cit commit "Updated project goals"
```

## Commands

### Core Commands
- `cit --version` - Show CLI version
- `cit init` - Initialize CxtManager in current directory
- `cit status` - Show context file status, health, and warnings
- `cit add <file>` - Stage context file changes
- `cit commit <message>` - Commit context changes
- `cit log` - View context change history
- `cit diff` - Show changes in context files
- `cit checkout <commit>` - Revert context files to previous state

### Validation & Maintenance
- `cit validate` - Check context file alignment and consistency
- `cit blame <file>` - Show attribution for context file changes

### Branch Management
- `cit sync-plan` - Sync plan.md for current Git branch

### Git Hooks
- `cit hooks install` - Install Git hooks for automatic context sync
- `cit hooks remove` - Remove Git hooks
- `cit hooks status` - Show installed hooks

## Context Files

The CLI manages three core context files:

- **context.md** - High-level project truth (stable, cross-referenced)
- **plan.md** - Feature-specific implementation (branch-specific)
- **guardrail.md** - Universal constraints and rules

## Branch Awareness

When you switch Git branches, CxtManager automatically:
1. Saves current branch's plan.md to `.plan-history/`
2. Restores the target branch's plan.md (or creates template if new)

This happens via Git hooks (installed with `cit init` or `cit hooks install`).

## Configuration

Configuration is stored in `.cxt/.cxtconfig.json`. Key settings:

- `mode` - Template style (`blank` or `template`)
- `git_integration.auto_install_hooks` - Auto-install Git hooks
- `context.drift_detection` - Warn when code changes outpace context
- `context.content_quality` - Warning thresholds for content quality

## Development

```bash
# Build
npm run build

# Test
npm test

# Run from source
npm run dev
# or
node dist/cli.js
```

## License

MIT License

Copyright (c) 2025 Digital Brew LLC

