import { cp, mkdir, rm, lstat, realpath, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
await import('./render-pages.mjs');

// A static artifact: no backend, package install or CI build required for hosting.
const root = await realpath('.');
const output = resolve(root, 'dist');
if (dirname(output) !== root) throw new Error('Unexpected output directory');
const existing = await lstat(output).catch(() => null);
if (existing?.isSymbolicLink()) throw new Error('Refusing to replace a linked output directory');
console.log(`Diretório verificado para a compilação: ${output}`);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const publicFiles = (await readdir('.')).filter((name) => /\.(html|css|js)$/.test(name));
for (const file of [...publicFiles, 'assets', 'robots.txt', 'sitemap.xml', '.nojekyll', 'CNAME']) await cp(file, resolve(output, file), { recursive: true });
console.log('Site estático pronto em dist/. Nenhum GitHub Action executado.');
