import esbuild from 'esbuild'
import process from 'process'

const minify = process.argv.includes('--prod')

await esbuild.build({
  entryPoints: ['src/index.ts'],
  minify,
  sourcemap: false,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'esnext',
  outfile: 'dist/index.mjs',
})
