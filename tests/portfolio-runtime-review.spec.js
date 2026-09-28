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
  for (const lang of ['de', 'en', 'de']) {
    await page.locator('#lang-toggle-header').click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    // The UI intentionally debounces rapid language toggles for 150 ms.
    await page.waitForTimeout(160);
  }
  const detachedMetrics = await page.evaluate(() => [...window.observedTargets]
    .filter(target => target.matches('.metric-highlight') && !target.isConnected).length);
  expect(detachedMetrics).toBe(0);
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await expect(page.locator('.skill-note .metric-highlight')).toHaveText(['4+', '5']);
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
      return { finished: Promise.reject(new Error('Transition update failed')) };
    };
  });
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).not.toHaveClass(/theme-switching/);
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
  await page.locator('#reconciliation-details, #pipeline-history-details').evaluateAll(details => details.forEach(el => { el.open = true; }));
  const initial = await page.evaluate(() => window.formatterConstructions);
  await page.locator('[data-reconciliation-filter="review"]').click();
  await page.locator('#workbench-deal').selectOption('D-202');
  await expect(page.locator('[data-current-stage] strong')).toHaveText('Closed Won');
  await expect(page.locator('[data-total="difference"]')).toHaveText('€2,500');
  expect(await page.evaluate(() => window.formatterConstructions)).toBe(initial);
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('[data-total="difference"]')).toHaveText(/2\.500\s€/);
  const german = await page.evaluate(() => window.formatterConstructions);
  expect(german - initial).toBeLessThanOrEqual(5);
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
