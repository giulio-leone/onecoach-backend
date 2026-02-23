import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    'react-query/index': 'src/react-query/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    habits: 'src/habits.ts',
    'error-handler': 'src/error-handler.ts',
    'error-handler.native': 'src/error-handler.native.ts',
    'error-handler/core': 'src/error-handler/core.ts',
    projects: 'src/projects.ts',
    'queries/exercise.queries': 'src/queries/exercise.queries.ts',
    'utils/generation-handler': 'src/utils/generation-handler.ts',
    'utils/streaming-handler': 'src/utils/streaming-handler.ts',
  },
  format: ['cjs', 'esm'],
  dts: { tsconfig: '../tsconfig.build.json' },
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: true,
  external: [
    /^@giulio-leone\//,
    '@tanstack/react-query',
    '@prisma/client',
    '@google/gemini-cli-core',
    'web-tree-sitter',
    'tree-sitter-bash',
    'react', 'react-native', 'react-native-health', 'expo-secure-store', '@react-native-async-storage/async-storage',
    'react-native',
    'next',
    'next-auth',
  ],
  esbuildOptions(options) {
    options.loader = { ...options.loader, '.wasm': 'binary' };
  },
});
