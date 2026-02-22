import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'analytics.service': 'src/analytics.service.ts',
    'body-measurements.service': 'src/body-measurements.service.ts',
    'coach-analytics.service': 'src/coach-analytics.service.ts',
    'progress-snapshot.service': 'src/progress-snapshot.service.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
