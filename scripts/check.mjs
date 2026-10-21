import { readFile, access, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const files = await readdir('.');
const pages = files.filter((name) => name.endsWith('.html'));
const styles = files.filter((name) => name.endsWith('.css'));
const documents = new Map(await Promise.all(pages.map(async (name) => [name, await readFile(name, 'utf8')])));
const getIds = (html) => [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
let localReferences = 0;
for (const [name, html] of documents) {
  const ids = getIds(html);
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate IDs: ${name}`);
  if ([...html.matchAll(/<h1\b/g)].length !== 1) throw new Error(`Each page needs one h1: ${name}`);
  if (/[✳★☆✓✔↗→←↑↓]/u.test(html)) throw new Error(`Decorative text glyph: ${name}`);
  if (html.includes('chatgpt.site') || html.includes('custommind.ia')) throw new Error(`Outdated hosting metadata: ${name}`);
  for (const match of html.matchAll(/(?:src|href)="([^" ]+)"/g)) {
    const value = match[1];
    if (!value.startsWith('.') && !value.startsWith('#')) continue;
    const url = new URL(value, `https://local.test/${name}`);
    const path = decodeURIComponent(url.pathname.slice(1));
    await access(resolve(path));
    if (url.hash && path.endsWith('.html')) {
      const target = documents.get(path) || await readFile(path, 'utf8');
      if (!getIds(target).includes(url.hash.slice(1))) throw new Error(`Missing anchor ${value}: ${name}`);
    }
    localReferences++;
  }
}
for (const name of styles) {
  const css = await readFile(name, 'utf8');
  for (const match of css.matchAll(/url\(['"]?\.\/([^)'" ]+)['"]?\)/g)) await access(resolve(match[1]));
}
const js = await readFile('app.js', 'utf8');
for (const match of js.matchAll(/image: '([^']+)'/g)) await access(resolve('assets', match[1]));
try { await access('.openai/hosting.json'); throw new Error('Remove obsolete Sites config for this GitHub Pages project'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log(`OK: ${pages.length} páginas, ${styles.length} folhas de estilo, ${localReferences} referências locais e âncoras válidas.`);
