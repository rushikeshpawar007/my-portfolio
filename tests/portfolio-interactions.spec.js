const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

test('tablet navigation closes with Escape and returns keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  const toggle = page.locator('#mobile-menu-button');
  await toggle.click();
  await page.locator('#mobile-menu a').first().focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('tablet language changes preserve focus and section links focus their destination', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await page.locator('#mobile-menu-button').click();
  await page.locator('#lang-toggle-mobile').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#lang-toggle-mobile')).toBeVisible();
  await expect(page.locator('#lang-toggle-mobile')).toBeFocused();
  await page.locator('#mobile-menu a[href="#projects"]').click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await expect(page.locator('#projects')).toBeFocused();
  await expect(page).toHaveURL(/#projects$/);
});

test('tablet navigation dismisses outside the menu and resets after viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  const toggle = page.locator('#mobile-menu-button');
  await toggle.click();
  // The menu overlays the hero, so use the exposed page gutter to dismiss it.
  await page.mouse.click(4, 84);
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(page.locator('#mobile-menu')).toBeHidden();
});

test('active section is announced and back to top returns keyboard focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('header nav a[href="#skills"]').click();
  await expect(page.locator('header nav a[href="#skills"]')).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('#bottom-nav a[href="#skills"]')).toHaveAttribute('aria-current', 'location');
  await page.locator('#scrollTopBtn').click();
  await expect(page.locator('#main')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('[aria-current="location"]')).toHaveCount(0);
});
