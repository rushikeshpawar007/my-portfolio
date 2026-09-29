const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function openExplorer(page) {
  await page.goto('/');
  await page.locator('#dbt-history-details').evaluate(details => { details.open = true; });
  const explorer = page.locator('[data-lineage-explorer]');
  await expect(explorer.locator('[data-lineage-follow]')).toBeVisible();
  return explorer;
}

test('the project introduction opens the sample and moves keyboard focus to it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#dbt-history-details')).not.toHaveAttribute('open', '');
  await page.locator('a[href="#lineage-explorer"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#lineage-explorer$/);
  await expect(page.locator('#dbt-history-details')).toHaveAttribute('open', '');
  await expect(page.locator('#lineage-explorer')).toBeFocused();
  await expect(page.locator('#lineage-title')).toBeInViewport();
});

test('pipeline lineage excludes the won deal and totals one current row per deal', async ({ page }) => {
  const explorer = await openExplorer(page);
  const sample = await explorer.locator('tbody tr').evaluateAll(rows => rows.map(row => ({
    id: row.cells[0].textContent,
    stage: row.dataset.lineageStage,
    amount: Number(row.dataset.lineageAmount),
  })));
  expect(sample).toEqual([
    { id: 'D-201', stage: 'Proposal/Price Quote', amount: 18000 },
    { id: 'D-202', stage: 'Closed Won', amount: 12000 },
    { id: 'D-203', stage: 'Negotiation/Review', amount: 7000 },
  ]);
  expect(new Set(sample.map(row => row.id)).size).toBe(sample.length);
  expect(sample.filter(row => row.stage !== 'Closed Won').reduce((sum, row) => sum + row.amount, 0)).toBe(25000);
  await expect(explorer.locator('[data-lineage-total]')).toHaveText('€25,000');
  await expect(explorer.locator('.lineage-sql')).toContainText("WHERE stage <> 'Closed Won'");
  await expect(explorer.locator('[data-lineage-history]')).toContainText('not added to this current pipeline total');
});

test('keyboard tracing keeps focus, retains evidence, and highlights downstream dependencies', async ({ page }) => {
  const explorer = await openExplorer(page);
  const follow = explorer.locator('[data-lineage-follow]');
  await follow.focus();
  for (const step of [0, 1, 2]) {
    await page.keyboard.press('Enter');
    await expect(follow).toBeFocused();
    await expect(explorer).toHaveAttribute('data-lineage-active', String(step));
    await expect(explorer.locator(`[data-lineage-step="${step}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(explorer.locator('[data-lineage-panel][data-lineage-dependent="true"]')).toHaveCount(3 - step);
    await expect(explorer.locator('[data-lineage-panel]:visible')).toHaveCount(3);
    await expect(explorer.locator('tbody tr:visible')).toHaveCount(3);
  }
  const source = explorer.locator('[data-lineage-step="0"]');
  await source.focus();
  await page.keyboard.press('Space');
  await expect(source).toBeFocused();
  await expect(explorer.locator('[data-lineage-history]')).toHaveAttribute('data-lineage-dependent', 'true');
  await explorer.locator('[data-lineage-step="1"]').click();
  await expect(explorer.locator('[data-lineage-history]')).toHaveAttribute('data-lineage-dependent', 'false');
  await expect(explorer.locator('[data-lineage-status]')).toContainText('D-201 and D-203');
});

test('language switching translates labels and money without resetting the selected step', async ({ page }) => {
  const explorer = await openExplorer(page);
  await explorer.locator('[data-lineage-step="2"]').click();
  await page.locator('#lang-toggle-header').click();
  await expect(explorer).toHaveAttribute('data-lineage-active', '2');
  await expect(explorer.locator('h4')).toHaveText('Einer Kennzahl auf der Spur.');
  await expect(explorer.locator('[data-lineage-total]')).toHaveText(/25\.000\s€/);
  await expect(explorer.locator('[data-lineage-follow]')).toHaveText('Erneut nachverfolgen ↺');
  await expect(explorer.locator('[data-lineage-status]')).toContainText('zwei aktuelle Deal-Datensätze');
  await expect(explorer.locator('tbody tr').nth(1)).toContainText('Ausgeschlossen');
});

test('without JavaScript the disclosure exposes the full explanation and no inert controls', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#dbt-history-details > summary').click();
  const explorer = page.locator('[data-lineage-explorer]');
  await expect(explorer.locator('tbody tr:visible')).toHaveCount(3);
  await expect(explorer.locator('[data-lineage-total]')).toHaveText('€25,000');
  await expect(explorer.locator('.lineage-sql')).toBeVisible();
  await expect(explorer.locator('[data-lineage-controls]')).toBeHidden();
  await expect(explorer).toContainText('Fictional three-deal sample');
  await context.close();
});

test('tracing uses finite transform/opacity motion and cancels on reduced motion and disclosure close', async ({ page }) => {
  const explorer = await openExplorer(page);
  const follow = explorer.locator('[data-lineage-follow]');
  await follow.click();
  // Theme colour transitions may briefly exist even with reduced motion.
  // Inspect the explorer's scripted motion separately from those CSS effects.
  expect(await explorer.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.constructor.name === 'Animation').length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await explorer.scrollIntoViewIfNeeded();
  const motions = await explorer.evaluate(element => {
    element.querySelector('[data-lineage-step="0"]').click();
    return element.getAnimations({ subtree: true }).filter(animation => animation.constructor.name === 'Animation').map(animation => {
      animation.pause();
      return { duration: animation.effect.getTiming().duration, iterations: animation.effect.getTiming().iterations, properties: animation.effect.getKeyframes().flatMap(frame => Object.keys(frame)) };
    });
  });
  expect(motions).toHaveLength(3);
  for (const motion of motions) {
    expect(motion.duration).toBeLessThanOrEqual(200);
    expect(motion.iterations).toBe(1);
    expect(motion.properties.every(property => ['opacity', 'transform', 'offset', 'computedOffset', 'easing', 'composite'].includes(property))).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => explorer.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.constructor.name === 'Animation').length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await explorer.evaluate(element => {
    element.querySelector('[data-lineage-step="0"]').click();
    element.getAnimations({ subtree: true }).filter(animation => animation.constructor.name === 'Animation').forEach(animation => animation.pause());
    element.closest('details').open = false;
  });
  await expect.poll(() => explorer.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.constructor.name === 'Animation').length)).toBe(0);
});

for (const language of ['en', 'de']) {
  test(`lineage fits a 320px viewport with doubled ${language} text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.addInitScript(lang => localStorage.setItem('lang', lang), language);
    const explorer = await openExplorer(page);
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '32px';
      await document.fonts.ready;
    });
    const overflow = await explorer.locator('.lineage-panel, .lineage-panel h5, .lineage-sql, .lineage-follow, .lineage-steps button').evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1 ? [element.className] : [];
    }));
    expect(overflow).toEqual([]);
  });
}
