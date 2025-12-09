import { initCommand } from '../commands/init';

// Basic test for init command structure
// Note: Full integration tests require mocking file system and git operations

describe('init command', () => {
  it('should export init command', () => {
    expect(initCommand).toBeDefined();
    expect(initCommand.name()).toBe('init');
  });

  it('should have correct description', () => {
    const description = initCommand.description();
    expect(description).toBeDefined();
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
  });

  it('should have --template option', () => {
    const options = initCommand.options;
    const templateOption = options.find((opt: { long?: string }) => opt.long === '--template');
    expect(templateOption).toBeDefined();
  });

  it('should have --blank option', () => {
    const options = initCommand.options;
    const blankOption = options.find((opt: { long?: string }) => opt.long === '--blank');
    expect(blankOption).toBeDefined();
  });

  it('should have valid command structure', () => {
    expect(typeof initCommand.name).toBe('function');
    expect(typeof initCommand.description).toBe('function');
    expect(Array.isArray(initCommand.options)).toBe(true);
  });
});

