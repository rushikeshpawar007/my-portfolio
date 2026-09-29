const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

test('career links keep their descriptions visible and move keyboard reading to the chosen role', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const trail = page.getByRole('navigation', { name: 'Explore my experience' });
  const roles = [
    ['KPMG Audit analytics', '#kpmg-role'],
    ['CARIAD (VW) Sales reporting', '#cariad-role'],
    ['Lecturio Finance automation', '#lecturio-role'],
  ];
  for (const [name, target] of roles) {
    const link = trail.getByRole('link', { name, exact: true });
    await expect(link.locator('small')).toBeVisible();
    await expect(link).toHaveAttribute('href', target);
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target)).toBeFocused();
    await expect(page.locator(target)).toBeInViewport();
    expect(await page.locator(target).evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(60);
  }
});

test('career marker animation is brief and never moves or recolours the employer artwork', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const link = page.locator('.career-stop').first();
  await page.evaluate(() => document.fonts.ready);
  await link.evaluate(async element => {
    // The trail has a delayed hero entrance. Its parent can still move after
    // the link itself appears stable, taking the pointer outside the target.
    const entrance = element.closest('.hero-stagger');
    await Promise.all((entrance?.getAnimations() || []).map(animation => animation.finished.catch(() => {})));
  });
  await link.scrollIntoViewIfNeeded();
  const logo = link.locator('img');
  const readLogo = img => {
    const css = getComputedStyle(img);
    return { filter: css.filter, transform: css.transform, width: css.width, height: css.height };
  };
  const original = await logo.evaluate(readLogo);
  const initialHeight = (await page.locator('.career-trail').boundingBox()).height;
  await link.hover();
  await expect.poll(() => link.evaluate(el => getComputedStyle(el, '::after').opacity)).toBe('1');
  expect(await logo.evaluate(readLogo)).toEqual(original);
  expect(original.width).toBe('32px');
  expect(original.height).toBe('32px');
  expect((await page.locator('.career-trail').boundingBox()).height).toBe(initialHeight);
  const properties = await link.evaluate(el => {
    const css = getComputedStyle(el, '::after');
    return { transition: css.transitionProperty, durations: css.transitionDuration.split(',').map(Number.parseFloat) };
  });
  expect(properties.transition.split(',').map(value => value.trim()).sort()).toEqual(['opacity', 'transform']);
  expect(Math.max(...properties.durations)).toBeLessThanOrEqual(.3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // The shared accessibility reset uses 0.01ms to finish transition events.
  await expect.poll(() => link.evaluate(el => Math.max(...getComputedStyle(el, '::after').transitionDuration.split(',').map(Number.parseFloat)))).toBeLessThanOrEqual(.001);
});

for (const lang of ['en', 'de']) {
  test(`career trail reflows at 320px with enlarged ${lang} text and keeps complete labels`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(lang => localStorage.setItem('lang', lang), lang);
    await page.goto('/');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    const links = page.locator('.career-stop');
    await expect(links).toHaveCount(3);
    await expect(links.last().locator('small')).toHaveText(lang === 'de' ? 'Finanzautomatisierung' : 'Finance automation');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const link of await links.all()) {
      const bounds = await link.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const label = el.querySelector('small').getBoundingClientRect();
        return { left: rect.left, right: rect.right, height: rect.height, labelLeft: label.left, labelRight: label.right };
      });
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(320);
      expect(bounds.labelLeft).toBeGreaterThanOrEqual(bounds.left);
      expect(bounds.labelRight).toBeLessThanOrEqual(bounds.right);
    }
  });
}

test('career links and labels remain useful without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  const link = page.getByRole('navigation', { name: 'Explore my experience' }).getByRole('link', { name: 'CARIAD (VW) Sales reporting', exact: true });
  await expect(link.locator('small')).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/#cariad-role$/);
  await expect(page.locator('#cariad-role')).toBeInViewport();
  await context.close();
});

test('keyboard focus remains above the fixed mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.career-stop').nth(1).focus();
  await page.keyboard.press('Tab');
  const lecturio = page.locator('.career-stop').last();
  await expect(lecturio).toBeFocused();
  const stop = await lecturio.boundingBox();
  const navigation = await page.locator('#bottom-nav').boundingBox();
  expect(stop.y + stop.height).toBeLessThanOrEqual(navigation.y - 4);
});
