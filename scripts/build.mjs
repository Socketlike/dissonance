import process from 'process'
import { build, defineConfig } from 'tsup'

await build(
  defineConfig({
    entry: ['dist/index.mjs'],
    target: 'esnext',
    minify: process.argv.includes('--prod'),
    bundle: true,
    sourcemap: false,
    splitting: false,
    dts: true,
    platform: 'node',
    format: 'esm',
    outDir: 'dist',
  }),
)
