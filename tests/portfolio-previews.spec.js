const { test, expect } = require('@playwright/test');

const previewSelector = '[data-project-preview]';
const invoiceSelector = '[data-project-preview="invoice"]';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

async function openInvoice(page, controlledClock = false) {
  if (controlledClock) await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  const invoice = page.locator(invoiceSelector);
  await invoice.scrollIntoViewIfNeeded();
  await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
  if (controlledClock) await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
  return invoice;
}

async function finishPreview(preview) {
  await preview.locator('[data-preview-motion]').evaluateAll(elements => {
    elements.forEach(element => element.getAnimations().forEach(animation => animation.finish()));
  });
  await expect(preview).toHaveAttribute('data-preview-state', 'complete');
}

async function expectStatic(preview) {
  expect(await preview.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => {
    const style = getComputedStyle(element);
    const expectedOpacity = element.dataset.previewMotion === 'thinking' ? '0' : '1';
    return element.getAnimations().length === 0 && style.opacity === expectedOpacity;
  }))).toBe(true);
}

test('visible project stories loop with a readable hold and only finite compositor animations', async ({ page }) => {
  const invoice = await openInvoice(page, true);
  await expect(page.locator(previewSelector)).toHaveCount(4);
  const motions = await invoice.locator('[data-preview-motion]').evaluateAll(elements => elements.flatMap(element => element.getAnimations().map(animation => {
    animation.pause();
    const timing = animation.effect.getTiming();
    return {
      end: Number(timing.delay) + Number(timing.duration),
      iterations: timing.iterations,
      properties: animation.effect.getKeyframes().flatMap(frame => Object.keys(frame)),
    };
  })));
  expect(motions.length).toBeGreaterThan(0);
  for (const motion of motions) {
    expect(motion.end).toBeLessThanOrEqual(4500);
    expect(motion.iterations).toBe(1);
    expect(motion.properties.every(property => ['opacity', 'transform', 'offset', 'computedOffset', 'easing', 'composite'].includes(property))).toBe(true);
  }
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await finishPreview(invoice);
    await expectStatic(invoice);
    await page.clock.fastForward(1199);
    await expect(invoice).toHaveAttribute('data-preview-state', 'complete');
    await page.clock.fastForward(1);
    await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
    expect(await invoice.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => element.getAnimations().length === 1))).toBe(true);
  }
});

test('pause cancels the hold timer, keeps the final frame, and resumes without losing keyboard focus', async ({ page }) => {
  const invoice = await openInvoice(page, true);
  await finishPreview(invoice);
  const toggle = invoice.locator('[data-preview-toggle]');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(invoice).toHaveAttribute('data-preview-paused', 'true');
  await expect(toggle.locator('[data-preview-control-label]')).toHaveText('Resume');
  await expect(toggle).toBeFocused();
  await page.clock.fastForward(20000);
  await expect(invoice).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(invoice);
  await page.keyboard.press('Enter');
  await expect(invoice).toHaveAttribute('data-preview-paused', 'false');
  await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
  await expect(toggle).toBeFocused();
  await invoice.evaluate(element => {
    const button = element.querySelector('[data-preview-toggle]');
    button.click();
    button.click();
  });
  await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
  expect(await invoice.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => element.getAnimations().length === 1))).toBe(true);
});

test('offscreen previews suspend and resume while remembering a manual pause', async ({ page }) => {
  const invoice = await openInvoice(page, true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(invoice).toHaveAttribute('data-preview-state', 'complete');
  await page.clock.fastForward(20000);
  await expectStatic(invoice);
  await invoice.scrollIntoViewIfNeeded();
  await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
  await invoice.locator('[data-preview-toggle]').click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => invoice.evaluate(element => element.getBoundingClientRect().top > innerHeight)).toBe(true);
  await invoice.scrollIntoViewIfNeeded();
  await expect(invoice).toHaveAttribute('data-preview-paused', 'true');
  await expect(invoice).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(invoice);
});

test('reduced motion keeps complete stills and preserves a pause when normal motion returns', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const preview of await page.locator(previewSelector).all()) {
    await expect(preview).toHaveAttribute('data-preview-state', 'complete');
    await expect(preview.locator('[data-preview-toggle]')).toBeHidden();
    await expectStatic(preview);
  }
  const invoice = page.locator(invoiceSelector);
  await invoice.scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
  await invoice.locator('[data-preview-toggle]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(invoice).toHaveAttribute('data-preview-paused', 'true');
  await expect(invoice).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(invoice);
});

