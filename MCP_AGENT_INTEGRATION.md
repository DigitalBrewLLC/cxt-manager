# MCP & Agent Integration - Future PR

## Overview

CxtManager is well-positioned for MCP (Model Context Protocol) and AI agent integration. This document outlines the integration strategy and implementation plan.

## Current State

- ✅ MCP configuration structure exists in `CxtConfig` (placeholder)
- ✅ Clean, file-based architecture
- ✅ Public API methods: `getContextFiles()`, `status()`, `validate()`, `syncPlan()`, etc.
- ✅ Git-integrated with version control
- ✅ Validation and alignment checking built-in
- ✅ Branch-aware plan.md switching

## Integration Potential: **Very High** ⭐⭐⭐⭐⭐

### Why CxtManager Fits MCP/Agents Perfectly

1. **File-Based Architecture** - MCP works naturally with file resources
2. **Structured Data** - Three clear file types map perfectly to MCP resources
3. **Version Control** - Git integration provides history and conflict handling
4. **Validation Built-In** - Quality checks prevent bad updates
5. **Branch Awareness** - Supports parallel agent workflows

## MCP Server Implementation Plan

### Phase 1: MCP Server (MVP)

**Resources** (Read-only):
- `cxt://context.md` - Project context
- `cxt://plan.md` - Current plan (branch-specific)
- `cxt://guardrail.md` - Constraints and rules
- `cxt://status` - Validation status
- `cxt://history` - Context file change history

**Tools** (Actions):
- `cxt_read_file` - Read any context file
- `cxt_update_file` - Update context file (with validation)
- `cxt_validate` - Check alignment and health
- `cxt_sync_plan` - Sync plan.md for current branch
- `cxt_get_status` - Get current status (git, health, files)
- `cxt_commit` - Commit context changes with attribution

**Prompts** (Templates):
- `update_context` - Template for updating context.md
- `update_plan` - Template for updating plan.md  
- `update_guardrail` - Template for updating guardrail.md

### Implementation Structure

```typescript
// mcp-server.ts
export class CxtManagerMCPServer {
  private manager: ContextManager;

  // Resources
  listResources(): Resource[] {
    return [
      { uri: 'cxt://context.md', name: 'Project Context' },
      { uri: 'cxt://plan.md', name: 'Current Plan' },
      { uri: 'cxt://guardrail.md', name: 'Constraints' }
    ];
  }

  // Tools
  listTools(): Tool[] {
    return [
      { name: 'cxt_read', description: 'Read context file' },
      { name: 'cxt_update', description: 'Update context file' },
      { name: 'cxt_validate', description: 'Validate alignment' }
    ];
  }
}
```

## Agent Integration Plan

### Agent Workflow

```
1. Agent reads .cxt/context.md (project understanding)
2. Agent reads .cxt/plan.md (current work)
3. Agent reads .cxt/guardrail.md (constraints)
4. Agent performs work
5. Agent updates .cxt/plan.md (progress)
6. Agent validates alignment
7. Agent commits changes with attribution
```

### Multi-Agent Scenarios

- **Shared Context**: Multiple agents read same context files
- **Branch Isolation**: Each agent branch has own plan.md
- **Conflict Detection**: Validation catches misalignment
- **History Tracking**: See which agent made which changes

### Agent SDK Structure

```typescript
// agent-sdk.ts
export class CxtManagerAgent {
  async getContext(): Promise<ProjectContext> {
    const files = await this.manager.getContextFiles();
    return {
      context: files.find(f => f.name === 'context.md'),
      plan: files.find(f => f.name === 'plan.md'),
      guardrails: files.find(f => f.name === 'guardrail.md')
    };
  }

  async updatePlan(updates: string): Promise<void> {
    await this.manager.updateContextFile('plan.md', updates, {
      author: 'Agent',
      source: 'agent-workflow'
    });
  }
}
```

## Key Advantages

1. **Standardized Interface** - MCP provides standard protocol
2. **Tool Agnostic** - Works with any MCP-compatible tool
3. **Version Control** - Git integration tracks all changes
4. **Validation** - Built-in checks prevent bad updates
5. **Branch Awareness** - Supports parallel agent work
6. **Attribution** - Track which agent/AI made changes

## Challenges & Solutions

### Challenge 1: Write Conflicts
**Problem**: Multiple agents updating simultaneously  
**Solution**: Git handles this; validation catches conflicts

### Challenge 2: Attribution
**Problem**: Tracking which agent made changes  
**Solution**: Already have `ai_attribution` config; extend to agent IDs

### Challenge 3: Validation Timing
**Problem**: When to validate  
**Solution**: Pre-commit hooks + manual validation + optional auto-validate on update

## Implementation Checklist

### MCP Server
- [ ] Create `@cxtmanager/mcp-server` package
- [ ] Implement MCP server with resources, tools, prompts
- [ ] Add MCP server tests
- [ ] Document MCP integration in README
- [ ] Add example MCP client usage

### Agent SDK
- [ ] Create `@cxtmanager/agent-sdk` package
- [ ] Implement agent-friendly API wrapper
- [ ] Add agent attribution tracking
- [ ] Add agent SDK tests
- [ ] Document agent integration patterns

### Integration
- [ ] Update `CxtConfig.mcp` to enable/configure MCP server
- [ ] Add agent attribution to commit messages
- [ ] Add agent ID tracking to context file metadata
- [ ] Update validation to handle agent updates
- [ ] Add examples for common agent workflows

## Related Files

- `core/src/types.ts` - MCP config structure (lines 55-79)
- `core/src/context-manager.ts` - Main API (getContextFiles, status, validate, etc.)
- `core/src/git-repository.ts` - Git operations with attribution
- `examples/config-examples.md` - MCP config examples

## Next Steps

1. **Research**: Review MCP spec and existing implementations
2. **Design**: Finalize MCP server API and agent SDK structure
3. **Implement**: Build MCP server package
4. **Test**: Create integration tests with MCP clients
5. **Document**: Add comprehensive examples and guides

## Notes

- Current MCP config is placeholder - needs full implementation
- Architecture is already well-suited for this integration
- Consider making MCP server optional (config flag)
- Agent SDK should be lightweight wrapper around core API
- Attribution is key for multi-agent scenarios

