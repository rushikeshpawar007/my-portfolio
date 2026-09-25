const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('the dbt deep link opens its technical case and connects to the same business work', async ({ page }) => {
  await page.goto('/#dbt-history-case-study');
  const card = page.locator('#dbt-history-case-study');
  const details = page.locator('#dbt-history-details');
  const preview = card.locator('[data-project-preview="dbt-history"]');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('.case-body')).toBeVisible();
  await expect(preview).toContainText('Salesforce');
  await expect(preview).toContainText('dbt');
  await expect(preview).toContainText('Athena');
  await expect(preview.locator('[data-preview-toggle]')).toBeHidden();
  await card.locator('a[href="#pipeline-history-case-study"]').click();
  await expect(page).toHaveURL(/#pipeline-history-case-study$/);
  await expect(page.locator('#pipeline-history-details')).toHaveAttribute('open', '');
});

test('the dbt case remains readable and keyboard operable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/');
    const details = page.locator('#dbt-history-details');
    const summary = details.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(details.locator('.case-body')).toBeVisible();
    await expect(details).toContainText('Athena');
    const preview = page.locator('[data-project-preview="dbt-history"]');
    await expect(preview.locator('[data-preview-toggle]')).toBeHidden();
    await expect(preview).toContainText('D-201');
    const readable = await preview.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => {
      const opacity = getComputedStyle(element).opacity;
      const hiddenDecoration = ['pulse', 'thinking', 'signal-x', 'signal-y'].includes(element.dataset.previewMotion);
      return element.getAnimations().length === 0 && opacity === (hiddenDecoration ? '0' : '1');
    }));
    expect(readable).toBe(true);
    await page.keyboard.press('Enter');
    await expect(details).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
  } finally {
    await context.close();
  }
});

for (const language of ['en', 'de']) {
  test(`expanded dbt content reflows at 320px with doubled ${language} text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.addInitScript(lang => localStorage.setItem('lang', lang), language);
    await page.goto('/#dbt-history-case-study');
    const card = page.locator('#dbt-history-case-study');
    await expect(page.locator('#dbt-history-details')).toHaveAttribute('open', '');
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '32px';
      await document.fonts.ready;
    });
    const overflow = await card.locator('h3, h4, p, dl, dt, dd, li, time, summary, button, [data-preview-motion]').evaluateAll(elements => elements.flatMap(element => {
      const bounds = element.getBoundingClientRect();
      if (!bounds.width || !bounds.height || element.classList.contains('sr-only')) return [];
      return bounds.left < -1 || bounds.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1
        ? [element.className || element.tagName] : [];
    }));
    expect(overflow).toEqual([]);
    const untranslated = await card.locator('[data-i18n-key], [data-i18n-aria]').evaluateAll(elements => {
      const strings = JSON.parse(document.getElementById('translations-data').textContent)[document.documentElement.lang];
      return elements.flatMap(element => {
        const ariaKey = element.getAttribute('data-i18n-aria');
        const key = ariaKey || element.getAttribute('data-i18n-key');
        const expected = strings[key];
        if (!expected) return [key];
        const template = document.createElement('template');
        template.innerHTML = expected;
        const actual = ariaKey ? element.getAttribute('aria-label') : element.textContent;
        return actual.trim() === template.content.textContent.trim() ? [] : [key];
      });
    });
    expect(untranslated).toEqual([]);
  });
}
