module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  // Transform RN + expo packages (they ship as ESM/Flow which must be compiled)
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'react-native' +
      '|@react-native' +
      '|@react-native-async-storage' +
      '|@testing-library/react-native' +
      '|react-native-markdown-display' +
      '|react-native-chart-kit' +
      '|react-native-svg' +
      '|expo-router' +
      '|expo-constants' +
      '|expo-status-bar' +
      '))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-file-system$':
      '<rootDir>/src/__tests__/__mocks__/expo-file-system.js',
    '^expo-sharing$': '<rootDir>/src/__tests__/__mocks__/expo-sharing.js',
    '^expo-router$': '<rootDir>/src/__tests__/__mocks__/expo-router.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/src/__tests__/__mocks__/async-storage.js',
    // Block expo/* to prevent native winter runtime in Jest
    '^expo(.*)$': '<rootDir>/src/__tests__/__mocks__/expoWinterRuntime.js',
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/__mocks__/',
    '<rootDir>/src/__tests__/setup.ts',
  ],
};
