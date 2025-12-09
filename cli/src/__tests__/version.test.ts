import { versionCommand } from '../commands/version';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock https module at the top level
jest.mock('https', () => ({
  request: jest.fn()
}));

import * as https from 'https';
const mockHttpsRequest = https.request as jest.Mock;

// Don't mock console - we want to see actual output for testing

describe('version command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpsRequest.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should export version command', () => {
    expect(versionCommand).toBeDefined();
    expect(versionCommand.name()).toBe('version');
  });

  it('should show current version', async () => {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8')
    );

    // Mock https request to return same version
    mockHttpsRequest.mockImplementation((options, callback) => {
      const mockResponse = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(JSON.stringify({
              'dist-tags': { latest: packageJson.version }
            }));
          }
          if (event === 'end') {
            handler();
          }
        }),
        setEncoding: jest.fn()
      };
      callback(mockResponse);
      return {
        on: jest.fn(),
        setTimeout: jest.fn(),
        end: jest.fn()
      };
    });

    const consoleSpy = jest.spyOn(console, 'log');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      // Don't actually exit
      expect(code).toBe(0);
      return undefined as never;
    });

    await versionCommand.parseAsync(['version'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`cxt-manager CLI v${packageJson.version}`)
    );
    
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should detect outdated version and suggest update', async () => {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8')
    );

    // Mock https request to return newer version
    mockHttpsRequest.mockImplementation((options, callback) => {
      const mockResponse = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(JSON.stringify({
              'dist-tags': { latest: '999.0.0' }
            }));
          }
          if (event === 'end') {
            handler();
          }
        }),
        setEncoding: jest.fn()
      };
      callback(mockResponse);
      return {
        on: jest.fn(),
        setTimeout: jest.fn(),
        end: jest.fn()
      };
    });

    const consoleSpy = jest.spyOn(console, 'log');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      // Don't actually exit, just verify the code
      expect(code).toBe(1);
      return undefined as never;
    });

    await versionCommand.parseAsync(['version'], { from: 'user' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('You\'re on version')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('latest is 999.0.0')
    );

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should handle network errors gracefully', async () => {
    // Mock https request to fail
    mockHttpsRequest.mockImplementation(() => {
      return {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Network error'));
          }
        }),
        setTimeout: jest.fn(),
        end: jest.fn()
      };
    });

    const consoleSpy = jest.spyOn(console, 'log');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      // Don't actually exit, just verify the code
      expect(code).toBe(0);
      return undefined as never;
    });

    await versionCommand.parseAsync(['version'], { from: 'user' });

    // Should still show version even if update check fails
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should handle timeout gracefully', async () => {
    // Mock https request to timeout
    mockHttpsRequest.mockImplementation(() => {
      const req = {
        on: jest.fn(),
        setTimeout: jest.fn((timeout, handler) => {
          // Simulate timeout
          handler();
        }),
        destroy: jest.fn(),
        end: jest.fn()
      };
      return req;
    });

    const consoleSpy = jest.spyOn(console, 'log');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      // Don't actually exit, just verify the code
      expect(code).toBe(0);
      return undefined as never;
    });

    await versionCommand.parseAsync(['version'], { from: 'user' });

    // Should still show version even if update check times out
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
