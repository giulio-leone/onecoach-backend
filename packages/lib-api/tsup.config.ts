import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    'react-query/index': 'src/react-query/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    habits: 'src/habits.ts',
    'error-handler/core': 'src/error-handler/core.ts',
    projects: 'src/projects.ts',
    'queries/exercise.queries': 'src/queries/exercise.queries.ts',
    'utils/generation-handler': 'src/utils/generation-handler.ts',
    'utils/streaming-handler': 'src/utils/streaming-handler.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: true,
});
