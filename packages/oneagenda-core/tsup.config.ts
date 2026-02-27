import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: [
    '@giulio-leone/lib-core',
    '@giulio-leone/lib-shared',
    '@giulio-leone/one-agenda',
    '@prisma/client',
  ],
});
