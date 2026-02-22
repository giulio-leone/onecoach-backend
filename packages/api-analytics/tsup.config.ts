import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: { tsconfig: '../tsconfig.build.json' },
  clean: true,
  treeshake: true,
  sourcemap: true,
  outDir: 'dist',
  external: [
    /^@giulio-leone\//,
    '@prisma/client',
    'zod',
    'server-only',
    'next',
    'react',
  ],
});
