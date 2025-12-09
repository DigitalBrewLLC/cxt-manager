import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CLI', () => {
  describe('Version Command', () => {
    it('should read version from package.json', () => {
      const packageJson = JSON.parse(
        readFileSync(join(__dirname, '../../package.json'), 'utf8')
      );
      expect(packageJson.version).toBeDefined();
      expect(typeof packageJson.version).toBe('string');
    });

    it('should have valid version format', () => {
      const packageJson = JSON.parse(
        readFileSync(join(__dirname, '../../package.json'), 'utf8')
      );
      // Version should match semver pattern
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Command Registration', () => {
    it('should not have duplicate command names', () => {
      // Import all commands
      const { initCommand } = require('../commands/init');
      const { statusCommand } = require('../commands/status');
      const { validateCommand } = require('../commands/validate');
      const { blameCommand } = require('../commands/blame');
      const { addCommand } = require('../commands/add');
      const { commitCommand } = require('../commands/commit');
      const { logCommand } = require('../commands/log');
      const { diffCommand } = require('../commands/diff');
      const { checkoutCommand } = require('../commands/checkout');
      const { syncPlanCommand } = require('../commands/sync-plan');
      const { hooksCommand } = require('../commands/hooks');
      const { syncGitignoreCommand } = require('../commands/sync-gitignore');

      const commands = [
        initCommand,
        statusCommand,
        validateCommand,
        blameCommand,
        addCommand,
        commitCommand,
        logCommand,
        diffCommand,
        checkoutCommand,
        syncPlanCommand,
        hooksCommand,
        syncGitignoreCommand
      ];

      const commandNames = commands.map(cmd => cmd.name());
      const uniqueNames = new Set(commandNames);
      
      // All command names should be unique
      expect(uniqueNames.size).toBe(commandNames.length);
    });

    it('should have all expected commands', () => {
      const { initCommand } = require('../commands/init');
      const { statusCommand } = require('../commands/status');
      const { validateCommand } = require('../commands/validate');
      const { hooksCommand } = require('../commands/hooks');

      expect(initCommand.name()).toBe('init');
      expect(statusCommand.name()).toBe('status');
      expect(validateCommand.name()).toBe('validate');
      expect(hooksCommand.name()).toBe('hooks');
    });

    it('should have commands with valid structure', () => {
      const { initCommand } = require('../commands/init');
      
      expect(initCommand).toBeDefined();
      expect(typeof initCommand.name).toBe('function');
      expect(typeof initCommand.description).toBe('function');
      expect(Array.isArray(initCommand.options)).toBe(true);
    });
  });
});

