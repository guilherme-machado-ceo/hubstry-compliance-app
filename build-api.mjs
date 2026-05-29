import { build } from 'esbuild';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const entryPoints = await glob('api/**/*.ts', { cwd: root });

console.log('[build-api] Bundling', entryPoints.length, 'functions...');

await build({
  entryPoints: entryPoints.map(e => path.join(root, e)),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: path.join(root, 'api'),
  outbase: path.join(root, 'api'),
  external: [
    '@libsql/client',
    '@libsql/*',
    'mysql2',
    'jsdom',
    'canvas',
  ],
  alias: {
    '@shared': path.join(root, 'shared'),
  },
  logLevel: 'info',
});

console.log('[build-api] Done!');
