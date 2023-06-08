import process from 'process'
import { build, defineConfig } from 'tsup'

await build(
  defineConfig({
    entry: ['src/index.ts'],
    target: 'esnext',
    minify: process.argv.includes('--prod'),
    splitting: false,
    dts: true,
    platform: 'node',
    format: 'esm',
    outDir: 'dist',
  }),
)
