const { test, expect } = require('@playwright/test');

for (const document of ['privacy.html', 'impressum.html']) {
  test(`${document} remains readable on a narrow screen and at enlarged text sizes`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${document}`);
    await page.evaluate(() => window.document.fonts.ready);

    for (const fontSize of ['100%', '200%']) {
      await page.evaluate(size => { window.document.documentElement.style.fontSize = size; }, fontSize);
      expect(await page.evaluate(() => window.document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      await expect(page.locator('h1')).toBeVisible();
    }

    const back = page.getByRole('link', { name: '← Back to portfolio' });
    await page.keyboard.press('Tab');
    await expect(back).toBeFocused();
    await expect(back).toHaveCSS('outline-style', 'solid');
    await expect(back).toHaveCSS('outline-width', '2px');
    expect((await back.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/index\.html$/);
  });

  test(`${document} uses the system theme when storage is unavailable`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() { throw new DOMException('Storage unavailable', 'SecurityError'); },
      });
    });
    await page.goto(`/${document}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#181C19');
    expect(errors).toEqual([]);
  });

  test(`${document} keeps the page and browser chrome in the saved theme`, async ({ page }) => {
    for (const [system, saved, expected, color] of [
      ['dark', 'light', 'light', '#F8F7F4'],
      ['light', 'dark', 'dark', '#181C19'],
      ['dark', 'invalid', 'dark', '#181C19'],
    ]) {
      await page.emulateMedia({ colorScheme: system });
      await page.goto(`/${document}`);
      await page.evaluate(value => localStorage.setItem('theme', value), saved);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', color);
      await expect(page.locator('meta[name="theme-color"]')).not.toHaveAttribute('media');
    }
  });
}
