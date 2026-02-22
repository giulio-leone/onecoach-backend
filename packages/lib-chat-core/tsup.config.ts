import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    'hooks/index': 'src/hooks/index.ts',
    'types/index': 'src/types/index.ts',
    'components/index': 'src/components/index.ts',
    'utils/index': 'src/utils/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: { tsconfig: '../tsconfig.build.json' },
  clean: true,
  sourcemap: true,
  external: [
    /^@giulio-leone\//,
    '@ai-sdk/react',
    'ai',
    '@prisma/client',
    '@supabase/supabase-js',
    '@google/gemini-cli-core',
    'web-tree-sitter',
    'tree-sitter-bash',
    'react',
    'react-dom',
    'framer-motion',
    'lucide-react',
    'react-markdown',
    'react-syntax-highlighter',
    'remark-gfm',
    'zustand',
    'clsx',
  ],
  esbuildOptions(options) {
    options.loader = { ...options.loader, '.wasm': 'binary' };
  },
});
