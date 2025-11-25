module.exports = {
  preset: 'jest-expo',

  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Transform files
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/jest.config.js',
    '!**/.expo/**',
    '!**/index.js',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/e2e/**'
  ],

  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.test.(js|jsx|ts|tsx)',
    '**/*.spec.(js|jsx|ts|tsx)'
  ],

  // Module name mapper for static assets
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Test timeout
  testTimeout: 30000,

  // Globals
  globals: {
    __DEV__: true,
  },

  // Pose analysis specific configuration
  maxWorkers: 2, // Limit workers for memory-intensive pose analysis tests

  // Verbose output
  verbose: true
};