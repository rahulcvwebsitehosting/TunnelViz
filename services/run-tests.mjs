import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('.test-output',{recursive:true});
await build({entryPoints:['services/engineering.test.ts'],outfile:'.test-output/engineering.test.mjs',bundle:true,platform:'node',format:'esm'});
await import('../.test-output/engineering.test.mjs');
await build({entryPoints:['services/project.test.ts'],outfile:'.test-output/project.test.mjs',bundle:true,platform:'node',format:'esm'});
await import('../.test-output/project.test.mjs');
