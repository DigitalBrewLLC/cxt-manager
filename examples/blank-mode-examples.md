# Blank Mode - Example Files

This document shows what files are created when you run `cit init --blank` or choose "Blank" mode.

**Blank mode creates files with just the title and metadata - no structure, no section headers. You organize it however you want.**

## context.md

```markdown
# Project Context

*This file contains stable project information that doesn't change per branch.*
*See plan.md for branch-specific implementation details.*

```

## plan.md

```markdown
# Development Plan

*This file contains branch-specific implementation details.*
*When you switch branches, this file automatically switches to that branch's plan.*
*See context.md for stable project background.*

```

## guardrail.md

```markdown
# Guardrails

*This file contains universal rules and constraints that should rarely change.*

```

---

**Characteristics of Blank Mode:**
- ✅ Just title and metadata (no structure)
- ✅ No HTML comments or guidance text
- ✅ No section headers
- ✅ No placeholder text
- ✅ Maximum flexibility - you organize it
- ✅ Won't trigger false template warnings
- 💡 Best for users who want full control over structure

