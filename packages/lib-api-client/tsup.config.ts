import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'react-query/index': 'src/react-query/index.ts',
    'react-query/provider': 'src/react-query/provider.tsx',
    'react-query/config': 'src/react-query/config.ts',
    'queries/index': 'src/queries/index.ts',
    memory: 'src/memory.ts',
    native: 'src/native.ts',
  },
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
