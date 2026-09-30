const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function openSamples(page) {
  await page.goto('/');
  await page.locator('#reconciliation-details').evaluate(details => { details.open = true; });
  await page.locator('#pipeline-history-details').evaluate(details => { details.open = true; });
  await expect(page.locator('[data-reconciliation-filter="all"]')).toBeVisible();
}

test('broken translation data leaves the authored English samples in place', async ({ page }) => {
  await page.route('http://127.0.0.1:4173/', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('"workbench_missing":', '"workbench_missing"');
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  for (const sample of ['reconciliation', 'history']) {
    await expect(page.locator(`[data-workbench="${sample}"]`)).not.toContainText(/workbench_[a-z_]+/);
  }
});

test('reconciliation computes coherent totals and keeps all review categories when filtering', async ({ page }) => {
  await openSamples(page);
  const sample = page.locator('[data-workbench="reconciliation"]');
  await expect(sample.locator('[data-total="bookings"]')).toHaveText('€30,000');
  await expect(sample.locator('[data-total="accounting"]')).toHaveText('€27,500');
  await expect(sample.locator('[data-total="difference"]')).toHaveText('€2,500');
  await expect(sample.locator('tbody tr:visible')).toHaveCount(5);
  await expect(sample.locator('[data-record="R-103"] [data-record-accounting]')).toHaveText('Not present');
  await expect(sample.locator('[data-record="R-104"] [data-record-difference]')).toHaveText('-€4,200');
  const review = sample.locator('[data-reconciliation-filter="review"]');
  await review.focus();
  await page.keyboard.press('Enter');
  await expect(review).toBeFocused();
  await expect(review).toHaveAttribute('aria-pressed', 'true');
  expect(await sample.locator('tbody tr:visible').evaluateAll(rows => rows.map(row => row.dataset.record))).toEqual(['R-102', 'R-103', 'R-104']);
  expect(await sample.locator('tbody tr:visible [data-record-difference]').allTextContents()).toEqual(['€500', '€6,200', '-€4,200']);
  await expect(sample.locator('[data-reconciliation-count]')).toHaveText('Showing 3 review items out of 5 records');
  await expect(sample.locator('[data-total="difference"]')).toHaveText('€2,500');
  await sample.locator('[data-reconciliation-filter="all"]').click();
  await expect(sample.locator('tbody tr:visible')).toHaveCount(5);
});

test('deal history uses elapsed days and distinguishes overdue, won, and due-today deals', async ({ page }) => {
  await openSamples(page);
  const sample = page.locator('[data-workbench="history"]');
  const selector = sample.locator('select');
  const status = sample.locator('.workbench-history-summary [data-deal-status]');
  await expect(status).toHaveText('Open · 6 days overdue');
  await expect(sample.locator('[data-deal-close]')).toHaveAttribute('datetime', '2026-03-25');
  await expect(sample.locator('[data-deal-timeline] strong')).toHaveText(['Prospecting', 'Test/Demo/Meeting', 'Proposal/Price Quote']);
  expect(await sample.locator('.workbench-duration').allTextContents()).toEqual(['7 days in this stage', '9 days in this stage', '13 days in this stage so far']);
  expect(await sample.locator('[data-deal-timeline] time').evaluateAll(times => times.map(time => time.dateTime))).toEqual(['2026-03-02', '2026-03-09', '2026-03-18']);
  await selector.selectOption('D-202');
  await expect(sample).toHaveAttribute('data-deal-status', 'closed');
  await expect(status).toHaveText('Closed · no overdue flag');
  await expect(sample.locator('[data-deal-close]')).toHaveAttribute('datetime', '2026-03-20');
  await expect(sample.locator('[data-deal-timeline] strong')).toHaveText([
    'Prospecting', 'Test/Demo/Meeting', 'Proposal/Price Quote',
    'Negotiation/Review', 'Commitment', 'Closed Won',
  ]);
  await expect(sample.locator('[data-current-stage] strong')).toHaveText('Closed Won');
  expect(await sample.locator('[data-deal-timeline] time').evaluateAll(times => times.map(time => time.dateTime)))
    .toEqual(['2026-03-01', '2026-03-05', '2026-03-11', '2026-03-14', '2026-03-17', '2026-03-19']);
  expect(await sample.locator('.workbench-duration').allTextContents()).toEqual([
    '4 days in this stage', '6 days in this stage', '3 days in this stage',
    '3 days in this stage', '2 days in this stage', 'Deal completed',
  ]);
  await selector.selectOption('D-203');
  await expect(sample).toHaveAttribute('data-deal-status', 'due-today');
  await expect(status).toHaveText('Open · due today');
  await expect(sample.locator('[data-deal-close]')).toHaveText('31 Mar 2026');
  await expect(sample.locator('[data-deal-close]')).toHaveAttribute('datetime', '2026-03-31');
  await expect(sample.locator('[data-current-stage] strong')).toHaveText('Negotiation/Review');
  await expect(sample.locator('[data-current-stage] .workbench-duration')).toHaveText('7 days in this stage so far');
});

test('language switching retains the chosen filter and deal while translating dynamic results', async ({ page }) => {
  await openSamples(page);
  await page.locator('[data-reconciliation-filter="review"]').click();
  await page.locator('#workbench-deal').selectOption('D-202');
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('[data-reconciliation-filter="review"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-reconciliation-count]')).toHaveText('3 Prüffälle von 5 Datensätzen');
  await expect(page.locator('[data-record="R-103"] [data-record-accounting]')).toHaveText('Nicht vorhanden');
  await expect(page.locator('[data-total="difference"]')).toHaveText(/2\.500\s€/);
  await expect(page.locator('#workbench-deal')).toHaveValue('D-202');
  await expect(page.locator('.workbench-history-summary [data-deal-status]')).toHaveText('Abgeschlossen · nicht überfällig');
  await expect(page.locator('[data-deal-close]')).toHaveAttribute('datetime', '2026-03-20');
  await expect(page.locator('[data-deal-timeline] strong')).toHaveText([
    'Prospecting', 'Test/Demo/Meeting', 'Proposal/Price Quote',
    'Negotiation/Review', 'Commitment', 'Closed Won',
  ]);
  await expect(page.locator('[data-current-stage] strong')).toHaveText('Closed Won');
  await expect(page.locator('[data-current-stage] .workbench-duration')).toHaveText('Deal abgeschlossen');
});

