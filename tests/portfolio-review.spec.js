const { test, expect } = require('@playwright/test');

test('all sections remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173');
  const hidden = await page.locator('main section, main h1, main h2').evaluateAll(elements =>
    elements.filter(el => getComputedStyle(el).opacity === '0' || getComputedStyle(el).visibility === 'hidden').map(el => el.id));
  expect(hidden).toEqual([]);
  await expect(page.locator('#finance-case-study')).toContainText('10 hours');
  await context.close();
});

test('blocked main script preserves content, including a saved German preference', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.route('**/src/main.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  for (const id of ['hero', 'projects', 'contact']) {
    await expect(page.locator('#' + id)).toHaveCSS('opacity', '1');
  }
});

test('projects precede biography and every project remains inside main', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('main > section').evaluateAll(elements => elements.map(el => el.id));
  expect(order).toEqual(['hero', 'impact', 'projects', 'about', 'experience', 'skills', 'education', 'contact']);
  await expect(page.locator('#projects [data-i18n-key="spotify_title"]')).toBeAttached();
  await page.locator('[data-i18n-key="see_my_work_button"]').click();
  await expect(page).toHaveURL(/#finance-case-study$/);
  await expect(page.locator('#report-details')).toHaveAttribute('open', '');
  await expect(page.locator('#finance-case-study')).toContainText('600 → 5 minutes');
});

for (const lang of ['en', 'de']) {
  test(`every marked string and accessible label is translated in ${lang}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(language => localStorage.setItem('lang', language), lang);
    await page.goto('/');
    const failures = await page.evaluate(() => {
      const strings = JSON.parse(document.getElementById('translations-data').textContent)[document.documentElement.lang];
      return [...document.querySelectorAll('[data-i18n-key], [data-i18n-aria]')].flatMap(el => {
        const aria = el.getAttribute('data-i18n-aria');
        const key = aria || el.getAttribute('data-i18n-key');
        if (!strings[key]) return ['missing: ' + key];
        const template = document.createElement('template');
        template.innerHTML = strings[key];
        const expected = template.content.textContent.trim();
        const actual = aria ? el.getAttribute('aria-label') : /INPUT|TEXTAREA/.test(el.tagName) ? el.getAttribute('placeholder') : el.textContent;
        return actual.trim() === expected ? [] : [key + ': ' + actual];
      });
    });
    expect(failures).toEqual([]);
  });
}

test('localized demo cites fictional source, handles absent data and restores focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#cookie-decline').click();
  await page.locator('[data-i18n-key="demo_open"]').click();
  await page.locator('#bot-question-prompts-apple button').first().click();
  await expect(page.locator('#bot-messages-apple')).toContainText('105.3%');
  await page.locator('#bot-messages-apple a').last().click();
  await expect(page.locator('#demo-source')).toHaveAttribute('open', '');
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('#bot-messages-apple')).toContainText('Wähle eine Frage');
  await page.locator('#bot-question-prompts-apple button').last().click();
  await expect(page.locator('#bot-messages-apple')).toContainText('keine Prognose');
  await expect(page.locator('#bot-messages-apple')).not.toContainText('forecast');
  await page.locator('#close-island-btn').click();
  await expect(page.locator('#dynamic-island-container')).toBeFocused();
});

for (const width of [320, 375, 768, 1440]) {
  for (const lang of ['en', 'de']) {
    test(`layout at ${width}px in ${lang} keeps controls usable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: lang === 'en' ? 'light' : 'dark' });
      await page.addInitScript(language => localStorage.setItem('lang', language), lang);
      await page.goto('/');
      if (width < 768) {
        const banner = await page.locator('.cookie-banner').boundingBox();
        const nav = await page.locator('#bottom-nav').boundingBox();
        expect(banner.y + banner.height).toBeLessThanOrEqual(nav.y);
      }
      await page.locator('#cookie-decline').click();
      if (width < 768) {
        const cta = await page.locator('[data-i18n-key="see_my_work_button"]').boundingBox();
        expect(cta.y + cta.height).toBeLessThanOrEqual(812);
      }
      await page.locator('[data-i18n-key="demo_open"]').click();
      await expect(page.locator('#bot-question-prompts-apple button')).toHaveCount(3);
      await page.locator('#demo-source summary').click();
      const demoSize = await page.locator('#dynamic-island-container').evaluate(el => ({ visible: el.clientHeight, content: el.scrollHeight }));
      expect(demoSize.content).toBeLessThanOrEqual(demoSize.visible + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const clipped = await page.locator('.case-facts, .arch-node, .comparison-values, .comparison-number, #bot-question-prompts-apple button').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
      expect(clipped).toEqual([]);
    });
  }
}

test('case studies are compact, keyboard operable, and keep the comparison visible', async ({ page }) => {
  await page.goto('/');
  await page.locator('#cookie-decline').click();
  await expect(page.locator('details.case-details[open]')).toHaveCount(0);
  await expect(page.locator('.project-preview')).toHaveCount(4);
  await expect(page.locator('.report-comparison')).toContainText('~10 hours');
  const summary = page.locator('#royalty-case-study-details > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#royalty-case-study .case-facts')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#royalty-case-study .case-facts')).toBeHidden();
  await expect(summary).toBeFocused();
  await page.goto('/#rag-case-study');
  await expect(page.locator('#rag-case-study-details')).toHaveAttribute('open', '');
});

test('native case studies work without scripts and print restores disclosure state', async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('http://127.0.0.1:4173');
  await staticPage.locator('#report-details > summary').click();
  await expect(staticPage.locator('#report-details .case-facts')).toBeVisible();
  await context.close();
  await page.goto('/');
  await page.locator('#report-details > summary').click();
  await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('details.case-details[open]')).toHaveCount(5);
  await page.evaluate(() => dispatchEvent(new Event('afterprint')));
  await expect(page.locator('details.case-details[open]')).toHaveCount(1);
  await expect(page.locator('#report-details')).toHaveAttribute('open', '');
});

for (const theme of ['light', 'dark']) {
  test(`refreshed ${theme} palette keeps text contrast and the desktop impact visible`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('#cookie-decline').click();
    const impact = await page.locator('#impact .impact-grid').boundingBox();
    expect(impact.y + impact.height).toBeLessThanOrEqual(900);
    const ratios = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const lum = value => {
        const rgb = value.trim().replace('#', '').match(/../g).map(hex => parseInt(hex, 16) / 255)
          .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      return [['--text-primary', '--bg-color'], ['--text-color', '--surface'], ['--accent-text', '--surface'], ['--accent-text', '--feature-surface'], ['--feature-ink', '--feature-surface']]
        .map(([fg, bg]) => {
          const a = lum(style.getPropertyValue(fg));
          const b = lum(style.getPropertyValue(bg));
          return { pair: fg + ' / ' + bg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
        });
    });
    for (const { pair, ratio } of ratios) expect(ratio, pair).toBeGreaterThanOrEqual(4.5);
  });
}