for (const action of ['print', 'hidden']) {
  test(`${action} suspends loops, then resumes only stories the visitor has not paused`, async ({ page }) => {
    const invoice = await openInvoice(page, true);
    const setSuspended = async active => page.evaluate(({ reason, suspended }) => {
      if (reason === 'print') dispatchEvent(new Event(suspended ? 'beforeprint' : 'afterprint'));
      if (reason === 'hidden') {
        Object.defineProperty(document, 'hidden', { configurable: true, value: suspended });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }, { reason: action, suspended: active });
    await finishPreview(invoice);
    await setSuspended(true);
    await page.clock.fastForward(20000);
    await expectStatic(invoice);
    await setSuspended(false);
    await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
    await invoice.locator('[data-preview-toggle]').click();
    await setSuspended(true);
    await setSuspended(false);
    await expect(invoice).toHaveAttribute('data-preview-paused', 'true');
    await expect(invoice).toHaveAttribute('data-preview-state', 'complete');
    await expectStatic(invoice);
  });
}

test('pause and resume labels remain accurate in both languages without losing the pause choice', async ({ page }) => {
  const invoice = await openInvoice(page);
  await invoice.locator('[data-preview-toggle]').click();
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(invoice).toHaveAttribute('data-preview-paused', 'true');
  await expect(invoice).toHaveAttribute('data-preview-state', 'complete');
  for (const preview of await page.locator(previewSelector).all()) {
    expect(await preview.locator('[data-preview-toggle]').evaluate(button => {
      const translations = JSON.parse(document.getElementById('translations-data').textContent);
      const text = translations[document.documentElement.lang];
      const label = button.querySelector('[data-preview-control-label]');
      return button.getAttribute('aria-label') === text[button.dataset.i18nAria]
        && label.textContent === text[label.dataset.i18nKey];
    })).toBe(true);
  }
  await invoice.scrollIntoViewIfNeeded();
  await invoice.locator('[data-preview-toggle]').click();
  await expect(invoice).toHaveAttribute('data-preview-paused', 'false');
  await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
  await expect(invoice.locator('[data-preview-control-label]')).toHaveAttribute('data-i18n-key', 'preview_pause');
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(invoice.locator('[data-preview-control-label]')).toHaveText('Pause');
});

test('missing animation support keeps every project preview readable', async ({ page }) => {
  await page.addInitScript(() => { Element.prototype.animate = undefined; });
  await page.goto('/');
  await expect(page.locator(previewSelector)).toHaveCount(4);
  for (const preview of await page.locator(previewSelector).all()) {
    await expect(preview).toHaveAttribute('data-preview-state', 'complete');
    await expect(preview.locator('[data-preview-toggle]')).toBeHidden();
    await expectStatic(preview);
  }
});

test('blocked preview JavaScript leaves useful still frames with no inactive controls', async ({ page }) => {
  await page.route('**/src/project-previews.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator(previewSelector)).toHaveCount(4);
  for (const preview of await page.locator(previewSelector).all()) {
    await expect(preview).not.toHaveAttribute('data-preview-state');
    await expect(preview.locator('[data-preview-toggle]')).toBeHidden();
    await expectStatic(preview);
  }
});

test('a delayed dashboard decode cannot restart a paused or offscreen tour', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLImageElement.prototype.decode = function () {
      if (!this.matches('[data-preview-motion="pan"]')) return Promise.resolve();
      return new Promise(resolve => window.addEventListener('preview-test-image-ready', () => resolve(), { once: true }));
    };
  });
  await page.goto('/');
  const spotify = page.locator('[data-project-preview="spotify"]');
  await spotify.scrollIntoViewIfNeeded();
  await expect(spotify).toHaveAttribute('data-preview-state', 'playing');
  expect(await spotify.locator('img').evaluate(image => image.getAnimations().length)).toBe(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(spotify).toHaveAttribute('data-preview-state', 'complete');
  await page.evaluate(() => dispatchEvent(new Event('preview-test-image-ready')));
  await expectStatic(spotify);
  await spotify.scrollIntoViewIfNeeded();
  await expect(spotify).toHaveAttribute('data-preview-state', 'playing');
  await spotify.locator('[data-preview-toggle]').click();
  await page.evaluate(() => dispatchEvent(new Event('preview-test-image-ready')));
  await expect(spotify).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(spotify);
  await spotify.locator('[data-preview-toggle]').click();
  await page.evaluate(() => dispatchEvent(new Event('preview-test-image-ready')));
  await expect.poll(() => spotify.locator('img').evaluate(image => image.getAnimations().length)).toBe(1);
  await finishPreview(spotify);
  await expectStatic(spotify);
});
