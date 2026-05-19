import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

esbuild.build({
  entryPoints: [path.resolve(__dirname, 'server/index.js')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  outfile: path.resolve(__dirname, 'dist-portable/app/server.bundle.js'),
  external: ['better-sqlite3'],
  minify: false,
  loader: {
    '.wasm': 'copy',
    '.node': 'copy',
  },
  define: {},
  banner: {
    js: [
      'import { createRequire } from "module";',
      'import { fileURLToPath as __fileURLToPath } from "url";',
      'import { dirname as __pathDirname } from "path";',
      'const require = createRequire(import.meta.url);',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __pathDirname(__filename);',
    ].join(' '),
  },
}).then(() => {
  console.log('Server bundle built successfully!');
  console.log('Output: dist-portable/app/server.bundle.js');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
