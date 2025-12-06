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
    expect(description).toContain('Initialize');
  });

  it('should have --manual option', () => {
    const options = initCommand.options;
    const manualOption = options.find((opt: any) => opt.long === '--manual');
    expect(manualOption).toBeDefined();
  });

  it('should have --minimal option', () => {
    const options = initCommand.options;
    const minimalOption = options.find((opt: any) => opt.long === '--minimal');
    expect(minimalOption).toBeDefined();
  });
});

