import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  sourcemap: true,
  outDir: 'dist',
  external: [
    '@giulio-leone/contracts',
    '@giulio-leone/lib-ai',
    '@giulio-leone/lib-core',
    '@giulio-leone/lib-exercise',
    '@giulio-leone/lib-food',
    '@giulio-leone/lib-marketplace',
    '@giulio-leone/lib-metadata',
    '@giulio-leone/lib-core/registry',
    '@giulio-leone/lib-vercel-admin',
    '@giulio-leone/schemas',
    '@giulio-leone/types',
    '@prisma/client',
    'next',
  ],
});
