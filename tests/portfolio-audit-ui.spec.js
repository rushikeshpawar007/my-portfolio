const { test, expect } = require('@playwright/test');

for (const lang of ['en', 'de']) {
  for (const enlarged of [false, true]) {
    test(`mobile contact and footer keyboard controls remain visible in ${lang}${enlarged ? ' with doubled text' : ''}`, async ({ page }) => {
      await page.setViewportSize({ width: enlarged ? 320 : 390, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(lang => {
        localStorage.setItem('cookie-consent', 'denied');
        localStorage.setItem('lang', lang);
      }, lang);
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      if (enlarged) await page.addStyleTag({ content: 'html { font-size: 200%; }' });
      await page.locator('.copy-email-btn').focus();
      const expected = ['#name', '#email', '#message', '#contact-form button[type="submit"]', '.contact-form-note a', ...Array.from({ length: 4 }, (_, i) => `.footer-social >> nth=${i}`)];
      for (const selector of expected) {
        await page.keyboard.press('Tab');
        const control = page.locator(selector);
        await expect(control).toBeFocused();
        const visible = await control.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          const topBar = document.querySelector('header').getBoundingClientRect();
          const bottomBar = document.getElementById('bottom-nav').getBoundingClientRect();
          return {
            aboveNavigation: bounds.bottom <= bottomBar.top,
            belowHeader: bounds.top >= topBar.bottom,
            // Wrapped inline links have a separate hit area on each line;
            // the union rectangle's centre can fall into the line-height gap.
            hit: [...element.getClientRects()].every(rect => element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))),
          };
        });
        expect(visible, selector).toEqual({ aboveNavigation: true, belowHeader: true, hit: true });
      }
    });
  }
}

test('touch visitors can focus and type in the full message field without losing the caret', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/');
    const message = page.locator('#message');
    await message.tap();
    await expect(message).toBeFocused();
    const text = 'I would like to discuss an analytics project.';
    await page.keyboard.type(text);
    await expect(message).toHaveValue(text);
    await expect(message).toBeFocused();
    const state = await message.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return {
        aboveNavigation: bounds.bottom <= document.getElementById('bottom-nav').getBoundingClientRect().top,
        belowHeader: bounds.top >= document.querySelector('header').getBoundingClientRect().bottom,
        caretAtEnd: element.selectionStart === element.value.length && element.selectionEnd === element.value.length,
      };
    });
    expect(state).toEqual({ aboveNavigation: true, belowHeader: true, caretAtEnd: true });
  } finally {
    await context.close();
  }
});
