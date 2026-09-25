const { test, expect } = require('@playwright/test');

for (const theme of ['light', 'dark']) {
  test(`logos stay legible and stable on scroll and hover in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(theme => {
      localStorage.setItem('theme', theme);
      localStorage.setItem('cookie-consent', 'denied');
    }, theme);
    await page.goto('/');
    for (const selector of ['.company-logos img', '.experience-emblem img', '.edu-row img']) {
      const logos = page.locator(selector);
      for (const logo of await logos.all()) {
        await logo.scrollIntoViewIfNeeded();
        await expect.poll(() => logo.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(logo).toHaveAttribute('alt', '');
        await expect(logo).toHaveAttribute('aria-hidden', 'true');
        await expect(logo).toHaveCSS('object-fit', 'contain');
        const before = await logo.evaluate(img => ({ filter: getComputedStyle(img).filter, opacity: getComputedStyle(img).opacity, transform: getComputedStyle(img).transform }));
        expect(before.filter).toContain('grayscale(1)');
        if (theme === 'dark') expect(before.filter).toContain('invert(1)');
        expect(before.opacity).toBe('1');
        await logo.hover();
        await page.waitForTimeout(350);
        await expect(logo).toHaveCSS('filter', before.filter);
        await expect(logo).toHaveCSS('transform', before.transform);
      }
    }
    await expect(page.locator('.company-logos img')).toHaveCount(3);
    await expect(page.locator('.edu-row img')).toHaveCount(2);
    await expect(page.locator('.employer-monogram')).toHaveText('S.M.');
    await expect(page.locator('.employer-monogram')).toHaveCSS('filter', 'none');
  });
}

test('employer marks occupy one stable slot on phones in either theme', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  await page.goto('/#experience');
  const initial = await page.locator('.experience-header').evaluateAll(headers => headers.map(header => {
    const mark = header.querySelector('.timeline-logo').getBoundingClientRect();
    const role = header.querySelector('h3').getBoundingClientRect();
    return { width: mark.width, height: mark.height, gap: role.left - mark.right };
  }));
  await page.locator('#theme-toggle').click();
  const after = await page.locator('.experience-header').evaluateAll(headers => headers.map(header => {
    const mark = header.querySelector('.timeline-logo').getBoundingClientRect();
    const role = header.querySelector('h3').getBoundingClientRect();
    return { width: mark.width, height: mark.height, gap: role.left - mark.right };
  }));
  expect(after).toEqual(initial);
  for (const mark of after) {
    expect(mark.width).toBe(40);
    expect(mark.height).toBe(40);
    expect(mark.gap).toBeGreaterThanOrEqual(12);
  }
});
