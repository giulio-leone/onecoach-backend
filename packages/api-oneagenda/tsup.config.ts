import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: { tsconfig: '../tsconfig.build.json' },
  clean: true,
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
});
