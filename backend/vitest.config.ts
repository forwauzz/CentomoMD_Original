import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable globals for describe, it, expect, etc.
    globals: true,
    
    // Setup files to run before tests
    setupFiles: ['tests/setup.ts'],
    
    // Test environment
    environment: 'node',
    
    // File patterns to include in tests
    include: ['src/tests/**/*.test.ts', 'src/**/*.test.ts', 'tests/**/*.test.ts'],
    
    // File patterns to exclude from tests
    exclude: ['node_modules', 'dist', 'build'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/test/**'
      ]
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000
  }
});
