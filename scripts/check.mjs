import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const html = await readFile('index.html', 'utf8');
const css = await readFile('styles.css', 'utf8');
const js = await readFile('app.js', 'utf8');
const paths = [...html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g), ...css.matchAll(/url\('\.\/([^']+)'\)/g)].map((match) => match[1]);
for (const path of new Set(paths)) await access(resolve(path));
for (const image of [...js.matchAll(/image: '([^']+)'/g)]) await access(resolve('assets', image[1]));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const match of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(match[1])) throw new Error(`Missing anchor ${match[1]}`);
if (html.includes('custommind.ia')) throw new Error('Wrong Custom Mind URL');
console.log(`OK: ${new Set(paths).size} arquivos locais, ${ids.length} IDs únicos, âncoras e fotos de experiências.`);
