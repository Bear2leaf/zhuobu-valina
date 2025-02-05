import * as esbuild from 'esbuild';

/**
 * @type {esbuild.BuildOptions}
 */
const config = {
  entryPoints: ['src/main.ts', "src/worker/main.ts"],
  bundle: true,
  outdir: 'dist',
  target: 'es2015',
  logLevel: 'info',
  sourcemap: true,
}


const ctx = await esbuild.context(config)
ctx.serve({
  servedir: '.'
})
await ctx.watch();