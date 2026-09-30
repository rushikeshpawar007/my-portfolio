const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'denied');
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'light');
  });
});

test('language changes release replaced metric observer targets', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.observedTargets = new Set();
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        super(callback, options);
        this.trackedTargets = new Set();
      }
      observe(target) {
        this.trackedTargets.add(target);
        window.observedTargets.add(target);
        super.observe(target);
      }
      unobserve(target) {
        this.trackedTargets.delete(target);
        window.observedTargets.delete(target);
        super.unobserve(target);
      }
      disconnect() {
        this.trackedTargets.forEach(target => window.observedTargets.delete(target));
        this.trackedTargets.clear();
        super.disconnect();
      }
    };
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => [...window.observedTargets]
    .some(target => target.matches('[data-i18n-key="smauto_desc"] .metric-highlight')))).toBe(true);
  for (const lang of ['de', 'en', 'de']) {
    await page.locator('#lang-toggle-header').click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    // The UI intentionally debounces rapid language toggles for 150 ms.
    await page.waitForTimeout(160);
  }
  const detachedMetrics = await page.evaluate(() => [...window.observedTargets]
    .filter(target => target.matches('.metric-highlight') && !target.isConnected).length);
  expect(detachedMetrics).toBe(0);
  const translatedMetric = page.locator('[data-i18n-key="smauto_desc"] .metric-highlight');
  await translatedMetric.scrollIntoViewIfNeeded();
  await expect(translatedMetric).toHaveText('₹200k');
  await expect(translatedMetric).toHaveAttribute('data-counted', '1');
});

test('switching language before scrolling still lets every impact metric finish on a phone', async ({ page }) => {
  // At this size the first metric is only partly on screen when the page opens.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.locator('#impact').scrollIntoViewIfNeeded();
  for (const rule of await page.locator('#impact .closing-rule').all()) await expect(rule).toHaveClass(/drawn/);
});

test('superseded theme transitions cannot clear the latest transition state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.themeTransitions = [];
    document.startViewTransition = update => {
      update();
      const finished = new Promise((resolve, reject) => window.themeTransitions.push({ resolve, reject }));
      return { finished, ready: Promise.resolve(), updateCallbackDone: Promise.resolve() };
    };
  });
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(160);
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.evaluate(() => window.themeTransitions[0].resolve());
  await expect(page.locator('html')).toHaveClass(/theme-switching/);
  await page.evaluate(() => window.themeTransitions[1].resolve());
  await expect(page.locator('html')).not.toHaveClass(/theme-switching/);
});

test('a failed theme transition clears its state without an unhandled rejection', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    document.startViewTransition = update => {
      update();
      return { finished: Promise.reject(new Error('Transition update failed')), ready: Promise.resolve() };
    };
  });
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).not.toHaveClass(/theme-switching/);
  await page.waitForTimeout(50);
  expect(errors).toEqual([]);
});

test('a skipped native theme transition still applies the theme without an unhandled rejection', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = update => {
      const transition = start(update);
      transition.skipTransition();
      return transition;
    };
  });
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).not.toHaveClass(/theme-switching/);
  await expect(page.locator('#theme-toggle')).toHaveAccessibleName('Switch to light theme');
  await page.waitForTimeout(50);
  expect(errors).toEqual([]);
});

test('sample controls reuse locale formatters while preserving translated values', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.formatterConstructions = 0;
    for (const name of ['NumberFormat', 'DateTimeFormat']) {
      Intl[name] = new Proxy(Intl[name], {
        construct(target, args) {
          window.formatterConstructions += 1;
          return Reflect.construct(target, args);
        },
      });
    }
  });
  await page.goto('/');
  await page.locator('#reconciliation-details, #cleaning-analysis-details, #pipeline-history-details, #dbt-history-details, #pipeline-analysis-details').evaluateAll(details => details.forEach(el => { el.open = true; }));
  const initial = await page.evaluate(() => window.formatterConstructions);
  await page.locator('[data-reconciliation-filter="review"]').click();
  await page.locator('#workbench-deal').selectOption('D-202');
  await expect(page.locator('[data-current-stage] strong')).toHaveText('Closed Won');
  await expect(page.locator('[data-total="difference"]')).toHaveText('€2,500');
  await page.locator('[data-cleaning-select="2"]').click();
  await page.locator('[data-lineage-step="1"]').click();
  expect(await page.evaluate(() => window.formatterConstructions)).toBe(initial);
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('[data-total="difference"]')).toHaveText(/2\.500\s€/);
  const german = await page.evaluate(() => window.formatterConstructions);
  // Five existing formats plus one currency format for each new analyst sample.
  expect(german - initial).toBeLessThanOrEqual(7);
  await page.locator('[data-cleaning-select="0"]').click();
  await page.locator('[data-lineage-step="2"]').click();
  expect(await page.evaluate(() => window.formatterConstructions)).toBe(german);
  await page.waitForTimeout(160);
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-total="difference"]')).toHaveText('€2,500');
  expect(await page.evaluate(() => window.formatterConstructions)).toBe(german);
});

test('email-app fallback preserves the draft when delivery cannot be confirmed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const form = page.locator('#contact-form');
  await form.locator('[name="access_key"]').evaluate(input => { input.value = ''; });
  await page.locator('#name').fill('Test User');
  await page.locator('#email').fill('test@example.com');
  await page.locator('#message').fill('Please preserve this unsent draft.');
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveAttribute('aria-busy', 'false');
  await expect(form.locator('button[type="submit"]')).toBeEnabled();
  await expect(page.locator('#name')).toHaveValue('Test User');
  await expect(page.locator('#email')).toHaveValue('test@example.com');
  await expect(page.locator('#message')).toHaveValue('Please preserve this unsent draft.');
  await expect(page.locator('.toast')).toHaveCount(0);
});

for (const destination of [
  { link: '[data-i18n-key="see_my_work_button"]', details: '#report-details', hash: '#finance-case-study' },
  { link: '[data-i18n-key="demo_open"]', details: '#rag-case-study-details', hash: '#dynamic-island-container' },
]) {
  test(`opening ${destination.hash} in another tab leaves this page's disclosures unchanged`, async ({ page, context }) => {
    await page.goto('/');
    const link = page.locator(destination.link);
    await link.focus();
    // Modifier-opened tabs do not have an opener in every browser.
    const popupPromise = context.waitForEvent('page');
    await link.click({ modifiers: ['ControlOrMeta'] });
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveURL(new RegExp(`${destination.hash}$`));
    await expect(popup.locator(destination.details)).toHaveAttribute('open', '');
    await expect(page).toHaveURL('http://127.0.0.1:4173/');
    await expect(page.locator(destination.details)).not.toHaveAttribute('open');
    await expect(page.locator('#dynamic-island-container')).toHaveClass(/collapsed/);
    await expect(link).toBeFocused();
    await popup.close();
  });
}
