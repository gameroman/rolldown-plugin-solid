import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  platform: 'node',
  format: 'esm',
  clean: true,
  dts: true,
  target: 'node18',
  minify: false,
});
