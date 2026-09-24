const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function expectContentWithinViewport(page) {
  // Inspect content itself: overflow-x: clip can hide a broken layout from a
  // document.scrollWidth check while cutting off headings and controls.
  const outside = await page.locator('header nav, header nav a, header nav button, main h1, main h2, main h3, .section-title > span, .impact-card, .featured-project, .project-preview, .visual-step, .skill-chip, .edu-row > *, #contact-form, .contact-email-link, .quick-fact, .contact-available-badge').evaluateAll(elements => elements.flatMap(el => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return [];
    const clipped = el.scrollWidth > el.clientWidth + 1;
    return rect.left < -1 || rect.right > innerWidth + 1 || clipped
      ? [{ element: el.id || el.className, text: el.textContent.trim().slice(0, 60) }] : [];
  }));
  expect(outside).toEqual([]);
  const clippedComparison = await page.locator('.comparison-values, .comparison-number').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
  expect(clippedComparison).toEqual([]);
}

test('long German headings and project diagrams fit a 320px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('cookie-consent', 'denied');
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expectContentWithinViewport(page);
});

for (const width of [375, 820]) {
  for (const language of ['en', 'de']) {
    test(`content reflows with doubled text at ${width}px in ${language}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.addInitScript(lang => {
        localStorage.setItem('lang', lang);
        localStorage.setItem('cookie-consent', 'denied');
      }, language);
      await page.goto('/');
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '32px';
        await document.fonts.ready;
        document.querySelectorAll('details').forEach(el => { el.open = true; });
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.evaluate(() => document.fonts.ready);
      await expectContentWithinViewport(page);
      for (const control of ['#name', '#email', '#message', '#contact-form button[type="submit"]']) {
        await page.locator(control).focus();
        await expect(page.locator(control)).toBeFocused();
      }
    });
  }
}

test('cookie choices remain reachable on a short screen with doubled text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('/');
  await page.evaluate(async () => {
    document.documentElement.style.fontSize = '32px';
    await document.fonts.ready;
  });
  const banner = page.locator('#cookie-consent-banner');
  const bounds = await banner.boundingBox();
  const bottomNav = await page.locator('#bottom-nav').boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(bottomNav.y);
  expect(await banner.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  for (const id of ['cookie-decline', 'cookie-accept']) {
    const button = page.locator('#' + id);
    await button.focus();
    await expect(button).toBeFocused();
    const rect = await button.boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(bounds.x);
    expect(rect.x + rect.width).toBeLessThanOrEqual(bounds.x + bounds.width);
    expect(rect.y).toBeGreaterThanOrEqual(bounds.y);
    expect(rect.y + rect.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  }
  await page.locator('#cookie-decline').click();
  await expect(banner).toBeHidden();
});

for (const [width, fontSize] of [[641, 16], [820, 32]]) {
  test(`stacked impact rows keep horizontal separators at ${width}px with ${fontSize}px text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
    await page.goto('/');
    await page.evaluate(size => { document.documentElement.style.fontSize = size + 'px'; }, fontSize);
    await page.evaluate(() => document.fonts.ready);
    const cards = await page.locator('.impact-card').all();
    for (let i = 1; i < cards.length; i++) {
      const previous = await cards[i - 1].boundingBox();
      const current = await cards[i].boundingBox();
      expect(current.y).toBeGreaterThanOrEqual(previous.y + previous.height - 1);
      expect(current.x).toBe(previous.x);
      await expect(cards[i]).toHaveCSS('border-left-width', '0px');
      await expect(cards[i]).toHaveCSS('border-top-width', '1px');
    }
  });
}
