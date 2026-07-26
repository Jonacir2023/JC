module.exports = {
  displayName: 'core-api',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'apps/core-api',
  testMatch: ['**/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@buildly/(.*)$': '<rootDir>/../../libs/$1/src',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2020',
        lib: ['ES2020'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  },
};
