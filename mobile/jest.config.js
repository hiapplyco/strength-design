module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@react-native-ml-kit|react-native-reanimated|react-native-gesture-handler)/)',
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/poseDetection/**/*.{js,jsx,ts,tsx}',
    'components/PoseAnalysis/**/*.{js,jsx,ts,tsx}',
    'screens/*PoseAnalysis*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
  // Pose analysis specific configuration
  testTimeout: 30000, // 30 seconds for video processing tests
  maxWorkers: 2, // Limit workers for memory-intensive pose analysis tests
};