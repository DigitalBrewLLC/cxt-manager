# CxtManager Packages

## Project Purpose

CxtManager eliminates the **"context monkey" problem** in AI-assisted development by providing local context file management. It gives developers the `cit` CLI with Git-like commands for managing a `.cxt/` folder containing project context that AI coding assistants can reference to understand project goals, decisions, and constraints.

## Core Philosophy

**CxtManager is a Manager, not an Enforcer.**

CxtManager provides structure and tools for managing AI project context, but it never enforces what content goes into your context files. You (and your AI tools) decide what to write. CxtManager simply helps you organize, version, and maintain consistency.

### 🎯 Core Principle: Context File Alignment

**The fundamental principle of CxtManager is that all context files must remain aligned and cross-referenced at all times.** This ensures that AI assistants and developers always have a consistent, unified understanding of:

- **What the project is** (context.md)
- **What's been done and what needs to be done** (plan.md)
- **What rules and constraints to follow** (guardrail.md)

**When context files tell the same story, AI assistants can:**
- Provide consistent suggestions across different conversations
- Make decisions aligned with project goals and constraints
- Update documentation that stays in sync with code changes
- Help onboard new team members with accurate project understanding

**This is not just a feature of CxtManager - it IS CxtManager's core philosophy.**

### The Problem We Solve

**Current Developer Pain:**
- AI coding assistants lack project memory between sessions
- Project context scattered across different AI conversations
- No shared understanding of goals, architecture, and constraints
- Context drift as projects evolve over time
- Time wasted re-explaining project details to AI tools

**The Solution: Local Context Management**
- Centralized context files in `.cxt/` folder
- Git-like commands for versioning context
- Branch-aware context management (plan.md switches with Git branches)
- Automatic alignment checking and warnings
- Offline-first, Git-first architecture

### Core Architecture

**3-File Core:**
- `context.md` - High-level project truth (stable, cross-referenced)
- `plan.md` - Feature-specific implementation (branch-specific)
- `guardrail.md` - Universal constraints and rules

**Key Principles:**
1. **Context Alignment** - All context files must tell the same story
2. **Git-First Design** - Leverages existing Git infrastructure
3. **Offline-First** - Core functionality works without internet
4. **Manager not Enforcer** - Provides structure, you fill content
5. **Branch Awareness** - `plan.md` content switches with Git branches

## Key Value Propositions

1. **"Git for AI Context"** - Familiar, trustworthy version control for project context
2. **Offline-First** - Works completely locally, no external dependencies
3. **AI Accessible** - Context files that your coding assistant can reference anytime
4. **Version Controlled** - Track how project understanding evolves over time
5. **Team Friendly** - Share context through Git like you share code
6. **Simple Like Git** - Basic commands for powerful context management

## Target Users

### Primary: AI-Assisted Developers
- Use AI coding assistants (Cursor, Copilot, Claude, etc.) in their development workflow
- Want their AI assistant to understand project context without manual explanation
- Need reliable version control for project context and decisions
- Value simple, Git-like workflows for context management
- Work on projects that evolve over weeks/months and need persistent context

### Secondary: Development Teams
- Teams where multiple developers use AI coding assistants
- Need shared understanding of project goals and constraints across the team
- Want to track how project context and decisions evolve over time
- Require consistent context across team members' AI interactions

## Technical Philosophy

### Git-First Design
- **Familiar commands** - Uses standard Git patterns developers already know
- **Local operation** - Works completely offline, no cloud dependencies
- **Reliable history** - Full audit trail of all context changes
- **Standard workflows** - Integrates with existing Git repositories
- **Branch support** - Experimental contexts, team collaboration

### Simplicity Focus
- **Minimal dependencies** - Core Node.js and Git only
- **Standard file formats** - Markdown files, JSON configuration
- **No external services** - Pure local file and Git operations
- **Clear separation** - Context management separate from AI intelligence
- **Open architecture** - Framework-agnostic core library

## Package Structure

### `@cxtmanager/core`
Core library providing context file management, Git integration, validation, and branch-aware plan management. Framework-agnostic and reusable.

### `cxtmanager-cli`
Command-line interface (`cit` command) built on top of `@cxtmanager/core`. Provides Git-like commands for managing context files.

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run CLI from source
cd cxt/cli && npm run dev
```

## Publishing

Packages are published independently:
- `@cxtmanager/core` - Core library (npm)
- `cxtmanager-cli` - CLI tool (npm)

See individual package READMEs for more details.

