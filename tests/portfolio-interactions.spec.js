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

for (const language of ['en', 'de']) {
  test(`theme and language controls announce their destination in ${language}`, async ({ page }) => {
    const labels = {
      en: { dark: 'Switch to dark theme', light: 'Switch to light theme', language: 'Switch to German' },
      de: { dark: 'Zum dunklen Design wechseln', light: 'Zum hellen Design wechseln', language: 'Zu Englisch wechseln' },
    };
    const current = labels[language];
    const other = labels[language === 'en' ? 'de' : 'en'];
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.addInitScript(lang => {
      localStorage.setItem('lang', lang);
      // Only seed a fresh session; reload must exercise the saved dark theme.
      if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'light');
    }, language);
    await page.goto('/');
    const theme = page.locator('#theme-toggle');
    const headerLanguage = page.locator('#lang-toggle-header');
    const menuLanguage = page.locator('#lang-toggle-mobile');
    await expect(theme).toHaveAccessibleName(current.dark);
    await expect(theme).toHaveAttribute('title', current.dark);
    await expect(headerLanguage).toHaveAccessibleName(current.language);
    await expect(menuLanguage).toHaveAttribute('aria-label', current.language);
    // Exercise keyboard focus explicitly: Safari does not focus pointer-clicked buttons.
    await theme.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(theme).toHaveAccessibleName(current.light);
    await expect(theme).toBeFocused();
    await page.reload();
    await expect(theme).toHaveAccessibleName(current.light);
    await theme.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(theme).toHaveAccessibleName(current.dark);
    await page.locator('#mobile-menu-button').click();
    await menuLanguage.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', language === 'en' ? 'de' : 'en');
    await expect(theme).toHaveAccessibleName(other.dark);
    await expect(headerLanguage).toHaveAccessibleName(other.language);
    await expect(menuLanguage).toHaveAccessibleName(other.language);
    await expect(menuLanguage).toHaveAttribute('title', other.language);
    await expect(menuLanguage).toBeFocused();
  });
}

test('tablet language changes preserve focus and section links focus their destination', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await page.locator('#mobile-menu-button').click();
  await page.locator('#lang-toggle-mobile').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#lang-toggle-mobile')).toBeVisible();
  await expect(page.locator('#lang-toggle-mobile')).toBeFocused();
  await page.locator('#mobile-menu a[href="#projects"]').focus();
  await page.keyboard.press('Enter');
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

for (const language of ['en', 'de']) {
  test(`mobile footer returns keyboard focus to the main content in ${language}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(lang => localStorage.setItem('lang', lang), language);
    await page.goto('/');
    const link = page.locator('footer .footer-back-to-top');
    await expect(link).toHaveAttribute('href', '#main');
    await expect(link).toHaveAccessibleName(language === 'en' ? 'Scroll to top' : 'Nach oben scrollen');
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeInViewport();
    await expect(page.locator('#scrollTopBtn')).toBeHidden();
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator('#main')).toBeFocused();
    await expect(page.locator('#hero-heading')).toBeInViewport();
  });
}
