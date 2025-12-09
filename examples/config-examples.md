# Configuration Examples

This document shows example `.cxt/.cxtconfig.json` files for different use cases.

## Complete Configuration Reference (With Comments)

```json
{
  "version": "1.0.0",                    // Config schema version (internal use)
  "mode": "blank",                        // Init mode: "blank" (minimal) or "template" (structured)
  "created": "2025-01-15T10:30:00.000Z", // Timestamp when config was created
  
  "git_integration": {
    "enabled": true,                      // Enable Git integration features
    "track_in_git": true,                 // true = track .cxt/ in Git (shared), false = .gitignore (private)
    "auto_install_hooks": true,          // Automatically install Git hooks on init
    "silent_mode": true,                  // Suppress hook output unless errors occur
    "hooks": {
      "post_checkout": "sync-plan",      // Run 'cit sync-plan' after git checkout (switches plan.md)
      "pre_commit": "validate"           // Run 'cit validate' before git commit (blocks on errors)
    }
  },
  
  "plan_management": {
    "backup_on_switch": true,            // Save plan.md to .plan-history/{branch}.md when switching branches
    "plan_template_style": "blank"       // Optional: Override template style for plan.md ("blank" | "template" | omit to use config.mode)
  },
  
  "context": {
    "health_checks": true,                // Enable health validation checks
    "ai_attribution": true,              // Track AI vs human changes (used by 'cit blame')
    "drift_detection": true,             // Warn when code changes outpace context updates
    "warn_threshold": 3,                 // Number of commits before drift warning appears
    "content_quality": {
      "min_content_length": 100,         // Minimum characters of actual content (below = "short" error)
      "min_content_lines": 3,            // Minimum lines of actual content (below = "short" error)
      "empty_section_warning": true,     // Warn if template sections are empty
      "short_content_warning": 200       // Warn if content is below this length (even if meets minimums)
    }
  },
  
}
```

## Blank Mode Configuration

```json
{
  "version": "1.0.0",
  "mode": "blank",
  "git_integration": {
    "enabled": true,
    "hooks": {
      "post_checkout": "sync-plan",
      "pre_commit": "validate",
    },
    "silent_mode": true,
    "auto_install_hooks": true,
    "track_in_git": true
  },
  "plan_management": {
    "backup_on_switch": true
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

## Template Mode Configuration

```json
{
  "version": "1.0.0",
  "mode": "template",
  "git_integration": {
    "enabled": true,
    "hooks": {
      "post_checkout": "sync-plan",
      "pre_commit": "validate",
    },
    "silent_mode": true,
    "auto_install_hooks": true,
    "track_in_git": true
  },
  "plan_management": {
    "backup_on_switch": true
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

## Private Context Files (Not Tracked in Git)

```json
{
  "version": "1.0.0",
  "mode": "blank",
  "git_integration": {
    "enabled": true,
    "hooks": {
      "post_checkout": "sync-plan",
      "pre_commit": "validate",
    },
    "silent_mode": true,
    "auto_install_hooks": true,
    "track_in_git": false
  },
  "plan_management": {
    "backup_on_switch": true
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

## Configuration Options Explained

### `mode`
- **`"blank"`**: Files were initialized with just title and metadata (no structure)
- **`"template"`**: Files were initialized with pre-structured sections and guidance comments

### `git_integration.track_in_git`
- **`true`**: Context files are tracked in Git (shared with team)
- **`false`**: Context files are in `.gitignore` (private, local only)

### `context.content_quality`
- **`min_content_length`**: Minimum characters of actual content (default: 100). Files below this are marked as "short"
- **`min_content_lines`**: Minimum lines of actual content (default: 3). Files below this are marked as "short"
- **`empty_section_warning`**: Warn if sections are empty in template mode (default: true)
- **`short_content_warning`**: Warn if content is below this length even if it meets minimums (default: 200 chars)

### `plan_management.backup_on_switch`
- **`true`** (default): Save current branch's plan.md to `.plan-history/{branch}.md` before switching branches
- **`false`**: Don't backup plan.md when switching branches (plan.md will be overwritten)
- **Use case**: Set to `false` if you prefer to manage plan.md manually or don't need branch-specific plans

### `plan_management.plan_template_style` (Optional)
- Override for plan.md template style when switching branches
- **`"blank"`**: Creates plan.md with just title and metadata (no structure)
- **`"template"`**: Creates plan.md with structured sections and guidance comments
- **Omitted or `null`**: Defaults to `config.mode` (respects init mode)
- **Example**: If you init with `blank` mode but want structured plan.md files, set this to `"template"`

### `context.drift_detection` and `context.warn_threshold`
- **`drift_detection`**: Enable warnings when code changes outpace context updates (default: `true`)
- **`warn_threshold`**: Number of commits before warning about drift (default: `3`)

### `context.ai_attribution`
- Track which changes were made by AI vs. human (default: `true`)
- Used by `cit blame` command to show attribution

