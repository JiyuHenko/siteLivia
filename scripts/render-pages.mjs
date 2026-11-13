import { readFile, writeFile, readdir } from 'node:fs/promises';
import { siteConfig } from '../config.js';

// Generated root documents are committed, so GitHub Pages needs no build workflow.
const base = siteConfig.url.replace(/\/?$/, '/');
let index = await readFile('index.html', 'utf8');
index = index
  .replace(/(<meta property="og:image" content=")[^"]*(">)/, (_, start, end) => start + base + 'assets/share.jpg' + end)
  .replace(/(<meta property="og:url" content=")[^"]*(">)/, (_, start, end) => start + base + end)
  .replace(/(<link rel="canonical" href=")[^"]*(">)/, (_, start, end) => start + base + end);
await writeFile('index.html', index);
const sharedHead = index.match(/<head>([\s\S]*?)<\/head>/)[1];
const sharedHeader = index.slice(index.indexOf('<body>') + 6, index.indexOf('  <main id="conteudo">'));
const sharedFooter = index.slice(index.indexOf('  <footer class="footer">'), index.lastIndexOf('</body>'));
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const homeAnchors = (value) => value.replace(/href="#(livia|estudio|experiencias|curso|portfolio|contato)"/g, 'href="./index.html#$1"');
const services = { 'noivas.html': 'noivas', 'debutantes.html': 'debutantes', 'maquiagem-social.html': 'social', 'automaquiagem.html': 'curso' };
const pageFiles = (await readdir('pages')).filter((name) => name.endsWith('.html')).sort();

for (const file of pageFiles) {
  const source = await readFile(`pages/${file}`, 'utf8');
  const metadata = source.match(/^<!-- page: (\{[^\n]*\}) -->\s*/);
  if (!metadata) throw new Error(`Missing page metadata: ${file}`);
  const page = JSON.parse(metadata[1]);
  const body = source.slice(metadata[0].length);
  if (/<(?:html|body|main|head)\b/i.test(body)) throw new Error(`Page fragment contains a document shell: ${file}`);
  let head = sharedHead
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, (_, start, end) => start + escape(page.description) + end)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, (_, start, end) => start + escape(page.title) + end)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, (_, start, end) => start + escape(page.description) + end)
    .replace(/(<meta property="og:url" content=")[^"]*(">)/, (_, start, end) => start + base + file + end)
    .replace(/(<link rel="canonical" href=")[^"]*(">)/, (_, start, end) => start + base + file + end)
    .replace(/<link rel="preload" href="\.\/assets\/hero\.webp" as="image" fetchpriority="high">/, `<link rel="preload" href="./${escape(page.heroImage)}" as="image" fetchpriority="high">`);
  head += (page.styles || []).map((path) => `  <link rel="stylesheet" href="./${escape(path)}">`).join('\n') + '\n';
  const output = `<!doctype html>\n<html lang="pt-BR">\n<head>${head}</head>\n<body class="${escape(page.bodyClass || '')}"${services[file] ? ` data-service="${services[file]}"` : ''}>${homeAnchors(sharedHeader)}  <main id="conteudo">\n${body.trim()}\n  </main>\n${homeAnchors(sharedFooter)}</body>\n</html>\n`;
  await writeFile(file, output);
}
const urls = ['', ...pageFiles, 'contatos/'].map((file) => `  <url><loc>${base}${file}</loc></url>`).join('\n');
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`${pageFiles.length} páginas estáticas atualizadas para GitHub Pages.`);
