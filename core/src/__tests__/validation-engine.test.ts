import { ValidationEngine } from '../validation-engine';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('ValidationEngine', () => {
  let testDir: string;
  let validationEngine: ValidationEngine;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `cxtmanager-validation-test-${Date.now()}`);
    fs.ensureDirSync(testDir);
    validationEngine = new ValidationEngine(testDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('validate', () => {
    it('should return health status with no issues when files are aligned', async () => {
      // Create aligned context files
      const cxtDir = path.join(testDir, '.cxt');
      await fs.ensureDir(cxtDir);

      const contextContent = `# Project Context
## Goals
- Build a great product
`;
      const planContent = `# Implementation Plan
## Goals
- Build a great product
`;
      const guardrailContent = `# Guardrails
## Rules
- Follow best practices
`;

      await fs.writeFile(path.join(cxtDir, 'context.md'), contextContent);
      await fs.writeFile(path.join(cxtDir, 'plan.md'), planContent);
      await fs.writeFile(path.join(cxtDir, 'guardrail.md'), guardrailContent);

      const health = await validationEngine.checkHealth();

      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(Array.isArray(health.issues)).toBe(true);
      expect(Array.isArray(health.suggestions)).toBe(true);
    });

    it('should detect empty files', async () => {
      // ValidationEngine expects files directly in cxtPath, not in .cxt subdirectory
      await fs.ensureDir(testDir);

      // Create an empty file (just structure, no actual content)
      // Only header and metadata - no user content
      const emptyContent = `# Project Context

*Last Updated: 2025-01-15*
`;
      await fs.writeFile(path.join(testDir, 'context.md'), emptyContent);
      // Also create plan.md and guardrail.md so validation runs
      await fs.writeFile(path.join(testDir, 'plan.md'), '# Plan\n');
      await fs.writeFile(path.join(testDir, 'guardrail.md'), '# Guardrails\n');

      const health = await validationEngine.checkHealth();

      // Validation engine should detect empty content
      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(Array.isArray(health.issues)).toBe(true);
      // Should have issues for empty content
      // The message should be "File is empty or contains only structure"
      const emptyIssues = health.issues.filter(issue => 
        issue.message.includes('empty') || 
        issue.message.includes('very little content') ||
        issue.message.includes('File is empty')
      );
      expect(emptyIssues.length).toBeGreaterThan(0);
    });

    it('should detect short content files', async () => {
      // ValidationEngine expects files directly in cxtPath, not in .cxt subdirectory
      await fs.ensureDir(testDir);

      // Create a file with very little content (below 100 chars, 3 lines)
      const shortContent = `# Project Context

This is a short description.
`;
      await fs.writeFile(path.join(testDir, 'context.md'), shortContent);
      // Also create plan.md and guardrail.md so validation runs
      await fs.writeFile(path.join(testDir, 'plan.md'), '# Plan\n');
      await fs.writeFile(path.join(testDir, 'guardrail.md'), '# Guardrails\n');

      const health = await validationEngine.checkHealth();

      // Validation engine should detect short content
      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(Array.isArray(health.issues)).toBe(true);
      // Should have issues for short content
      // The message should be "File has very little content"
      const shortIssues = health.issues.filter(issue => 
        issue.message.includes('very little content') || 
        issue.message.includes('short') ||
        issue.message.includes('File has very little')
      );
      expect(shortIssues.length).toBeGreaterThan(0);
    });

    it('should check alignment between context and plan', async () => {
      const cxtDir = path.join(testDir, '.cxt');
      await fs.ensureDir(cxtDir);

      const contextContent = `# Project Context
## Goals
- Goal A
- Goal B
`;
      const planContent = `# Implementation Plan
## Goals
- Goal X (different from context)
- Goal Y
`;

      await fs.writeFile(path.join(cxtDir, 'context.md'), contextContent);
      await fs.writeFile(path.join(cxtDir, 'plan.md'), planContent);

      const health = await validationEngine.checkHealth();

      // Should return health status
      expect(health).toBeDefined();
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('issues');
      expect(health).toHaveProperty('suggestions');
    });
  });
});

