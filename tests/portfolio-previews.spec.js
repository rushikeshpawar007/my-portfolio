const { test, expect } = require('@playwright/test');

const previewSelector = '[data-project-preview]';
const invoiceSelector = '[data-project-preview="invoice"]';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

async function openInvoice(page, controlledClock = false) {
  return openPreview(page, 'invoice', controlledClock);
}

async function openPreview(page, name, controlledClock = false) {
  if (controlledClock) await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  const preview = page.locator(`[data-project-preview="${name}"]`);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute('data-preview-state', 'playing');
  if (controlledClock) await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
  return preview;
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
    const expectedOpacity = ['thinking', 'pulse', 'signal-x', 'signal-y'].includes(element.dataset.previewMotion) ? '0' : '1';
    return element.getAnimations().length === 0 && style.opacity === expectedOpacity;
  }))).toBe(true);
}

test('visible project stories loop with a readable hold and only finite compositor animations', async ({ page }) => {
  const invoice = await openInvoice(page, true);
  await expect(page.locator(previewSelector)).toHaveCount(9);
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
    await page.clock.fastForward(1999);
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
    // Printing opens and restores every case study; scroll anchoring can move
    // this preview offscreen. Resume is only expected after it is visible again.
    if (action === 'print') await invoice.scrollIntoViewIfNeeded();
    await expect(invoice).toHaveAttribute('data-preview-state', 'playing');
    await invoice.locator('[data-preview-toggle]').click();
    await setSuspended(true);
    await setSuspended(false);
    // Keep the paused check meaningful even when disclosure restoration scrolls.
    if (action === 'print') await invoice.scrollIntoViewIfNeeded();
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
  await expect(page.locator(previewSelector)).toHaveCount(9);
  for (const preview of await page.locator(previewSelector).all()) {
    await expect(preview).toHaveAttribute('data-preview-state', 'complete');
    await expect(preview.locator('[data-preview-toggle]')).toBeHidden();
    await expectStatic(preview);
  }
});

