import { hooksCommand } from '../commands/hooks';

describe('hooks command', () => {
  it('should export hooks command', () => {
    expect(hooksCommand).toBeDefined();
    expect(hooksCommand.name()).toBe('hooks');
  });

  it('should have correct description', () => {
    const description = hooksCommand.description();
    expect(description).toBeDefined();
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
    expect(description.toLowerCase()).toContain('hook');
  });

  it('should have install subcommand', () => {
    const installCmd = hooksCommand.commands.find(cmd => cmd.name() === 'install');
    expect(installCmd).toBeDefined();
    expect(installCmd?.description()).toBeDefined();
  });

  it('should have remove subcommand', () => {
    const removeCmd = hooksCommand.commands.find(cmd => cmd.name() === 'remove');
    expect(removeCmd).toBeDefined();
    expect(removeCmd?.description()).toBeDefined();
  });

  it('should have status subcommand', () => {
    const statusCmd = hooksCommand.commands.find(cmd => cmd.name() === 'status');
    expect(statusCmd).toBeDefined();
    expect(statusCmd?.description()).toBeDefined();
  });

  it('should not have duplicate subcommand names', () => {
    const subcommandNames = hooksCommand.commands.map(cmd => cmd.name());
    const uniqueNames = new Set(subcommandNames);
    expect(uniqueNames.size).toBe(subcommandNames.length);
  });

  it('should have exactly 3 subcommands', () => {
    expect(hooksCommand.commands.length).toBe(3);
  });

  it('should have all subcommands with valid names', () => {
    const subcommandNames = hooksCommand.commands.map(cmd => cmd.name());
    expect(subcommandNames).toContain('install');
    expect(subcommandNames).toContain('remove');
    expect(subcommandNames).toContain('status');
  });

  it('should have valid command structure', () => {
    expect(typeof hooksCommand.name).toBe('function');
    expect(typeof hooksCommand.description).toBe('function');
    expect(Array.isArray(hooksCommand.commands)).toBe(true);
  });
});

