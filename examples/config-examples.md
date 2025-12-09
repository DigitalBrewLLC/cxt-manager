# Configuration Examples

This document shows example `.cxt/.cxtconfig.json` files for different use cases.

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
    "backup_on_switch": true,
    "plan_template_style": undefined,
    "auto_commit_ai_changes": true,
    "archive_completed": false
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
    "auto_sync": false,
    "health_checks": true,
    "ai_attribution": true,
    "drift_detection": true,
    "warn_threshold": 3,
    "content_quality": {
      "min_content_length": 100,
      "min_content_lines": 3,
      "empty_section_warning": true,
      "short_content_warning": 200
    },
    "show_in_changed_files": true,
    "auto_commit_context_updates": false
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
    "backup_on_switch": true,
    "plan_template_style": undefined,
    "auto_commit_ai_changes": true,
    "archive_completed": false
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
    "auto_sync": false,
    "health_checks": true,
    "ai_attribution": true,
    "drift_detection": true,
    "warn_threshold": 3,
    "content_quality": {
      "min_content_length": 100,
      "min_content_lines": 3,
      "empty_section_warning": true,
      "short_content_warning": 200
    },
    "show_in_changed_files": true,
    "auto_commit_context_updates": false
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
    "backup_on_switch": true,
    "plan_template_style": undefined,
    "auto_commit_ai_changes": true,
    "archive_completed": false
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
    "auto_sync": false,
    "health_checks": true,
    "ai_attribution": true,
    "drift_detection": true,
    "warn_threshold": 3,
    "content_quality": {
      "min_content_length": 100,
      "min_content_lines": 3,
      "empty_section_warning": true,
      "short_content_warning": 200
    },
    "show_in_changed_files": true,
    "auto_commit_context_updates": false
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

### `plan_management.plan_template_style`
- Template style for plan.md files when switching branches
- **`"blank"`**: Creates plan.md with just title and metadata (no structure)
- **`"template"`**: Creates plan.md with structured sections and guidance comments
- **`undefined`**: Defaults to `config.mode` (respects init mode)
- **Example**: If you init with `blank` mode but want structured plan.md files, set this to `"template"`

### `plan_management.plan_template_style`
- Override for plan.md template style when switching branches
- **`"blank"`**: Creates plan.md with just title and metadata (no structure)
- **`"template"`**: Creates plan.md with structured sections and guidance comments
- **`undefined`**: Defaults to `config.mode` (respects init mode)
- **Example**: If you init with `blank` mode but want structured plan.md files, set this to `"template"`

