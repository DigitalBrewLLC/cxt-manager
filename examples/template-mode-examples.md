# Template Mode - Example Files

This document shows what files are created when you run `cit init --template` or choose "Template" mode.

**Template mode creates pre-structured files with section headers and guidance comments to help you fill them in.**

## context.md

```markdown
# Project Context

*This file contains stable project information that doesn't change per branch.*
*See plan.md for branch-specific implementation details.*

*Last Updated: 2025-01-15*

## Project Purpose
<!-- 
  GUIDANCE: Describe what this project does and why it exists.
  This helps AI understand the project's goals when providing assistance.
  Example: "A task management app for remote teams"
  
  TIP: Be specific about the problem you're solving and who benefits from it.
-->

## Core Problem  
<!-- 
  GUIDANCE: What problem does this project solve?
  This helps AI understand the motivation behind the project.
  Example: "Remote teams struggle to track tasks across multiple tools"
  
  TIP: Focus on the user's pain point, not the technical solution.
-->

## Solution
<!-- 
  GUIDANCE: How does this project address the problem?
  This helps AI understand your approach to solving the problem.
  Example: "Unified task management with Slack integration for seamless workflow"
  
  TIP: Explain the high-level approach, not implementation details (those go in plan.md).
-->

## Target Users
<!-- 
  GUIDANCE: Who will use this project?
  This helps AI tailor suggestions to your audience.
  Example: "Remote teams of 5-50 people using Slack for communication"
  
  TIP: Be specific about user characteristics, needs, and constraints.
-->

## Key Features
<!-- 
  GUIDANCE: What are the main features and capabilities?
  This helps AI understand what functionality is important.
  Example: "Task creation, team collaboration, Slack notifications, deadline tracking"
  
  TIP: List the core features that define your project's value proposition.
-->
```

## plan.md

```markdown
# Development Plan

*This file contains branch-specific implementation details.*
*When you switch branches, this file automatically switches to that branch's plan.*
*See context.md for stable project background.*

*Last Updated: 2025-01-15*
*References: context.md for project vision*

## Architecture Overview
<!-- 
  GUIDANCE: Describe the technical architecture for this branch/feature.
  This helps AI understand how the code is structured.
  Example: "REST API with Express.js, PostgreSQL database, React frontend"
  
  TIP: Focus on the architecture decisions relevant to current work.
  AI will update this as implementation progresses.
-->

## Development Phases
<!-- 
  GUIDANCE: Break down development into phases or milestones.
  This helps AI understand the development timeline and priorities.
  Example: "Phase 1: Authentication, Phase 2: Core features, Phase 3: Integrations"
  
  TIP: Update this as work progresses. AI can help track completion status.
-->

## Technology Stack
<!-- 
  GUIDANCE: List technologies, frameworks, and tools being used.
  This helps AI make appropriate suggestions and avoid incompatible solutions.
  Example: "Node.js 18+, TypeScript, React 18, PostgreSQL 14, Docker"
  
  TIP: Include versions and important constraints (e.g., "must support Node 16+").
-->

## Success Criteria
<!-- 
  GUIDANCE: Define what success looks like for this branch/feature.
  This helps AI understand when work is complete.
  Example: "Users can create accounts, login, and reset passwords"
  
  TIP: Be specific and measurable. AI can help verify completion.
-->
```

## guardrail.md

```markdown
# Development Guardrails

*This file contains universal project constraints and rules.*
*These apply across all branches and should be respected by AI tools.*

*Last Updated: 2025-01-15*

## Code Standards
<!-- 
  GUIDANCE: Coding standards and conventions.
  This helps AI generate code that matches your project's style.
  Example: "Use TypeScript strict mode, ESLint rules, 2-space indentation"
  
  TIP: Reference your linter config, style guide, or team conventions.
-->

## Architecture Rules
<!-- 
  GUIDANCE: Architectural constraints and patterns.
  This helps AI make decisions that align with your architecture.
  Example: "No direct database access from components, use service layer"
  
  TIP: Document patterns to follow and anti-patterns to avoid.
-->

## Security Requirements
<!-- 
  GUIDANCE: Security guidelines and requirements.
  This helps AI avoid security vulnerabilities.
  Example: "All user input must be sanitized, use HTTPS only, no secrets in code"
  
  TIP: Include authentication, authorization, data protection requirements.
-->

## Performance Constraints
<!-- 
  GUIDANCE: Performance requirements and limits.
  This helps AI optimize code appropriately.
  Example: "API responses < 200ms, support 1000 concurrent users"
  
  TIP: Include response time targets, scalability requirements, resource limits.
-->
```

---

**Characteristics of Template Mode:**
- ✅ Pre-structured with section headers
- ✅ Includes HTML comments with GUIDANCE, TIP, and Example text
- ✅ Includes "Last Updated" metadata
- ✅ More prescriptive guidance for what to fill in
- ⚠️ May show higher template percentage initially (due to guidance comments)
- 💡 Best for users who want structure and guidance

