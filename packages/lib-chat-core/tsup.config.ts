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
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@giulio-leone/lib-design-system',
    '@giulio-leone/lib-stores',
    '@giulio-leone/types',
    '@prisma/client',
    'react',
    'react-dom',
  ],
});
