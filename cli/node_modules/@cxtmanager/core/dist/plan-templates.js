"use strict";
/**
 * Plan templates for branch-aware plan.md files
 * Manager not enforcer - provides structure, user/AI provides content
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanTemplates = void 0;
class PlanTemplates {
    /**
     * Get minimal plan template
     */
    static getMinimal(branchName, date) {
        const branch = branchName || 'current branch';
        const createdDate = date || new Date().toISOString().split('T')[0];
        return `# Current Branch Implementation

*Branch: ${branch}*
*Created: ${createdDate}*

## What's Being Built
<!-- 
  GUIDANCE: Describe what is being built in this branch/feature.
  This helps AI understand the current work when providing assistance.
  Example: "OAuth2 authentication system with Google and GitHub providers"
  
  TIP: Be specific about the feature or functionality being implemented.
-->

## Implementation Approach  
<!-- 
  GUIDANCE: Describe the technical approach for implementing this feature.
  This helps AI make appropriate suggestions and understand the architecture.
  Example: "Use Passport.js for OAuth strategies, store tokens in encrypted session storage"
  
  TIP: Include key technologies, patterns, or architectural decisions.
-->

## Tasks & Progress
<!-- 
  GUIDANCE: Track tasks and progress as work proceeds.
  This helps AI understand what's done and what remains.
  Example: "- [x] Set up OAuth providers, - [ ] Implement token refresh"
  
  TIP: Update this section as work progresses. AI can help track completion.
-->

## Decisions Made
<!-- 
  GUIDANCE: Document key technical decisions made during implementation.
  This helps maintain context and explain why certain approaches were chosen.
  Example: "Chose JWT over session tokens for better scalability"
  
  TIP: Include rationale for important architectural or design decisions.
-->
`;
    }
    /**
     * Get detailed plan template
     */
    static getDetailed(branchName, date) {
        const branch = branchName || 'current branch';
        const createdDate = date || new Date().toISOString().split('T')[0];
        return `# Current Branch Implementation

*Branch: ${branch}*
*Created: ${createdDate}*

## What's Being Built
<!-- 
  GUIDANCE: Describe what is being built in this branch/feature.
  This helps AI understand the current work when providing assistance.
  Example: "OAuth2 authentication system with Google and GitHub providers"
  
  TIP: Be specific about the feature or functionality being implemented.
-->

## Implementation Approach  
<!-- 
  GUIDANCE: Describe the technical approach for implementing this feature.
  This helps AI make appropriate suggestions and understand the architecture.
  Example: "Use Passport.js for OAuth strategies, store tokens in encrypted session storage"
  
  TIP: Include key technologies, patterns, or architectural decisions.
-->

## Architecture Decisions
<!-- 
  GUIDANCE: Document architectural choices and their rationale.
  This helps maintain consistency and explain design decisions.
  Example: "Chose JWT over session tokens for better scalability"
  
  TIP: Include trade-offs, alternatives considered, and why this approach was chosen.
-->

## Tasks & Progress
- [ ] Task 1
- [ ] Task 2
<!-- 
  GUIDANCE: Track tasks and progress as work proceeds.
  This helps AI understand what's done and what remains.
  Example: "- [x] Set up OAuth providers, - [ ] Implement token refresh"
  
  TIP: Update this section as work progresses. AI can help track completion.
-->

## Decisions Made
<!-- 
  GUIDANCE: Document key technical decisions made during implementation.
  This helps maintain context and explain why certain approaches were chosen.
  Example: "Chose JWT over session tokens for better scalability"
  
  TIP: Include rationale for important architectural or design decisions.
-->

## Related Context
<!-- 
  GUIDANCE: Links to related issues, PRs, or documentation.
  This helps connect the implementation to broader project context.
  Example: "Related to issue #123, see PR #456 for design discussion"
  
  TIP: Include references to external resources that provide additional context.
-->
`;
    }
}
exports.PlanTemplates = PlanTemplates;
//# sourceMappingURL=plan-templates.js.map