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

Currently validating core concepts and architecture with real-world projects.

**What works now:**
- ✅ Git-like version control for context files
- ✅ Branch-aware plan.md switching
- ✅ Content quality hints
- ✅ Full commit history and diffs


Follow development: [Issues](https://github.com/DigitalBrewLLC/cxt-manager/issues) | [Discussions](https://github.com/DigitalBrewLLC/cxt-manager/discussions)

---

## The Problem

Every time you start a new chat with your AI coding assistant, you're the "context monkey":
- Re-explaining what your project does
- Repeating architectural decisions
- Restating constraints and requirements
- Watching your AI forget everything between sessions

**Your AI has no memory. Your project does. cxt-manager bridges the gap.**

## The Solution

cxt-manager gives you `cit` - a Git-like CLI for managing a `.cxt/` folder that your AI can reference. Three files, one source of truth:

```
.cxt/
├── context.md    # What your project is (stable truth)
├── plan.md       # What you're building (branch-specific)
└── guardrail.md  # What rules to follow (universal constraints)
```

### Git for AI Context

**Version control for your AI assistant's project memory.**

Just like Git tracks your code changes, cxt-manager tracks your context changes:

```bash
# Familiar workflow
cit status      # What changed?
cit add .       # Stage changes
cit commit -m "Updated architecture decisions"
cit log         # See history
cit diff        # Compare versions
```

**Key features:**
- **Branch-aware:** `plan.md` automatically switches with Git branches
- **Team-friendly:** Share context through Git like you share code
- **Full history:** Track how project understanding evolved
- **Private or shared:** Keep `.cxt/` in Git or `.gitignore` it

You version control your code. Now version control your context.

### How We Validate Markdown Files

**`cit validate` checks content quality, not markdown syntax.** We focus on ensuring your context files are useful for AI assistants, not enforcing markdown formatting rules.

**What we check:**

1. **Content Quality**
   - ✅ Empty files (error) - Files with no actual content
   - ✅ Short content (warning/error) - Files below minimum thresholds
   - ✅ Empty sections (warning) - Section headers with no content
   - ✅ Content length - Warns if content is below recommended thresholds

2. **Content Analysis**
   - ✅ Filters out structural elements (headers, metadata, guidance comments)
   - ✅ Counts actual user-written content
   - ✅ Detects empty sections in template mode
   - ✅ Provides file-specific suggestions based on purpose

3. **Drift Detection** (when not in quick mode)
   - ✅ Outdated information - Warns if "Last Updated" is >30 days old
   - ✅ Stale content warnings

**What we don't check:**
- ❌ Markdown syntax errors (broken links, invalid formatting)
- ❌ Markdown style (heading levels, list formatting)

**Why this approach?**
- **Manager, not Enforcer** - We help you maintain quality, not enforce formatting
- **AI-focused** - We check what matters for AI understanding, not markdown purity
- **Flexible** - You can use any markdown style; we just ensure there's actual content

**Configuration:**
Quality thresholds are configurable in `.cxt/.cxtconfig.json`:
```json
{
  "context": {
    "content_quality": {
      "min_content_length": 100,      // Minimum characters
      "min_content_lines": 3,         // Minimum lines
      "empty_section_warning": true,  // Warn about empty sections
      "short_content_warning": 200    // Warn if below this threshold
    }
  }
}
```

**Example validation output:**
```bash
$ cit validate

🟡 Overall Health: WARNING

⚠️  Issues Found:
├── ⚠️ context.md
│   File content is relatively short (150 characters)
│   💡 Consider expanding context.md with more details
└── ⚠️ plan.md
    File has 2 empty section(s)
    💡 Consider filling in the empty sections in plan.md
```

### How `cit` Commands Relate to Git

**`cit` commands use the same Git repository as your code.** They're Git-like commands specifically designed for managing `.cxt/` files, with context-aware features:

| Command | What It Does | Git Equivalent |
|---------|--------------|----------------|
| `cit status` | Shows `.cxt/` file status + health checks | `git status` (but filtered to `.cxt/` + quality hints) |
| `cit add` | Stages `.cxt/` files (defaults to `.cxt/` directory) | `git add .cxt/` (with validation warnings) |
| `cit commit` | Commits staged files **with validation** | `git commit` (but runs `cit validate` first) |
| `cit log` | Shows commit history for `.cxt/` files | `git log -- .cxt/` (filtered to context files) |
| `cit diff` | Shows changes in `.cxt/` files | `git diff -- .cxt/` (filtered to context files) |
| `cit checkout` | Reverts `.cxt/` files to previous state | `git checkout <commit> -- .cxt/` (context files only) |
| `cit validate` | Checks context file health/quality | No Git equivalent (like a linter for context files) |

**Key differences:**
- ✅ **Same Git repository** - Both `git` and `cit` commands commit to the same repo
- ✅ **Context-aware** - `cit` commands add validation, health checks, and smart prompts
- ✅ **Focused on `.cxt/`** - `cit` commands default to managing context files
- ✅ **Can be combined** - Use `git add` then `cit commit` for validation, or `cit add` then `git commit` for code

**Example workflow:**
```bash
# Option 1: Separate commits (recommended)
git add src/                    # Stage code changes
git commit -m "Add feature"     # Commit code

cit add .cxt/                   # Stage context changes
cit commit "Update context"    # Commit context (with validation)

# Option 2: Combined commit with validation
git add .                       # Stage everything
cit commit "Add feature + update context"  # Single commit with validation

# Option 3: Use git commit (skip validation)
git add .
git commit -m "Add feature + update context"  # No validation
```

**When to use `cit` vs `git`:**
- Use `cit` commands when working with `.cxt/` files (get validation + smart prompts)
- Use `git` commands when committing only code changes
- Mix them as needed - they work together seamlessly

---

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

**You and your AI decide what goes in the files. cxt-manager just keeps them organized, versioned, and accessible.**

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

**Benefit:** Consistent AI suggestions, faster onboarding, shared understanding

### Existing Markdown Documentation Users

**You:** Already maintain PROJECT.md, NOTES.md, etc.  

**Problem:** Files are unversioned, scattered, hard to keep in sync  

**Solution:** Migrate to `.cxt/` structure with version control  

**Benefit:** Same workflow, but now trackable with full history

## Quick Start

### Prerequisites

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

### Installation

**Global Installation (Recommended):**
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

**One-Time Usage (No Installation):**
```bash
# Using npx (npm)
npx @cxtmanager/cli init

# Using pnpm dlx
pnpm dlx @cxtmanager/cli init

# Using yarn dlx
yarn dlx @cxtmanager/cli init
```

**Verify Installation:**
```bash
cit --version
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

**Managing context files with `cit`:**
```bash
cit status          # Check context file status + health
cit add context.md  # Stage context changes
cit commit "Updated project goals"  # Commit with validation
cit log             # View context change history
cit diff            # See what changed
```

**Working with both code and context:**
```bash
# Separate commits (recommended)
git add src/                    # Stage code changes
git commit -m "Add feature"    # Commit code

cit add .cxt/                   # Stage context changes  
cit commit "Update context"     # Commit context (with validation)

# Or combined commit with validation
git add .                       # Stage everything
cit commit "Feature + context"  # Single commit with validation
```

## How It Works

cxt-manager uses familiar Git-like commands to version control your project context. The `.cxt/` folder contains three structured files:

- **context.md** - Your project's stable truth (what it does, why it exists, architecture)
- **plan.md** - Your implementation plan (branch-specific, switches with Git branches)
- **guardrail.md** - Universal constraints (rules, technology choices, things to avoid)

### Core Commands

```bash
# Check status
$ cit status

On branch: main
Your branch is up to date with 'origin/main'

Changes not staged for commit:
  (use "cit add <file>..." to update what will be committed)
  
  modified:   context.md
  modified:   plan.md

no changes added to commit (use "cit add" and/or "cit commit")

💡 Tips:
  • context.md is quite short (150 chars) - consider adding more detail
  • plan.md last updated 7 days ago - still accurate?
```

```bash
# Stage and commit context changes
$ cit add context.md
$ cit commit "Updated project goals"

✅ Committed changes to context.md

💡 Tip: plan.md might benefit from updates based on recent context changes
```

```bash
# View context history
$ cit log

commit abc123 (HEAD -> main)
Author: Developer <dev@example.com>
Date:   Mon Jan 15 10:30:00 2025

    Updated project goals

commit def456
Author: Developer <dev@example.com>
Date:   Mon Jan 15 09:15:00 2025

    Initial context setup
```

```bash
# See what changed
$ cit diff

diff --git a/.cxt/context.md b/.cxt/context.md
index 1234567..abcdefg 100644
--- a/.cxt/context.md
+++ b/.cxt/context.md
@@ -5,6 +5,7 @@
 ## What This Is
 The project is a SaaS platform for...
 
+## Architecture
+New focus: Mobile-first design approach
```

```bash
# Check context files
$ cit check

📊 Context Files Status:

context.md
  ✅ Committed
  💡 Content is brief (150 chars) - consider expanding

plan.md  
  ✅ Committed
  ⚠️  Last updated 7 days ago - might need refresh

guardrail.md
  ✅ Committed
  ✅ Good coverage
```

```bash
# Revert to previous state
$ cit checkout abc123

✅ Restored context files to commit abc123
```

All files are version controlled and easily accessible to AI tools.

## Core Philosophy

**cxt-manager is a Manager, not an Enforcer.**

We provide structure and Git-like version control for your context files. You decide what goes in them. Your AI helps you write them. cxt-manager keeps them organized, versioned, and accessible to your AI.

## Key Benefits

1. **Git-Like Workflow** - Commands you already know (status, add, commit, log, diff)
2. **Stop Repeating Yourself** - Write context once, reference it forever
3. **Version Control for Knowledge** - Track how project understanding evolves
4. **AI Tool Agnostic** - Works with Cursor, Copilot, Claude, ChatGPT, any AI
5. **Team Shared Context** - Everyone's AI works from the same source of truth
6. **Offline First** - No external services, API keys, or internet required
7. **Privacy Friendly** - Your context, your machine, your choice to share
8. **Zero Lock-In** - Just markdown files, take them anywhere

## How cxt-manager Compares

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **No context management** | Zero overhead | Repeat yourself constantly | Tiny projects |
| **Ad-hoc markdown files** | Simple, familiar | No structure, no versioning | Solo experiments |
| **cxt-manager** | Structured, versioned, Git-managed | Learning curve | Serious AI-assisted development |
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

## Getting Started

**Ready to try cxt-manager?**

1. **Install:** `npm install -g @cxtmanager/cli` (or use `pnpm`, `yarn`, or `bun`)
2. **Initialize:** `cit init` in your project directory
3. **Fill context:** Use your AI to help write the `.cxt/` files
4. **Reference it:** Start AI conversations with *"Read `.cxt/` files first"*
5. **Commit changes:** Use `cit commit` to version control updates

**Or try it without installing:** `npx @cxtmanager/cli init`

**Have questions?**
- 📖 [Documentation](https://cxtmanager.dev)
- 💬 [GitHub Discussions](https://github.com/DigitalBrewLLC/cxt-manager/discussions)
- 🐛 [Report Issues](https://github.com/DigitalBrewLLC/cxt-manager/issues)

**Like the project?**
- ⭐ Star the repo to follow development
- 📝 Write about your experience
- 💬 Join the conversation in Discussions

---

## Links

- **GitHub:** [github.com/DigitalBrewLLC/cxt-manager](https://github.com/DigitalBrewLLC/cxt-manager)
- **npm:** [@cxtmanager/cli](https://www.npmjs.com/package/@cxtmanager/cli)
- **Website:** [cxtmanager.dev](https://cxtmanager.dev)

## License

MIT License

Copyright (c) 2025 Digital Brew LLC

**Built by:** [Digital Brew LLC](https://www.digitalbrew.tech)