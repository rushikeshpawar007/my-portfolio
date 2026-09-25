// Rebuild the PNG fallbacks and sharing image from their code-native sources.
// Usage: node scripts/export-brand-assets.cjs
// Requires the project's Playwright Chromium installation; no image editor or font service.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const brandRoot = path.join(root, 'assets', 'brand');
const types = { '.html': 'text/html', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, content) => {
    if (error) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(content);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' });
    await page.goto(origin + '/assets/brand/social-preview.html');
    const svg = fs.readFileSync(path.join(brandRoot, 'favicon.svg'), 'utf8');
    for (const [size, filename] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${svg}`);
      await page.screenshot({ path: path.join(brandRoot, filename) });
      console.log(`Exported ${filename} (${size} × ${size})`);
    }
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.goto(origin + '/assets/brand/social-preview.html');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.brand').evaluate(image => image.decode());
    await page.screenshot({ path: path.join(brandRoot, 'social_preview.png') });
    console.log('Exported social_preview.png (1200 × 630)');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
