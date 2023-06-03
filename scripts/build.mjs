import esbuild from 'esbuild'
import process from 'process'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const minify = process.argv.includes('--prod')

await esbuild.build({
  entryPoints: ['src/index.ts'],
  minify,
  sourcemap: false,
  bundle: true,
  platform: 'node',
  plugins: [nodeExternalsPlugin()],
  format: 'esm',
  target: 'esnext',
  outfile: 'dist/index.mjs',
})
