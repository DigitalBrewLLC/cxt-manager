# CxtManager

**"Stop being the context monkey. Manage your AI project context like code."**

Git for AI Context - Version control for your AI coding assistant's project memory.

## The Problem

Every time you start a new chat with your AI coding assistant, you're the "context monkey":
- Re-explaining what your project does
- Repeating architectural decisions
- Restating constraints and requirements
- Watching your AI forget everything between sessions

**Your AI has no memory. Your project does. This is the gap CxtManager fills.**

## The Solution

CxtManager gives you `cit` - a Git-like CLI for managing a `.cxt/` folder that your AI can reference. Three files, one source of truth:
```
.cxt/
├── context.md    # What your project is (stable truth)
├── plan.md       # What you're building (branch-specific)
└── guardrail.md  # What rules to follow (universal constraints)
```

Now your AI assistant can:
- ✅ Reference project goals without asking
- ✅ Stay aligned with architectural decisions
- ✅ Follow project-specific constraints
- ✅ Pick up where the last conversation left off

## Quick Start

### Installation
```bash
npm install -g cxtmanager-cli

# Or using pnpm:
pnpm add -g cxtmanager-cli

# Or using yarn:
yarn global add cxtmanager-cli
```

### Initialize Your Project
```bash
# In any project directory
cit init

# Interactive setup asks:
# 1. Template style (minimal/detailed/manual)
# 2. Git hooks installation (auto-switch plan.md on branch changes)
# 3. Update mode (manual/auto)
# 4. Privacy & Git tracking (tracked/private)

# Your .cxt/ files are created - fill them with your AI's help
# Then reference them in any AI conversation
```

### Privacy Options

**During `cit init`, `.gitignore` is automatically configured based on your choice.**

By default, `.cxt/` files are tracked in Git for team sharing. During `cit init`, you can choose to keep context files private, and CxtManager will automatically add `.cxt/` to `.gitignore` for you. This is useful for:
- Personal projects with sensitive context
- Projects where context should remain local
- Privacy-sensitive development workflows

**To change this setting after initialization:**
1. Edit `.cxt/.cxtconfig.json` and set `git_integration.track_in_git` to `false` (or `true`)
2. Run `cit sync-gitignore` to apply the change to `.gitignore`

**Or manually edit `.gitignore`:**
- To make private: Add `.cxt/` to `.gitignore`
- To make shared: Remove `.cxt/` from `.gitignore`

**Note:** If files are already tracked in Git, you may need to manually remove them with `git rm --cached -r .cxt/` before adding to `.gitignore`.

### Basic Workflow
```bash
cit status          # Check context file status and alignment
cit add context.md  # Stage context changes
cit commit "Updated project goals"  # Commit with message
cit log             # View context change history
```

## Core Philosophy

**CxtManager is a Manager, not an Enforcer.**

We provide structure and Git-like version control for your context files. You decide what goes in them. Your AI helps you write them. CxtManager keeps them organized, versioned, and aligned.

### The Alignment Principle

**All context files must tell the same story.** When context.md, plan.md, and guardrail.md are aligned:
- AI suggestions stay consistent across conversations
- Decisions align with project goals and constraints
- Documentation stays in sync with code
- New team members get accurate project understanding

This isn't just a feature - it's the foundation of reliable AI-assisted development.

## Who It's For

### Primary: AI-Assisted Developers
You use tools like Cursor, Copilot, or Claude for coding. You want them to understand your project without constant re-explanation.

### Secondary: Development Teams
Multiple developers using AI assistants need shared context. Track how project understanding evolves. Onboard new team members faster.

### Already Using Markdown Files?
If you maintain `PROJECT.md`, `ARCHITECTURE.md`, `NOTES.md`, or similar files, CxtManager enhances your existing workflow:

**You're already documenting in markdown. We add version control and structure:**
```
Before: PROJECT.md, ARCHITECTURE.md, NOTES.md, TODO.md
        (Scattered, unversioned, hard to keep aligned)

After:  .cxt/context.md, .cxt/plan.md, .cxt/guardrail.md
        (Structured, versioned with cit commit/cit log, validated, AI-accessible)
```

You version control your code. Why not version control your project context the same way?

## How It Works

CxtManager uses familiar Git-like commands to version control your project context. The `.cxt/` folder contains three structured files:

- **context.md** - Your project's stable truth (what it does, why it exists, architecture)
- **plan.md** - Your implementation plan (branch-specific, switches with Git branches)
- **guardrail.md** - Universal constraints (rules, technology choices, things to avoid)

### Core Commands

```bash
# Check status and alignment
$ cit status

Changes not staged for commit:
  modified: context.md
  modified: plan.md

⚠️  Alignment warning: plan.md may need updates due to context.md changes
✅ All context files are aligned
```

```bash
# Stage and commit context changes
cit add context.md
cit commit "Updated project goals"

✅ Committed changes to context.md
💡 Consider updating: plan.md (references old goals)
```

```bash
# View context history
cit log

commit abc123 (HEAD -> main)
Author: Developer <dev@example.com>
Date:   Mon Jan 15 10:30:00 2025
    Updated project goals

commit def456
Author: AI Assistant
Date:   Mon Jan 15 09:15:00 2025
    AI: Updated plan with auth implementation
```

```bash
# See what changed
cit diff

diff --git a/.cxt/context.md b/.cxt/context.md
index 1234567..abcdefg
--- a/.cxt/context.md
+++ b/.cxt/context.md
@@ -5,6 +5,7 @@
 The project is a SaaS platform for...
+New focus: Mobile-first design approach
```

```bash
# Validate alignment
cit validate

✅ All context files are aligned
⚠️  Warning: plan.md has 45% template content (consider updating)
✅ Cross-references are consistent
```

```bash
# Revert to previous state
cit checkout abc123

✅ Restored context files to commit abc123
```

All files are version controlled, validated for alignment, and easily accessible to AI tools.

## Key Benefits

1. **"Git for AI Context"** - Version control you already trust, for context
2. **Offline-First** - No external services, works anywhere
3. **AI Accessible** - Files your coding assistant can reference instantly
4. **Team Friendly** - Share context through Git like you share code (or keep it private)
5. **Simple** - If you know Git, you know CxtManager

## Development

This is a monorepo containing:

### `@cxtmanager/core`
Framework-agnostic library for context management, Git integration, and validation.

### `cxtmanager-cli`
The `cit` command-line tool built on `@cxtmanager/core`.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Develop CLI (watch mode)
cd core && pnpm dev
cd ../cli && pnpm dev
```

See individual package READMEs for more details:
- [`core/README.md`](core/README.md) - Core library documentation
- [`cli/README.md`](cli/README.md) - CLI tool documentation

## Publishing

Packages are published independently to npm:
- `@cxtmanager/core` - Core library
- `cxtmanager-cli` - CLI tool

## Links

- **Website:** [cxtmanager.dev](https://cxtmanager.dev)
- **Documentation:** [cxtmanager.dev/docs](https://cxtmanager.dev/docs)
- **GitHub:** [github.com/cxtmanager/cxtmanager](https://github.com/cxtmanager/cxtmanager)
- **Support:** hello@digitalbrew.tech

## License

AGPL-3.0 - Open source for personal and open source projects. Commercial licenses available for proprietary use.

**Built by:** [Digital Brew LLC](https://www.digitalbrew.tech)