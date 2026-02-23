import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts', 'src/env.ts', 'src/env.server.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  clean: true,
  treeshake: true,
  sourcemap: true,
  outDir: 'dist',
  external: [/^@giulio-leone\//, '@prisma/client', 'zod', 'server-only'],
});
