# cxtmanager-cli

Command-line interface for cxt-manager - Git-like commands for managing AI project context.

## Philosophy

**Manager, not Enforcer.** The CLI provides structure and tools, but you (and your AI tools) decide what content goes into context files. The CLI helps you organize, version, and maintain consistency - it never enforces content.

## What It Does

Provides the `cit` command with Git-like operations specifically for managing `.cxt/` files. **`cit` commands use the same Git repository as your code** - they're Git commands with context-aware features.

### How `cit` Commands Relate to Git

**Same repository, context-aware features:**

| `cit` Command | Git Equivalent | What's Different |
|---------------|----------------|------------------|
| `cit status` | `git status` | Filters to `.cxt/` files + adds health checks |
| `cit add` | `git add .cxt/` | Defaults to `.cxt/` directory, warns about non-context files |
| `cit commit` | `git commit` | **Runs validation first** (blocks commits with errors) |
| `cit log` | `git log -- .cxt/` | Shows history filtered to context files |
| `cit diff` | `git diff -- .cxt/` | Shows changes in context files only |
| `cit checkout` | `git checkout -- .cxt/` | Reverts only context files |
| `cit validate` | *(no equivalent)* | Health check tool (like a linter) |

**Key points:**
- ✅ **Same Git repo** - `cit commit` and `git commit` write to the same repository
- ✅ **Context-focused** - `cit` commands default to managing `.cxt/` files
- ✅ **Adds validation** - `cit commit` runs `cit validate` before committing
- ✅ **Works together** - Mix `git` and `cit` commands as needed

**Commands:**
- `cit init` - Initialize `.cxt/` folder with context files
- `cit status` - Show context file status and health
- `cit add` - Stage context file changes (defaults to `.cxt/`)
- `cit commit` - Commit with validation and smart prompts
- `cit log` - View context file change history
- `cit diff` - Show changes in context files
- `cit checkout` - Revert context files to previous state
- `cit validate` - Check context file health and quality
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
- Health checking and quality warnings
- Offline-first, Git-first architecture

## Prerequisites

**Git Required:**

cxt-manager is "Git for AI Context" - you should already be using Git for your code. If you're version controlling your project with Git, you're ready to version control your context.

**What you need:**
- Git installed and configured
- Basic Git knowledge (`add`, `commit`, `log`, `diff`)
- An existing Git workflow for your project

**Git user configuration:**

For commit attribution (used in `cit log` and blame functionality), Git needs to know who you are:

```bash
# Check if already configured
git config user.name
git config user.email

# If not set, configure globally (recommended)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Note:** If Git user is not configured, `cit commit` will show clear error messages with setup instructions.

## Installation

### Global Installation (Recommended)

```bash
# Using npm
npm install -g @cxtmanager/cli

# Using pnpm
pnpm add -g @cxtmanager/cli

# Using yarn
yarn global add @cxtmanager/cli

# Using bun
bun install -g @cxtmanager/cli
```

### One-Time Usage (No Installation)

```bash
# Using npx (npm)
npx @cxtmanager/cli init

# Using pnpm dlx
pnpm dlx @cxtmanager/cli init

# Using yarn dlx
yarn dlx @cxtmanager/cli init
```

### Verify Installation

```bash
cit --version
```

You should see the version number. If you get a "command not found" error, make sure your global npm/pnpm/yarn bin directory is in your PATH.

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

# Check status (shows .cxt/ files + health)
cit status

# Stage and commit context changes
cit add context.md              # Stages .cxt/context.md
cit commit "Updated project goals"  # Commits with validation

# Note: cit commands use the same Git repo as your code
# You can mix git and cit commands:
git add src/                    # Stage code
cit add .cxt/                   # Stage context
git commit -m "Both"            # Or use cit commit for validation
```

## Commands

### Core Commands
- `cit --version` - Show CLI version
- `cit init` - Initialize cxt-manager in current directory
- `cit status` - Show context file status, health, and warnings
- `cit add <file>` - Stage context file changes
- `cit commit <message>` - Commit context changes
- `cit log` - View context change history
- `cit diff` - Show changes in context files
- `cit checkout <commit>` - Revert context files to previous state

### Validation & Maintenance
- `cit validate` - Check context file health and quality
  - Validates content quality (empty, short content)
  - Detects empty sections
  - Checks for outdated information
  - **Note:** Checks content quality, not markdown syntax
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

When you switch Git branches, cxt-manager automatically:
1. Saves current branch's plan.md to `.plan-history/`
2. Restores the target branch's plan.md (or creates template if new)

This happens via Git hooks (installed with `cit init` or `cit hooks install`).

## Configuration

Configuration is stored in `.cxt/.cxtconfig.json`. Key settings:

**Git Integration:**
- `git_integration.enabled` - Enable Git integration
- `git_integration.auto_install_hooks` - Auto-install Git hooks on init
- `git_integration.track_in_git` - Track `.cxt/` files in Git (false = private)
- `git_integration.hooks.post_checkout` - Hook to run on branch switch (default: `sync-plan`)
- `git_integration.hooks.pre_commit` - Hook to run before commit (default: `validate`)

**Plan Management:**
- `plan_management.backup_on_switch` - Save plan.md when switching branches
- `plan_management.plan_template_style` - Override plan.md template style (`blank`/`template`/`undefined`)

**Context Validation:**
- `context.health_checks` - Enable validation checks
- `context.ai_attribution` - Track AI vs human changes
- `context.drift_detection` - Warn when code changes outpace context
- `context.warn_threshold` - Commits before drift warning (default: 3)
- `context.content_quality` - Quality thresholds (min_content_length, min_content_lines, etc.)

**Reserved for Future:**
- `mcp` - Placeholder for future MCP/agent integration (currently has no effect)

See [`examples/config-examples.md`](../examples/config-examples.md) for full configuration examples.

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

