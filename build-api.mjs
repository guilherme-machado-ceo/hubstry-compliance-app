import { build } from 'esbuild';
import { readdirSync } from 'fs';
import { join, posix } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('.', import.meta.url));

function findTsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

const files = findTsFiles(join(root, 'api'));
console.log('Bundling ' + files.length + ' API functions...');

for (const file of files) {
  const out = file.replace(/\.ts$/, '.mjs');
  await build({
    entryPoints: [file],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    packages: 'external',
    sourcemap: false,
    logLevel: 'error',
  });
}

console.log('Done!');
