const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function openExercise(page) {
  await page.goto('/');
  await page.locator('#reconciliation-details').evaluate(details => { details.open = true; });
  const exercise = page.locator('[data-cleaning]');
  await expect(exercise.locator('[data-cleaning-select="0"]')).toBeVisible();
  return exercise;
}

test('cleaning preserves source values, exposes duplicate handling, and keeps unknown amounts unknown', async ({ page }) => {
  const exercise = await openExercise(page);
  await expect(exercise.locator('[data-cleaning-row]')).toHaveCount(4);
  await expect(exercise.locator('[data-cleaning-row="0"] [data-cleaning-date]')).toHaveText('03/03/2026');
  await expect(exercise.locator('[data-cleaning-row="2"] [data-cleaning-status]')).toHaveText('Exact duplicate');
  const normalize = exercise.locator('[data-cleaning-select="1"]');
  await normalize.focus();
  await page.keyboard.press('Enter');
  await expect(normalize).toBeFocused();
  await expect(normalize).toHaveAttribute('aria-pressed', 'true');
  await expect(exercise.locator('[data-cleaning-row="0"] [data-cleaning-date]')).toHaveText('03/03/2026 → 2026-03-03');
  await expect(exercise.locator('[data-cleaning-note]')).toContainText('2 dates standardized');
  await exercise.locator('[data-cleaning-select="2"]').click();
  await expect(exercise.locator('[data-cleaning-count]')).toHaveText('4 input rows · 3 retained · 1 needs review');
  await expect(exercise.locator('[data-cleaning-row="2"]')).toHaveAttribute('data-cleaning-removed', 'true');
  await expect(exercise.locator('[data-cleaning-row="2"] [data-cleaning-status]')).toHaveText('Duplicate removed');
  await expect(exercise.locator('[data-cleaning-row="3"] [data-cleaning-status]')).toHaveText('Review');
  await expect(exercise.locator('[data-cleaning-row="3"] [data-cleaning-amount]')).toHaveText('Missing');
  await expect(exercise.locator('[data-cleaning-announcement]')).toContainText('3 retained');
  await exercise.locator('[data-cleaning-select="0"]').click();
  await expect(exercise.locator('[data-cleaning-row="0"] [data-cleaning-date]')).toHaveText('03/03/2026');
  await expect(exercise.locator('[data-cleaning-row="2"]')).toHaveAttribute('data-cleaning-removed', 'false');
});

test('language change preserves the selected step and localizes amounts and live feedback', async ({ page }) => {
  const exercise = await openExercise(page);
  await exercise.locator('[data-cleaning-select="2"]').click();
  await page.locator('#lang-toggle-header').click();
  await expect(exercise.locator('[data-cleaning-select="2"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(exercise.locator('[data-cleaning-count]')).toHaveText('4 Eingabezeilen · 3 übernommen · 1 zur Prüfung');
  await expect(exercise.locator('[data-cleaning-row="0"] [data-cleaning-amount]')).toHaveText(/1\.200\s€/);
  await expect(exercise.locator('[data-cleaning-row="3"] [data-cleaning-amount]')).toHaveText('Fehlt');
  await expect(exercise.locator('[data-cleaning-row="3"] [data-cleaning-status]')).toHaveText('Prüfen');
  await expect(exercise.locator('[data-cleaning-announcement]')).toContainText('3 übernommen');
});

test('the no-JavaScript example stays complete and hides nonfunctional controls', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#reconciliation-details > summary').click();
  const exercise = page.locator('[data-cleaning]');
  await expect(exercise.locator('[data-cleaning-row]')).toHaveCount(4);
  await expect(exercise.locator('[data-cleaning-count]')).toHaveText('4 input rows · 3 retained · 1 needs review');
  await expect(exercise.locator('[data-cleaning-controls]')).toBeHidden();
  await expect(exercise.locator('[data-cleaning-row="3"] [data-cleaning-amount]')).toHaveText('Missing');
  await context.close();
});

test('cleaning motion is finite and stops for reduced motion', async ({ page }) => {
  const exercise = await openExercise(page);
  await exercise.locator('[data-cleaning-select="1"]').click();
  expect(await exercise.locator('[data-cleaning-result]').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const motions = await exercise.evaluate(element => {
    element.querySelector('[data-cleaning-select="2"]').click();
    return element.querySelector('[data-cleaning-result]').getAnimations().map(animation => {
      animation.pause();
      return { duration: animation.effect.getTiming().duration, iterations: animation.effect.getTiming().iterations, properties: animation.effect.getKeyframes().flatMap(frame => Object.keys(frame)) };
    });
  });
  expect(motions).toHaveLength(1);
  expect(motions[0].duration).toBeLessThanOrEqual(200);
  expect(motions[0].iterations).toBe(1);
  expect(motions[0].properties.every(property => ['opacity', 'transform', 'offset', 'computedOffset', 'easing', 'composite'].includes(property))).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => exercise.locator('[data-cleaning-result]').evaluate(element => element.getAnimations().length)).toBe(0);
});

for (const language of ['en', 'de']) {
  test(`cleaning reflows at 320px with doubled ${language} text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.addInitScript(lang => localStorage.setItem('lang', lang), language);
    const exercise = await openExercise(page);
    await exercise.locator('[data-cleaning-select="2"]').click();
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '32px';
      await document.fonts.ready;
    });
    const overflow = await exercise.locator('h4, p, button, table, caption, tbody, tr, th, td, [data-cleaning-date], [data-cleaning-amount]').evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || element.closest('thead, .sr-only')) return [];
      return rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1 ? [element.className || element.tagName] : [];
    }));
    expect(overflow).toEqual([]);
  });
}
