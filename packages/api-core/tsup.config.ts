import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    '@giulio-leone/constants',
    '@giulio-leone/contracts',
    '@giulio-leone/lib-core',
    '@giulio-leone/lib-marketplace',
    '@giulio-leone/lib-registry',
    '@giulio-leone/one-workout',
    '@giulio-leone/schemas',
    '@giulio-leone/types',
    'next',
    'next-auth',
  ],
})
