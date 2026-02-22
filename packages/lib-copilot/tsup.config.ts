import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    '@giulio-leone/lib-ai',
    '@giulio-leone/lib-chat-core',
    '@giulio-leone/lib-core',
    '@giulio-leone/lib-design-system',
    '@giulio-leone/lib-shared',
    '@giulio-leone/lib-stores',
    '@giulio-leone/schemas',
    '@giulio-leone/types',
    '@prisma/client',
    'framer-motion',
    'lucide-react',
    'react',
    'react-dom',
  ],
});
