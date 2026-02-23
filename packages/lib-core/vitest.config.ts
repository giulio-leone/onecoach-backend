import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: [
      {
        find: '@giulio-leone/lib-shared',
        replacement: path.resolve(
          __dirname,
          '../../../onecoach-shared/packages/lib-shared/src'
        ),
      },
    ],
  },
});
