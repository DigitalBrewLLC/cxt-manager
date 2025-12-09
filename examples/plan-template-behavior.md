# Plan Template Behavior

This document explains how `plan.md` files are created when switching Git branches.

## How Plan Templates Work

When you switch Git branches, CxtManager automatically:
1. Saves the current branch's `plan.md` to `.plan-history/{branch-name}.md`
2. Restores the target branch's saved `plan.md` (if it exists)
3. If no saved plan exists, creates a new `plan.md` based on your configuration

## Template Selection Logic

The template used for new `plan.md` files follows this priority:

1. **`plan_management.plan_template_style`** (if set) - Explicit override
2. **`config.mode`** (if `plan_template_style` is not set) - Respects init mode (blank or template)
3. **Default**: Falls back to `config.mode` (blank or template)

### Blank Mode (`plan_template_style: "blank"` or `mode: "blank"`)

Creates `plan.md` with just title and metadata:

```markdown
# Development Plan

*This file contains branch-specific implementation details.*
*When you switch branches, this file automatically switches to that branch's plan.*
*See context.md for stable project background.*

*Branch: feature/auth*
*Created: 2025-01-15*

```

**Characteristics:**
- ✅ Just title and metadata
- ✅ No section headers
- ✅ No guidance comments
- ✅ Maximum flexibility

### Template Mode (`plan_template_style: "template"` or `mode: "template"`)

Creates `plan.md` with structured sections and guidance:

```markdown
# Current Branch Implementation

*Branch: feature/auth*
*Created: 2025-01-15*

## What's Being Built
<!-- 
  GUIDANCE: Describe what is being built in this branch/feature.
  ...
-->

## Implementation Approach
<!-- 
  GUIDANCE: Describe the technical approach...
  ...
-->

## Tasks & Progress
<!-- 
  GUIDANCE: Track tasks and progress...
  ...
-->

## Decisions Made
<!-- 
  GUIDANCE: Document key technical decisions...
  ...
-->
```

**Characteristics:**
- ✅ Pre-structured with section headers
- ✅ Includes HTML comments with GUIDANCE text
- ✅ More guidance for what to fill in

## Configuration Examples

### Respect Init Mode (Default)

```json
{
  "mode": "blank",
  "plan_management": {
    "plan_template_style": undefined
  }
}
```

**Result**: New `plan.md` files will be blank (respects `mode: "blank"`)

### Override Init Mode

```json
{
  "mode": "blank",
  "plan_management": {
    "plan_template_style": "template"
  }
}
```

**Result**: New `plan.md` files will be structured with guidance (overrides init mode)

### Explicit Template Style

```json
{
  "mode": "template",
  "plan_management": {
    "plan_template_style": "blank"
  }
}
```

**Result**: New `plan.md` files will be blank (explicit override)

## When Templates Are Used

Plan templates are created when:
- Switching to a branch that doesn't have a saved `plan.md`
- Running `cit sync-plan --create-if-missing`
- Git hooks automatically sync on branch checkout

## Changing Template Style

You can change the template style at any time by editing `.cxt/.cxtconfig.json`:

1. Edit `plan_management.plan_template_style` to `"blank"` or `"template"`
2. Next time you switch branches, new plans will use the new style
3. Existing saved plans are not affected

## Best Practices

- **Use `blank` mode** if you want full control over plan.md structure
- **Use `template` mode** if you want guidance and structure
- **Set `plan_template_style`** if you want different styles for context files vs plan files
- **Commit plan.md changes** before switching branches to preserve your work

