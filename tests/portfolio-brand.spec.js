const { test, expect } = require('@playwright/test');

for (const pathname of ['/', '/privacy.html', '/impressum.html']) {
  test(`browser icon declarations are consistent on ${pathname}`, async ({ page }) => {
    await page.goto(pathname);
    const icons = await page.locator('link[rel="icon"]').evaluateAll(links => links.map(link => ({
      href: link.getAttribute('href'),
      type: link.getAttribute('type'),
      sizes: link.getAttribute('sizes'),
    })));
    expect(icons).toEqual([
      { href: 'favicon-32.png', type: 'image/png', sizes: '32x32' },
      { href: 'favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    ]);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('sizes', '180x180');
  });
}

for (const scheme of ['light', 'dark']) {
  test(`vector favicon has a legible palette without fonts in ${scheme} mode`, async ({ page, request }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.route('**/*.woff2', route => route.abort());
    await page.goto('/');
    const vector = await (await request.get('/favicon.svg')).text();
    expect(vector).not.toMatch(/<text\b|@font-face|https?:\/\/(?!www\.w3\.org)/);
    const result = await page.evaluate(async () => {
      const image = new Image();
      image.src = '/favicon.svg';
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, 32, 32);
      const data = context.getImageData(0, 0, 32, 32).data;
      return {
        corner: [...data.slice(0, 4)],
        colors: [...new Set(Array.from({ length: data.length / 4 }, (_, index) => [...data.slice(index * 4, index * 4 + 4)].join(',')))],
      };
    });
    expect(result.corner).toEqual(scheme === 'light' ? [36, 40, 36, 255] : [243, 242, 234, 255]);
    expect(result.colors).toContain(scheme === 'light' ? '248,247,244,255' : '24,28,25,255');
  });
}

test('header and browser icons use the same outlined RP monogram', async ({ page, request }) => {
  await page.goto('/');
  const favicon = await (await request.get('/favicon.svg')).text();
  const monogram = favicon.match(/<path class="monogram" d="([^"]+)"/)[1];
  const mark = page.locator('.brand-mark svg');
  await expect(mark).toHaveAttribute('viewBox', '0 0 32 32');
  await expect(mark).toHaveAttribute('aria-hidden', 'true');
  await expect(mark.locator('path')).toHaveAttribute('d', monogram);
  await expect(page.locator('header nav > a')).toHaveAccessibleName('Rushikesh Pawar');
});

test('PNG exports have correct dimensions and current palette', async ({ page }) => {
  await page.goto('/');
  const assets = await page.evaluate(async () => {
    const values = [];
    for (const file of ['favicon-32.png', 'apple-touch-icon.png', 'social_preview.png']) {
      const image = new Image();
      image.src = '/' + file;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      values.push({ file, width: image.naturalWidth, height: image.naturalHeight, corner: [...context.getImageData(0, 0, 1, 1).data] });
    }
    return values;
  });
  expect(assets).toEqual([
    { file: 'favicon-32.png', width: 32, height: 32, corner: [36, 40, 36, 255] },
    { file: 'apple-touch-icon.png', width: 180, height: 180, corner: [36, 40, 36, 255] },
    { file: 'social_preview.png', width: 1200, height: 630, corner: [248, 247, 244, 255] },
  ]);
});

test('share card source fits its export and uses the local typefaces', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/assets/social-preview.html');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { name: 'Rushikesh Pawar' })).toBeVisible();
  await expect(page.getByText('Senior Business Analyst')).toBeVisible();
  const layout = await page.evaluate(() => ({
    fits: [...document.querySelectorAll('body *')].every(element => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.top >= 0 && rect.right <= 1200 && rect.bottom <= 630;
    }),
    zodiak: document.fonts.check('700 84px Zodiak'),
    switzer: document.fonts.check('400 25px Switzer'),
    horizontalOverflow: document.documentElement.scrollWidth > 1200,
    verticalOverflow: document.documentElement.scrollHeight > 630,
  }));
  expect(layout).toEqual({ fits: true, zodiak: true, switzer: true, horizontalOverflow: false, verticalOverflow: false });
});
