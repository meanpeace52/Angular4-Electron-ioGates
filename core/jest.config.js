module.exports = {
  testEnvironment: 'node',
  transform: {
    '.(ts|tsx)': '<rootDir>/preprocessor.js'
  },
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
  ],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts)x?$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'types/**/*.{ts,tsx,js,jsx}',
    'interfaces/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
  ],
};
