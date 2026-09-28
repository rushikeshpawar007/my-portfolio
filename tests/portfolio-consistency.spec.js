const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

test('a direct role link reveals its content on page load', async ({ page }) => {
  await page.goto('/#lecturio-role-details');
  const details = page.locator('#lecturio-role-details');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('.role-body')).toBeVisible();
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  await expect(page.locator('#cariad-role-details')).not.toHaveAttribute('open');
});

test('changing the hash reveals a role and leaves its native control usable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { window.location.hash = 'kpmg-role-details'; });
  const details = page.locator('#kpmg-role-details');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('.role-body')).toBeVisible();
  const summary = details.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
});

test('tablet navigation visibly marks the current section without shifting links', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  const toggle = page.locator('#mobile-menu-button');
  await toggle.click();
  const current = page.locator('#mobile-menu a[href="#skills"]');
  await current.click();
  await expect(current).toHaveAttribute('aria-current', 'location');
  const mainTop = await page.locator('#main').evaluate(el => el.getBoundingClientRect().top);
  // Click the visible sticky control directly; locator.click() may scroll its
  // original document position into view before activating it.
  const toggleBounds = await toggle.boundingBox();
  await page.mouse.click(toggleBounds.x + toggleBounds.width / 2, toggleBounds.y + toggleBounds.height / 2);
  await expect(current).toBeVisible();
  await expect(current).toHaveAttribute('aria-current', 'location');
  await expect.poll(() => page.locator('#main').evaluate(el => el.getBoundingClientRect().top)).toBe(mainTop);
  const accent = await page.locator('.section-eyebrow').first().evaluate(el => getComputedStyle(el).color);
  await expect(current).toHaveCSS('border-inline-start-color', accent);
  await expect(current).toHaveCSS('border-inline-start-width', '2px');
  const inactive = page.locator('#mobile-menu a:not([aria-current])').first();
  await expect(inactive).toHaveCSS('border-inline-start-color', 'rgba(0, 0, 0, 0)');
  await expect(inactive).toHaveCSS('border-inline-start-width', '2px');
});

test('the demo launcher carries the chatbot case study number', async ({ page }) => {
  await page.goto('/');
  const number = (selector) => page.locator(selector).evaluate(el => getComputedStyle(el, '::before').content);
  expect(await number('#dynamic-island-container .collapsed-content')).toBe(await number('#rag-case-study .project-meta'));
});

test('the demo close control keeps a 44px target on tablet', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await page.locator('#dynamic-island-container').click();
  const close = page.locator('#close-island-btn');
  await expect(close).toBeVisible();
  const bounds = await close.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
});

for (const theme of ['light', 'dark']) {
  test(`static skill labels keep their appearance on hover in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    await page.goto('/#lecturio-role-details');
    for (const selector of ['#lecturio-role-details .skill-tag-sm', '.skill-chip']) {
      const label = page.locator(selector).first();
      await label.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const appearance = await label.evaluate(el => {
        const style = getComputedStyle(el);
        return { background: style.backgroundColor, color: style.color };
      });
      await label.hover();
      await expect(label).toHaveCSS('background-color', appearance.background);
      await expect(label).toHaveCSS('color', appearance.color);
    }
  });
}

test('language changes include dates, source values, image descriptions and accessible labels', async ({ page }) => {
  await page.goto('/');
  const translations = await page.locator('#translations-data').evaluate(el => JSON.parse(el.textContent));
  const textKeys = ['cariad_dates', 'kpmg_dates', 'smauto_dates', 'htw_dates', 'jspm_dates',
    'demo_revenue_value', 'demo_budget_value', 'demo_expenses_value'];
  const labelKeys = ['label_impact', 'label_back_to_top', 'label_mobile_navigation', 'label_demo_conversation'];
  const imageKeys = ['alt_profile', 'alt_spotify_preview', 'alt_spotify_dashboard'];

  for (const language of ['de', 'en']) {
    // The toggle ignores clicks within 150 ms of the previous one; retry until the
    // language changes, and never click again once it has.
    await expect(async () => {
      if (await page.locator('html').getAttribute('lang') !== language) await page.locator('#lang-toggle-header').click();
      await expect(page.locator('html')).toHaveAttribute('lang', language, { timeout: 500 });
    }).toPass();
    for (const key of textKeys) {
      await expect(page.locator(`[data-i18n-key="${key}"]`)).toHaveText(translations[language][key]);
    }
    for (const key of labelKeys) {
      await expect(page.locator(`[data-i18n-aria="${key}"]`)).toHaveAttribute('aria-label', translations[language][key]);
    }
    for (const key of imageKeys) {
      const images = page.locator(`[data-i18n-alt="${key}"]`);
      await expect(images).toHaveCount(key === 'alt_profile' ? 2 : 1);
      for (const image of await images.all()) {
        await expect(image).toHaveAttribute('alt', translations[language][key]);
      }
    }
    if (language === 'de') {
      await expect(page.locator('#message')).toHaveAttribute('placeholder', 'Deine Nachricht');
      await expect(page.locator('[data-i18n-key="demo_revenue_value"]')).toHaveText('1.200.000 €');
      await expect(page.locator('#bot-messages-apple')).toHaveAttribute('aria-label', 'Gespräch in der Finanzdemo');
      expect(await page.locator('#bot-messages-apple').getAttribute('aria-label'))
        .not.toBe(await page.locator('.demo-source caption').textContent());
    }
  }
});
