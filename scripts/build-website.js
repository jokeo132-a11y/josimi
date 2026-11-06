'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'website');
const outputDir = path.join(root, 'dist', 'site');
const assetsDir = path.join(outputDir, 'assets');

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
}

function readSource(name) {
  const filePath = path.join(sourceDir, name);
  if (!fs.existsSync(filePath)) throw new Error(`Missing website source: ${name}`);
  return fs.readFileSync(filePath);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(assetsDir, { recursive: true });

const htmlTemplate = readSource('index.html').toString('utf8');
const css = readSource('styles.css');
const js = readSource('site.js');
const logo = readSource(path.join('assets', 'josimi-logo.png'));
const cssName = `site-${digest(css)}.css`;
const jsName = `site-${digest(js)}.js`;
let html = htmlTemplate
  .replace('/assets/site.css', `/assets/${cssName}`)
  .replace('/assets/site.js', `/assets/${jsName}`);
if (html === htmlTemplate || html.includes('/assets/site.css') || html.includes('/assets/site.js')) {
  throw new Error('The website stylesheet or script reference was not versioned.');
}

fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.writeFileSync(path.join(assetsDir, cssName), css);
fs.writeFileSync(path.join(assetsDir, jsName), js);
fs.writeFileSync(path.join(assetsDir, 'josimi-logo.png'), logo);
fs.writeFileSync(path.join(outputDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://josimi.com/sitemap.xml\n');
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://josimi.com/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url></urlset>\n`);
fs.writeFileSync(path.join(outputDir, '_headers'), [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: SAMEORIGIN',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '/index.html',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '/assets/site-*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '/assets/josimi-logo.png',
  '  Cache-Control: public, max-age=604800',
  ''
].join('\n'));

const files = fs.readdirSync(outputDir, { recursive: true }).filter((item) => fs.statSync(path.join(outputDir, item)).isFile());
if (!files.includes('index.html') || !files.some((name) => name.startsWith('assets/site-') && name.endsWith('.css')) || !files.some((name) => name.startsWith('assets/site-') && name.endsWith('.js'))) {
  throw new Error('Website build is missing an expected deployable file.');
}
console.log(`Website built: ${outputDir}`);
console.log(`Hashed assets: ${cssName}, ${jsName}`);
console.log(`Deployable files: ${files.length}`);
