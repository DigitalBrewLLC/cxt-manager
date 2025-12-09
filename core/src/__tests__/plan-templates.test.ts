import { PlanTemplates } from '../plan-templates';

describe('PlanTemplates', () => {
  describe('getBlank', () => {
    it('should return a template string', () => {
      const template = PlanTemplates.getBlank();
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });

    it('should include branch name when provided', () => {
      const template = PlanTemplates.getBlank('feature/test');
      expect(template).toContain('feature/test');
    });

    it('should include date when provided', () => {
      const date = '2025-12-05';
      const template = PlanTemplates.getBlank(undefined, date);
      expect(template).toContain(date);
    });

    it('should NOT include guidance comments', () => {
      const template = PlanTemplates.getBlank();
      expect(template).not.toContain('GUIDANCE');
      expect(template).not.toContain('<!--');
      expect(template).not.toContain('-->');
    });

    it('should NOT include section headers', () => {
      const template = PlanTemplates.getBlank();
      expect(template).not.toContain('##');
    });

    it('should only include title and metadata', () => {
      const template = PlanTemplates.getBlank();
      expect(template).toContain('# Development Plan');
      expect(template).toContain('*This file contains');
      // Should be shorter than template (no structure)
      const structured = PlanTemplates.getTemplate();
      expect(template.length).toBeLessThan(structured.length);
    });
  });

  describe('getTemplate', () => {
    it('should return a template string', () => {
      const template = PlanTemplates.getTemplate();
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });

    it('should be longer than blank template', () => {
      const blank = PlanTemplates.getBlank();
      const template = PlanTemplates.getTemplate();
      expect(template.length).toBeGreaterThan(blank.length);
    });

    it('should include branch name when provided', () => {
      const template = PlanTemplates.getTemplate('feature/test');
      expect(template).toContain('feature/test');
    });

    it('should include date when provided', () => {
      const date = '2025-12-05';
      const template = PlanTemplates.getTemplate(undefined, date);
      expect(template).toContain(date);
    });

    it('should include section headers', () => {
      const template = PlanTemplates.getTemplate();
      expect(template).toContain('##');
    });

    it('should include guidance comments', () => {
      const template = PlanTemplates.getTemplate();
      expect(template).toContain('GUIDANCE');
      expect(template).toContain('What\'s Being Built');
      expect(template).toContain('Implementation Approach');
    });
  });

  describe('template consistency', () => {
    it('should have consistent structure for both templates', () => {
      const blank = PlanTemplates.getBlank();
      const template = PlanTemplates.getTemplate();
      
      // Both should have title
      expect(blank).toMatch(/^#/);
      expect(template).toMatch(/^#/);
      
      // Both should be valid markdown
      expect(blank.trim().length).toBeGreaterThan(0);
      expect(template.trim().length).toBeGreaterThan(0);
    });

    it('should have blank template with minimal structure', () => {
      const blank = PlanTemplates.getBlank();
      const template = PlanTemplates.getTemplate();
      
      // Blank should have title
      expect(blank).toMatch(/^#/);
      
      // Blank should be shorter (no sections)
      expect(blank.length).toBeLessThan(template.length);
      
      // Blank should not have section headers
      expect(blank).not.toContain('##');
    });
  });
});
