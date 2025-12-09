# cxt-manager

**"Stop being the context monkey. Manage your AI project context like code."**

Git for AI Context - Version control for your AI coding assistant's project memory.

> ⚠️ **Active Development**: cxt-manager is under heavy development.
>
> APIs will change. Architecture is being refined.
>
> **Not accepting contributions yet** - but watch this space!
>
> Star the repo to follow progress.

## Status: Alpha (v1.0.x)

Currently validating core concepts and architecture with real-world projects. Documentation website will launch soon at [cxtmanager.dev/cli-docs](https://cxtmanager.dev/cli-docs).

Follow development: [Issues](https://github.com/DigitalBrewLLC/cxt-manager/issues) | [Discussions](https://github.com/DigitalBrewLLC/cxt-manager/discussions)

---

## The Problem

Every time you start a new chat with your AI coding assistant, you're the "context monkey":
- Re-explaining what your project does
- Repeating architectural decisions
- Restating constraints and requirements
- Watching your AI forget everything between sessions

**Your AI has no memory. Your project does. This is the gap cxt-manager fills.**

## The Solution

cxt-manager gives you `cit` - a Git-like CLI for managing a `.cxt/` folder that your AI can reference. Three files, one source of truth:
```
.cxt/
├── context.md    # What your project is (stable truth)
├── plan.md       # What you're building (branch-specific)
└── guardrail.md  # What rules to follow (universal constraints)
```

### The Three Context Files

Each file serves a specific purpose:

#### `context.md` - Your Project's Stable Truth

**Purpose:** High-level project information that rarely changes

- Project goals and architecture
- Technology decisions and rationale
- Domain concepts
- Team conventions

**When to update:** When fundamental aspects of your project change

---

#### `plan.md` - Your Current Work (Branch-Specific)

**Purpose:** What you're building right now

- Current tasks and progress
- Open questions
- Temporary notes

**When to update:** As your work evolves. Auto-switches with Git branches (if hooks enabled).

---

#### `guardrail.md` - Universal Rules and Constraints

**Purpose:** Things that should NEVER change without careful consideration

- Technology constraints
- Security requirements
- Performance rules
- Code style principles
- Explicit things to avoid

**When to update:** Rarely. Only when fundamental constraints change.

---

### How Your AI Uses These Files

**In any AI conversation, reference your context:**

> "Please read the context files in `.cxt/` before we begin."

Your AI can then:

- ✅ Understand project goals without questions
- ✅ Follow architectural decisions
- ✅ Respect constraints
- ✅ Pick up where previous conversations left off

**You and your AI decide what goes in the files. cxt-manager just keeps them organized, versioned, and aligned.**

## Quick Start

### Installation
```bash
npm install -g @cxtmanager/cli

# Or using pnpm:
pnpm add -g @cxtmanager/cli

# Or using yarn:
yarn global add @cxtmanager/cli
```

### Initialize Your Project
```bash
# In any project directory
cit init

# Interactive setup asks:
# 1. Template style (blank/template)
# 2. Git hooks installation (auto-switch plan.md on branch changes)
# 3. Privacy & Git tracking (tracked/private)

# Your .cxt/ files are created - fill them with your AI's help
# Then reference them in any AI conversation
```

### Privacy Options

**During `cit init`, `.gitignore` is automatically configured based on your choice.**

By default, `.cxt/` files are tracked in Git for team sharing. During `cit init`, you can choose to keep context files private, and cxt-manager will automatically add `.cxt/` to `.gitignore` for you. This is useful for:
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

**cxt-manager is a Manager, not an Enforcer.**

We provide structure and Git-like version control for your context files. You decide what goes in them. Your AI helps you write them. cxt-manager keeps them organized, versioned, and aligned.

### The Alignment Principle

**All context files must tell the same story.** When context.md, plan.md, and guardrail.md are aligned:
- AI suggestions stay consistent across conversations
- Decisions align with project goals and constraints
- Documentation stays in sync with code
- New team members get accurate project understanding

This isn't just a feature - it's the foundation of reliable AI-assisted development.

## Who It's For

### Solo Developers Using AI Assistants

**You:** Use Cursor, Copilot, or Claude daily  

**Problem:** Constantly re-explaining your project  

**Solution:** AI reads `.cxt/` files, understands context instantly  

**Benefit:** 5-10 minutes saved per conversation × 20 conversations/week = 100+ minutes/week

### Development Teams with AI in Workflow

**You:** Team of 2-10 developers, all using AI tools  

**Problem:** Each person's AI has different project understanding  

**Solution:** Shared `.cxt/` files in Git = shared project knowledge  

**Benefit:** Consistent AI suggestions, faster onboarding, better alignment

### Existing Markdown Documentation Users

**You:** Already maintain PROJECT.md, NOTES.md, etc.  

**Problem:** Files are unversioned, scattered, hard to keep in sync  

**Solution:** Migrate to `.cxt/` structure with version control  

**Benefit:** Same workflow, but now trackable and validated

## How It Works

cxt-manager uses familiar Git-like commands to version control your project context. The `.cxt/` folder contains three structured files:

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
⚠️  Warning: plan.md has very little content (45 chars, 2 lines)
✅ Cross-references are consistent
```

```bash
# Revert to previous state
cit checkout abc123

✅ Restored context files to commit abc123
```

All files are version controlled, validated for alignment, and easily accessible to AI tools.

## Key Benefits

1. **Git-Like Workflow** - Commands you already know (status, add, commit, log, diff)
2. **Stop Repeating Yourself** - Write context once, reference it forever
3. **Version Control for Knowledge** - Track how project understanding evolves
4. **AI Tool Agnostic** - Works with Cursor, Copilot, Claude, ChatGPT, any AI
5. **Team Alignment** - Everyone's AI works from the same source of truth
6. **Offline First** - No external services, API keys, or internet required
7. **Privacy Friendly** - Your context, your machine, your choice to share
8. **Zero Lock-In** - Just markdown files, take them anywhere

## How cxt-manager Compares

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **No context management** | Zero overhead | Repeat yourself constantly | Tiny projects |
| **Ad-hoc markdown files** | Simple, familiar | No structure, no versioning | Solo experiments |
| **cxt-manager** | Structured, versioned, validated | Learning curve | Serious AI-assisted development |
| **External tools (Cursor Rules, etc.)** | IDE integration | Platform-locked, limited control | IDE-specific workflows |

**cxt-manager is for developers who:**

- Want structure without being locked into a platform
- Trust Git-like version control
- Use multiple AI tools (not just one IDE)
- Work in teams or on long-term projects

## Development

This is a monorepo containing:

### `@cxtmanager/core`
Framework-agnostic library for context management, Git integration, and validation.

### `@cxtmanager/cli`
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
- `@cxtmanager/cli` - CLI tool

## Links

- **Documentation:** [cxtmanager.dev/cli-docs](https://cxtmanager.dev/cli-docs)
- **GitHub:** [github.com/DigitalBrewLLC/cxt-manager](https://github.com/DigitalBrewLLC/cxt-manager)
- **Support:** [GitHub Issues](https://github.com/DigitalBrewLLC/cxt-manager/issues)

## License

MIT License

Copyright (c) 2025 Digital Brew LLC

**Built by:** [Digital Brew LLC](https://www.digitalbrew.tech)