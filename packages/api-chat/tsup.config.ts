import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'routes/index': 'src/routes/chat/route.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.json',
});
