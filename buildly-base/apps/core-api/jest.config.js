module.exports = {
  displayName: 'core-api',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.spec.ts', '**/test/**/*.spec.ts', '**/test/**/*.e2e-spec.ts'],
  moduleNameMapper: {
    '^@buildly/(.*)$': '<rootDir>/../../libs/$1/src',
  },
  rootDir: '.',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
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
    }],
  },
};
