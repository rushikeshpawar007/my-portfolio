const { test, expect } = require('@playwright/test');

const openerSelector = '[data-dashboard-open="spotify-dashboard-viewer"]';
const dialogSelector = '#spotify-dashboard-viewer';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

test('dashboard detail opens a native modal and Escape restores keyboard focus', async ({ page }) => {
  await page.goto('/#spotify-case-study');
  const opener = page.locator(openerSelector);
  const dialog = page.locator(dialogSelector);
  await expect(opener).toHaveAttribute('aria-haspopup', 'dialog');
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(dialog.getByRole('button', { name: 'Close preview' })).toBeFocused();
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('Tab');
    // Native dialog also permits focus on browser chrome between tab cycles;
    // background-page controls must remain outside keyboard navigation.
    expect(await dialog.evaluate(element => element.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
});

test('opening the viewer settles background motion and preserves a manual pause', async ({ page }) => {
  await page.goto('/#spotify-case-study');
  const preview = page.locator('[data-project-preview="spotify"]');
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute('data-preview-state', 'playing');
  await page.locator(openerSelector).click();
  await expect(preview).toHaveAttribute('data-preview-state', 'complete');
  expect(await page.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => element.getAnimations().length === 0))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(preview).toHaveAttribute('data-preview-state', 'playing');
  await preview.locator('[data-preview-toggle]').click();
  await expect(preview).toHaveAttribute('data-preview-paused', 'true');
  await page.locator(openerSelector).click();
  await page.locator('[data-dashboard-close]').click();
  await expect(preview).toHaveAttribute('data-preview-paused', 'true');
  await expect(preview).toHaveAttribute('data-preview-state', 'complete');
});

for (const language of ['en', 'de']) {
  for (const theme of ['light', 'dark']) {
    test(`mobile ${language} ${theme}: full-size view scrolls inside the dialog and fits back`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(({ language, theme }) => {
        localStorage.setItem('lang', language);
        localStorage.setItem('theme', theme);
      }, { language, theme });
      await page.goto('/#spotify-case-study');
      await page.locator(openerSelector).click();
      const dialog = page.locator(dialogSelector);
      const canvas = page.locator('#spotify-viewer-canvas');
      const zoom = dialog.locator('[data-dashboard-zoom]');
      await expect(zoom).toHaveText(language === 'en' ? 'Full-size detail' : 'Detail in Originalgröße');
      expect(await canvas.locator('img').evaluate(image => image.naturalWidth)).toBe(1421);
      expect(await canvas.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await zoom.click();
      await expect(zoom).toHaveAttribute('aria-pressed', 'true');
      expect(await canvas.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
      await canvas.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => canvas.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const bounds = await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
      await zoom.click();
      await expect(zoom).toHaveAttribute('aria-pressed', 'false');
      expect(await canvas.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await expect(dialog.getByRole('link')).toHaveAttribute('href', 'https://public.tableau.com/app/profile/rushikesh.pawar/viz/Spotifychallenge/Dashboard1');
      await dialog.locator('[data-dashboard-close]').click();
      await expect(page.locator(openerSelector)).toBeFocused();
    });
  }
}

test('blocked viewer script keeps the native screenshot link usable', async ({ page }) => {
  await page.route('**/src/dashboard-viewer.js', route => route.abort());
  await page.goto('/#spotify-case-study');
  const opener = page.locator(openerSelector);
  await expect(opener).not.toHaveAttribute('aria-haspopup');
  await opener.click();
  await expect(page).toHaveURL(/\/assets\/images\/projects\/spotify_dashboard\.png$/);
});

test('reduced motion still allows the static full-dashboard viewer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#spotify-case-study');
  await page.locator(openerSelector).click();
  await expect(page.locator(dialogSelector)).toBeVisible();
  expect(await page.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => element.getAnimations().length === 0))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator(openerSelector)).toBeFocused();
});