test('blocked preview JavaScript leaves useful still frames with no inactive controls', async ({ page }) => {
  await page.route('**/src/project-previews.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator(previewSelector)).toHaveCount(9);
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

test('the royalty workflow repeats and its pause control settles the whole story', async ({ page }) => {
  const royalty = await openPreview(page, 'royalty', true);
  await finishPreview(royalty);
  await expectStatic(royalty);
  await page.clock.fastForward(2000);
  await expect(royalty).toHaveAttribute('data-preview-state', 'playing');
  await royalty.locator('[data-preview-toggle]').click();
  await expect(royalty).toHaveAttribute('data-preview-paused', 'true');
  await page.clock.fastForward(20000);
  await expect(royalty).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(royalty);
});

for (const name of ['reconciliation', 'deal-history', 'dbt-history']) {
  test(`${name} repeats its complete analytical story and suspends when offscreen or paused`, async ({ page }) => {
    const preview = await openPreview(page, name, true);
    const motions = await preview.locator('[data-preview-motion]').evaluateAll(elements => elements.flatMap(element => element.getAnimations().map(animation => {
      const timing = animation.effect.getTiming();
      return { end: Number(timing.delay) + Number(timing.duration), iterations: timing.iterations, properties: animation.effect.getKeyframes().flatMap(frame => Object.keys(frame)) };
    })));
    expect(motions.length).toBeGreaterThan(0);
    for (const motion of motions) {
      expect(motion.end).toBeLessThanOrEqual(4500);
      expect(motion.iterations).toBe(1);
      expect(motion.properties.every(property => ['opacity', 'transform', 'offset', 'computedOffset', 'easing', 'composite'].includes(property))).toBe(true);
    }
    for (let cycle = 0; cycle < 2; cycle += 1) {
      await finishPreview(preview);
      await expectStatic(preview);
      await page.clock.fastForward(1999);
      await expect(preview).toHaveAttribute('data-preview-state', 'complete');
      await page.clock.fastForward(1);
      await expect(preview).toHaveAttribute('data-preview-state', 'playing');
      expect(await preview.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => element.getAnimations().length === 1))).toBe(true);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(preview).toHaveAttribute('data-preview-state', 'complete');
    await page.clock.fastForward(20000);
    await expectStatic(preview);
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute('data-preview-state', 'playing');
    const toggle = preview.locator('[data-preview-toggle]');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toBeFocused();
    await expect(preview).toHaveAttribute('data-preview-paused', 'true');
    await page.clock.fastForward(20000);
    await expectStatic(preview);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(toggle).toBeHidden();
    await expectStatic(preview);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(toggle).toBeVisible();
    await expect(preview).toHaveAttribute('data-preview-paused', 'true');
    await expect(preview).toHaveAttribute('data-preview-state', 'complete');
    await toggle.click();
    await expect(preview).toHaveAttribute('data-preview-state', 'playing');
  });
}

test('analytical card pause choices remain independent through repeated language changes', async ({ page }) => {
  const reconciliation = await openPreview(page, 'reconciliation', true);
  const history = page.locator('[data-project-preview="deal-history"]');
  for (const preview of [reconciliation, history]) {
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute('data-preview-state', 'playing');
    await preview.locator('[data-preview-toggle]').click();
  }
  for (const language of ['de', 'en', 'de', 'en']) {
    await page.clock.fastForward(200);
    await page.locator('#lang-toggle-header').click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    for (const preview of [reconciliation, history]) {
      await expect(preview).toHaveAttribute('data-preview-paused', 'true');
      await expect(preview).toHaveAttribute('data-preview-state', 'complete');
      await expectStatic(preview);
      expect(await preview.locator('[data-preview-toggle]').evaluate(button => {
        const translations = JSON.parse(document.getElementById('translations-data').textContent)[document.documentElement.lang];
        return button.dataset.i18nAria === button.dataset.previewResumeKey
          && button.getAttribute('aria-label') === translations[button.dataset.previewResumeKey]
          && button.querySelector('[data-preview-control-label]').textContent === translations.preview_resume;
      })).toBe(true);
    }
  }
  await history.scrollIntoViewIfNeeded();
  await history.locator('[data-preview-toggle]').click();
  await expect(history).toHaveAttribute('data-preview-state', 'playing');
  await expect(history).toHaveAttribute('data-preview-paused', 'false');
  await expect(reconciliation).toHaveAttribute('data-preview-paused', 'true');
  await expectStatic(reconciliation);
});

async function openPipeline(page) {
  const details = page.locator('#rag-case-study-details');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  const pipeline = page.locator('[data-project-preview="rag-pipeline"]');
  await pipeline.scrollIntoViewIfNeeded();
  await expect(pipeline).toHaveAttribute('data-preview-state', 'playing');
  return { details, pipeline };
}

async function closePipelineDuringTransition(details) {
  // Keep the detail's height animation open to isolate the preview's closing gate.
  await details.evaluate(element => {
    element.querySelector('summary').click();
    element.getAnimations().forEach(animation => animation.pause());
  });
  await expect(details).toHaveAttribute('data-disclosure-state', 'closing');
  await expect(details).toHaveAttribute('open', '');
}

async function finishDisclosure(details) {
  await details.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
  await expect(details).not.toHaveAttribute('data-disclosure-state');
}

test('the RAG signal stops as closing starts and remembers pause across reopening', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  const closedPipeline = page.locator('[data-project-preview="rag-pipeline"]');
  await expect(closedPipeline).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(closedPipeline);
  const { details, pipeline } = await openPipeline(page);
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
  const signal = pipeline.locator('[data-preview-motion="signal-y"]').first();
  const signalFrames = await signal.evaluate(element => element.getAnimations()[0].effect.getKeyframes());
  expect(signalFrames[0].opacity).toBe('0');
  expect(signalFrames.at(-1).opacity).toBe('0');
  expect(signalFrames.at(-1).transform).toBe('translateY(24px)');
  await closePipelineDuringTransition(details);
  await expect(pipeline).toHaveAttribute('data-preview-state', 'complete');
  await page.clock.fastForward(20000);
  await expectStatic(pipeline);
  await finishDisclosure(details);
  await expect(details).not.toHaveAttribute('open');
  await openPipeline(page);
  await pipeline.locator('[data-preview-toggle]').click();
  await expect(pipeline).toHaveAttribute('data-preview-paused', 'true');
  await closePipelineDuringTransition(details);
  await finishDisclosure(details);
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  await pipeline.scrollIntoViewIfNeeded();
  await expect(pipeline).toHaveAttribute('data-preview-paused', 'true');
  await expect(pipeline).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(pipeline);
});

test('closing a RAG detail cancels its pending repeat and reopening starts a fresh cycle', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  const { details, pipeline } = await openPipeline(page);
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
  await finishPreview(pipeline);
  await closePipelineDuringTransition(details);
  await page.clock.fastForward(20000);
  await expect(pipeline).toHaveAttribute('data-preview-state', 'complete');
  await expectStatic(pipeline);
  await finishDisclosure(details);
  await openPipeline(page);
  await expect(pipeline).toHaveAttribute('data-preview-state', 'playing');
  expect(await pipeline.locator('[data-preview-motion]').evaluateAll(elements => elements.every(element => element.getAnimations().length === 1))).toBe(true);
});

test('a reduced-motion RAG deep link opens a readable static architecture', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#rag-case-study');
  await expect(page.locator('#rag-case-study-details')).toHaveAttribute('open', '');
  const pipeline = page.locator('[data-project-preview="rag-pipeline"]');
  await pipeline.scrollIntoViewIfNeeded();
  await expect(pipeline).toBeVisible();
  await expect(pipeline).toContainText('Pinecone');
  await expect(pipeline.locator('[data-preview-toggle]')).toBeHidden();
  await expectStatic(pipeline);
});

test('the RAG architecture remains readable through native details without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/');
    const details = page.locator('#rag-case-study-details');
    await details.locator('summary').click();
    const pipeline = page.locator('[data-project-preview="rag-pipeline"]');
    await expect(pipeline).toBeVisible();
    await expect(pipeline).toContainText('Pinecone');
    await expect(pipeline.locator('[data-preview-toggle]')).toBeHidden();
    await expectStatic(pipeline);
  } finally {
    await context.close();
  }
});
