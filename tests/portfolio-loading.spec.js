const { test, expect } = require('@playwright/test');

for (const theme of ['light', 'dark']) {
  test(`${theme} theme only downloads its active portrait until the theme changes`, async ({ page }) => {
    const portraits = [];
    page.on('request', request => {
      if (/\/profile_(bw_effect|circle_color)\.(webp|png)$/.test(request.url())) portraits.push(new URL(request.url()).pathname);
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(value => {
      localStorage.setItem('theme', value);
      localStorage.setItem('cookie-consent', 'denied');
    }, theme);
    await page.goto('/');
    const active = theme === 'light' ? '/assets/images/profile/profile_bw_effect.webp' : '/assets/images/profile/profile_circle_color.webp';
    const other = theme === 'light' ? '/assets/images/profile/profile_circle_color.webp' : '/assets/images/profile/profile_bw_effect.webp';
    await expect(page.locator(`.hero-portrait img.theme-${theme}`)).toBeVisible();
    await expect.poll(() => page.locator(`.hero-portrait img.theme-${theme}`).evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(portraits).toEqual([active]);
    await page.locator('#theme-toggle').click();
    await expect.poll(() => portraits).toEqual([active, other]);
    const next = theme === 'light' ? 'dark' : 'light';
    await expect.poll(() => page.locator(`.hero-portrait img.theme-${next}`).evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  });
}

test('the portfolio loads complete styles and fonts within its CSS budget', async ({ page }) => {
  const failures = [];
  page.on('response', response => {
    if (response.status() >= 400) failures.push(response.url());
  });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  await page.goto('/');
  const resources = await page.evaluate(async () => {
    await document.fonts.ready;
    return performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.endsWith('.css'))
      .map(entry => ({ bytes: entry.decodedBodySize, end: entry.responseEnd }));
  });
  expect(resources.length).toBeGreaterThan(0);
  expect(resources.reduce((sum, resource) => sum + resource.bytes, 0)).toBeLessThan(130000);
  expect(resources.every(resource => resource.bytes > 0 && resource.end > 0)).toBe(true);
  expect(failures).toEqual([]);
  await expect(page.locator('body')).toHaveCSS('font-family', /Switzer/);
  await expect(page.locator('#hero h1')).toBeVisible();
});

for (const path of ['/privacy.html', '/impressum.html']) {
  test(`${path} stays readable with no JavaScript and a small independent stylesheet`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
    try {
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:4173${path}`);
      const sizes = await page.evaluate(async () => {
        await document.fonts.ready;
        return {
          css: performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.endsWith('.css')).reduce((sum, entry) => sum + entry.decodedBodySize, 0),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(sizes.css).toBeGreaterThan(0);
      expect(sizes.css).toBeLessThan(5000);
      expect(sizes.overflow).toBe(false);
      await expect(page.locator('h1')).toBeVisible();
    } finally {
      await context.close();
    }
  });
}
