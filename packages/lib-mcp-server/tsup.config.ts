import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    schemas: 'src/schemas/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: { tsconfig: '../tsconfig.build.json' },
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: false,
  external: [
    /^@giulio-leone\//,
    /^@modelcontextprotocol\//,
    '@prisma/client',
    'ai',
    'zod',
  ],
});
