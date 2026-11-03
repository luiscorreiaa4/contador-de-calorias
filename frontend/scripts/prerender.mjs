// Pré-renderiza as páginas públicas em HTML estático (roda depois do `vite build`).
// dist/spa.html = casca sem conteúdo, usada como fallback de SPA para /app/* e demais rotas.
import { build } from 'vite';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const ssrOut = join(root, 'dist-ssr');

await build({
  root,
  logLevel: 'warn',
  build: { ssr: 'src/entry-prerender.tsx', outDir: ssrOut, emptyOutDir: true },
});

const { render, PUBLIC_PAGES, SITE_URL, OG_IMAGE, jsonLdFor } = await import(
  pathToFileURL(join(ssrOut, 'entry-prerender.js')).href
);

const template = readFileSync(join(dist, 'index.html'), 'utf8');
writeFileSync(join(dist, 'spa.html'), template);

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// "<" escapado impede que um texto feche a tag <script> do JSON-LD.
const ldJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

function head({ path, title, description }) {
  const url = `${SITE_URL}${path === '/' ? '/' : path}`;
  const t = esc(title);
  const d = esc(description);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="CalorieSync" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="CalorieSync, contador de calorias" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...jsonLdFor(path).map((ld) => `<script type="application/ld+json">${ldJson(ld)}</script>`),
  ].join('\n    ');
}

const SEO_BLOCK = /<!--seo[\s\S]*?<!--\/seo-->/;
if (!SEO_BLOCK.test(template)) throw new Error('index.html sem o bloco <!--seo-->...<!--/seo-->');

for (const page of PUBLIC_PAGES) {
  const body = await render(page.path);
  const h1s = body.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) throw new Error(`${page.path} tem ${h1s} <h1>; esperado exatamente 1`);
  // Script inline (streaming do React) seria bloqueado pela CSP e deixaria o conteúdo escondido.
  if (/<script|<template/.test(body)) throw new Error(`${page.path} saiu com <script>/<template> inline`);

  const html = template
    .replace(SEO_BLOCK, () => head(page))
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
  const dir = join(dist, page.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`✓ prerender ${page.path}`);
}

rmSync(ssrOut, { recursive: true, force: true });
