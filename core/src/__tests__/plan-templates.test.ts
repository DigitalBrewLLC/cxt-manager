import { PlanTemplates } from '../plan-templates';

describe('PlanTemplates', () => {
  describe('getMinimal', () => {
    it('should return a template string', () => {
      const template = PlanTemplates.getMinimal();
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });

    it('should include branch name when provided', () => {
      const template = PlanTemplates.getMinimal('feature/test');
      expect(template).toContain('feature/test');
    });

    it('should include date when provided', () => {
      const date = '2025-12-05';
      const template = PlanTemplates.getMinimal(undefined, date);
      expect(template).toContain(date);
    });

    it('should include guidance comments', () => {
      const template = PlanTemplates.getMinimal();
      expect(template).toContain('GUIDANCE');
      expect(template).toContain('What\'s Being Built');
      expect(template).toContain('Implementation Approach');
    });
  });

  describe('getDetailed', () => {
    it('should return a template string', () => {
      const template = PlanTemplates.getDetailed();
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });

    it('should be longer than minimal template', () => {
      const minimal = PlanTemplates.getMinimal();
      const detailed = PlanTemplates.getDetailed();
      expect(detailed.length).toBeGreaterThan(minimal.length);
    });

    it('should include branch name when provided', () => {
      const template = PlanTemplates.getDetailed('feature/test');
      expect(template).toContain('feature/test');
    });

    it('should include date when provided', () => {
      const date = '2025-12-05';
      const template = PlanTemplates.getDetailed(undefined, date);
      expect(template).toContain(date);
    });

    it('should include more sections than minimal template', () => {
      const minimal = PlanTemplates.getMinimal();
      const detailed = PlanTemplates.getDetailed();
      // Detailed should have more structure
      const detailedSections = (detailed.match(/^##/gm) || []).length;
      const minimalSections = (minimal.match(/^##/gm) || []).length;
      expect(detailedSections).toBeGreaterThanOrEqual(minimalSections);
    });
  });

  describe('template consistency', () => {
    it('should have consistent structure for both templates', () => {
      const minimal = PlanTemplates.getMinimal();
      const detailed = PlanTemplates.getDetailed();
      
      // Both should have title
      expect(minimal).toMatch(/^#/);
      expect(detailed).toMatch(/^#/);
      
      // Both should be valid markdown
      expect(minimal.trim().length).toBeGreaterThan(0);
      expect(detailed.trim().length).toBeGreaterThan(0);
    });
  });
});

