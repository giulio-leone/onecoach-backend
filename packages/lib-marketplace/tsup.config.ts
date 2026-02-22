import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: { tsconfig: '../tsconfig.build.json' },
  outDir: 'dist',
  sourcemap: true,
  external: [
    '@giulio-leone/types',
    '@prisma/client',
  ],
  shims: true,
});
