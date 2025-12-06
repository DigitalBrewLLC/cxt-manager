module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
  moduleNameMapper: {
    '^@cxtmanager/core$': '<rootDir>/../core/src',
    '^chalk$': '<rootDir>/src/__tests__/__mocks__/chalk.ts',
    '^ora$': '<rootDir>/src/__tests__/__mocks__/ora.ts',
    '^inquirer$': '<rootDir>/src/__tests__/__mocks__/inquirer.ts',
  },
};

