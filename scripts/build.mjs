import { cp, mkdir, rm, lstat, realpath } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

// A static artifact: no backend, package install or CI build required for hosting.
const root = await realpath('.');
const output = resolve(root, 'dist');
if (dirname(output) !== root) throw new Error('Unexpected output directory');
const existing = await lstat(output).catch(() => null);
if (existing?.isSymbolicLink()) throw new Error('Refusing to replace a linked output directory');
console.log(`Diretório verificado para a compilação: ${output}`);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'config.js', 'assets', 'robots.txt']) await cp(file, resolve(output, file), { recursive: true });
console.log('Site estático pronto em dist/. Nenhum GitHub Action executado.');
