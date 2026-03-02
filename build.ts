#!/usr/bin/env bun

const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'cjs',
  sourcemap: 'linked',
});

if (!result.success) {
  console.error('Build failed:');
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

for (const output of result.outputs) {
  console.log(`  ${output.path.replace(process.cwd() + '/', '')}  (${(output.size / 1024).toFixed(0)} KB)`);
}
