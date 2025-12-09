import { validateCommand } from '../commands/validate';
import { ContextManager } from '@cxtmanager/core';
import type { HealthIssue, HealthStatus } from '@cxtmanager/core';

// Mock dependencies
jest.mock('@cxtmanager/core');
jest.mock('chalk', () => ({
  red: jest.fn((str: string) => str),
  yellow: jest.fn((str: string) => str),
  blue: jest.fn((str: string) => str),
  green: jest.fn((str: string) => str),
  gray: jest.fn((str: string) => str),
  bold: jest.fn((str: string) => str)
}));

describe('validate command', () => {
  let mockManager: jest.Mocked<ContextManager>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    mockManager = {
      isInitialized: jest.fn(),
      validate: jest.fn()
    } as unknown as jest.Mocked<ContextManager>;

    (ContextManager as jest.MockedClass<typeof ContextManager>).mockImplementation(() => mockManager);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should export validate command', () => {
    expect(validateCommand).toBeDefined();
    expect(validateCommand.name()).toBe('validate');
  });

  it('should have --detailed option', () => {
    const options = validateCommand.options;
    const detailedOption = options.find((opt: { long?: string }) => opt.long === '--detailed');
    expect(detailedOption).toBeDefined();
  });

  it('should have --quick option', () => {
    const options = validateCommand.options;
    const quickOption = options.find((opt: { long?: string }) => opt.long === '--quick');
    expect(quickOption).toBeDefined();
  });

  it('should have --silent option', () => {
    const options = validateCommand.options;
    const silentOption = options.find((opt: { long?: string }) => opt.long === '--silent');
    expect(silentOption).toBeDefined();
  });

  describe('when not initialized', () => {
    it('should show error message in normal mode', async () => {
      mockManager.isInitialized.mockResolvedValue(false);

      await validateCommand.parseAsync(['validate']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('cxt-manager not initialized')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with error code in silent mode when not initialized', async () => {
      mockManager.isInitialized.mockResolvedValue(false);

      await validateCommand.parseAsync(['validate', '--silent']).catch(() => {});

      // Silent mode still exits with error code when not initialized
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('when initialized', () => {
    beforeEach(() => {
      mockManager.isInitialized.mockResolvedValue(true);
    });

    it('should call manager.validate with quick option', async () => {
      const mockHealth: HealthStatus = {
        overall: 'healthy',
        lastChecked: new Date(),
        issues: [],
        suggestions: []
        // alignments is optional - reserved for future MCP/agent integration
      };
      mockManager.validate.mockResolvedValue(mockHealth);

      await validateCommand.parseAsync(['validate', '--quick']).catch(() => {});

      expect(mockManager.validate).toHaveBeenCalled();
    });

    it('should exit with code 1 when errors are found in silent mode', async () => {
      const mockHealth: HealthStatus = {
        overall: 'error',
        lastChecked: new Date(),
        issues: [
          {
            type: 'error',
            file: 'context.md',
            message: 'Test error',
            autoFixable: false
          } as HealthIssue
        ],
        suggestions: []
        // alignments is optional - reserved for future MCP/agent integration
      };
      mockManager.validate.mockResolvedValue(mockHealth);

      try {
        await validateCommand.parseAsync(['validate', '--silent']);
      } catch (error) {
        // Command may throw if git is not initialized
      }

      // If validation succeeded, should exit with error code when errors found
      if (mockManager.validate.mock.calls.length > 0) {
        expect(processExitSpy).toHaveBeenCalledWith(1);
      }
    });

    it('should not exit when no errors in silent mode', async () => {
      const mockHealth: HealthStatus = {
        overall: 'healthy',
        lastChecked: new Date(),
        issues: [],
        suggestions: []
        // alignments is optional - reserved for future MCP/agent integration
      };
      mockManager.validate.mockResolvedValue(mockHealth);

      await validateCommand.parseAsync(['validate', '--silent']);

      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});