test('without JavaScript the native details expose complete readable samples without inert controls', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#reconciliation-details > summary').click();
  await expect(page.locator('#reconciliation-table tbody tr:visible')).toHaveCount(5);
  await expect(page.locator('[data-total="difference"]')).toHaveText('€2,500');
  await page.locator('#pipeline-history-details > summary').click();
  await expect(page.locator('[data-deal-timeline] li:visible')).toHaveCount(3);
  await expect(page.locator('[data-workbench-controls]:visible')).toHaveCount(0);
  await expect(page.locator('[data-current-stage] strong')).toHaveText('Proposal/Price Quote');
  await expect(page.locator('[data-deal-close]')).toHaveAttribute('datetime', '2026-03-25');
  await context.close();
});

test('interactions use finite compositor animation and honour reduced motion', async ({ page }) => {
  await openSamples(page);
  await page.locator('#workbench-deal').selectOption('D-202');
  expect(await page.locator('[data-history-result]').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const motions = await page.locator('#workbench-deal').evaluate(select => {
    select.value = 'D-203';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const result = document.querySelector('[data-history-result]');
    return result.getAnimations().map(animation => {
      animation.pause();
      return { duration: animation.effect.getTiming().duration, iterations: animation.effect.getTiming().iterations, properties: animation.effect.getKeyframes().flatMap(frame => Object.keys(frame)) };
    });
  });
  expect(motions).toHaveLength(1);
  expect(motions[0].duration).toBeLessThanOrEqual(200);
  expect(motions[0].iterations).toBe(1);
  expect(motions[0].properties.every(property => ['opacity', 'transform', 'offset', 'computedOffset', 'easing', 'composite'].includes(property))).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('[data-history-result]').evaluate(element => element.getAnimations().length)).toBe(0);
});

for (const language of ['en', 'de']) {
  test(`new samples reflow at 320px with doubled ${language} text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.addInitScript(lang => localStorage.setItem('lang', lang), language);
    await openSamples(page);
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '32px';
      await document.fonts.ready;
    });
    const overflow = await page.locator('.workbench-preview, .workbench-demo, .workbench-demo h4, .workbench-controls > *, .workbench-totals > div, .workbench-table tbody tr, .workbench-table td, .workbench-timeline li, .workbench-history-summary > *').evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      return rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1 ? [element.className || element.tagName] : [];
    }));
    expect(overflow).toEqual([]);
    const captionRatio = await page.locator('#reconciliation-table').evaluate(table => table.caption.getBoundingClientRect().width / table.getBoundingClientRect().width);
    expect(captionRatio).toBeGreaterThan(.95);
    await page.locator('#workbench-deal').selectOption('D-203');
    await expect(page.locator('[data-workbench="history"]')).toHaveAttribute('data-deal-status', 'due-today');
  });
}
