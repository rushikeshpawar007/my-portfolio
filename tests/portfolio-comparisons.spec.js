const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('budget periods calculate positive and negative revenue variance using the budget base', async ({ page }) => {
  await page.goto('/#report-details');
  await page.locator('#report-analysis-details > summary').click();
  const example = page.locator('[data-analysis-example="budget"]');
  await expect(example).toBeVisible();
  await expect(example).toContainText('Fictional sample');
  await expect(example.locator('[data-budget-plan]')).toHaveText('€100,000');
  await expect(example.locator('[data-budget-actual]')).toHaveText('€112,000');
  await expect(example.locator('[data-budget-insight]')).toHaveText('Revenue is €12,000 above budget (12.0%).');
  const highlight = example.locator('[data-budget-explain]');
  const gap = example.locator('[data-budget-gap]');
  await highlight.focus();
  await page.keyboard.press('Enter');
  await expect(highlight).toBeFocused();
  await expect(highlight).toHaveAttribute('aria-pressed', 'true');
  await expect(gap).toHaveCSS('opacity', '1');
  expect(await gap.evaluate(element => parseFloat(element.style.left))).toBeCloseTo(83.3333, 3);
  expect(await gap.evaluate(element => parseFloat(element.style.width))).toBe(10);
  await page.locator('#budget-period').selectOption('feb');
  await expect(example.locator('[data-budget-plan]')).toHaveText('€108,000');
  await expect(example.locator('[data-budget-actual]')).toHaveText('€96,000');
  await expect(example.locator('[data-budget-insight]')).toHaveText('Revenue is €12,000 below budget (11.1%).');
  await expect(example.locator('[data-budget-bar="actual"]')).toHaveCSS('transform', 'matrix(0.8, 0, 0, 1, 0, 0)');
  expect(await gap.evaluate(element => parseFloat(element.style.left))).toBe(80);
  expect(await gap.evaluate(element => parseFloat(element.style.width))).toBe(10);
  await page.locator('#lang-toggle-header').click();
  await expect(example.locator('[data-budget-period]')).toHaveText('Februar 2026');
  await expect(example.locator('[data-budget-insight]')).toContainText('12.000');
  await expect(example.locator('[data-budget-insight]')).toContainText('11,1');
  await expect(example.locator('[data-budget-insight]')).toContainText('unter dem Plan');
  await expect(page.locator('#budget-period')).toHaveValue('feb');
  await expect(highlight).toHaveText('Hervorhebung ausblenden');
  await expect(highlight).toHaveAttribute('aria-pressed', 'true');
  await highlight.click();
  await expect(gap).toHaveCSS('opacity', '0');
});

test('regional selection preserves comparable source rows and labels independent units', async ({ page }) => {
  await page.goto('/#cariad-role-details');
  const example = page.locator('[data-analysis-example="regional"]');
  await expect(example).toBeVisible();
  await expect(example).toContainText('no Volkswagen data');
  await expect(example.locator('tbody tr')).toHaveCount(3);
  await page.locator('#analysis-region').selectOption('central');
  await expect(example.locator('[data-region-row="central"]')).toHaveClass('is-selected');
  await expect(example.locator('[data-region-row="north"]')).not.toHaveClass('is-selected');
  await expect(example.locator('[data-region-insight]')).toHaveText('Central: €2,500 average incentive per vehicle, alongside 135 vehicles sold.');
  await expect(example.locator('.analysis-method')).toContainText('does not establish that incentives caused sales');
  await page.locator('#lang-toggle-header').click();
  await expect(example.locator('[data-region-insight]')).toContainText('Mitte:');
  await expect(example.locator('[data-region-insight]')).toContainText('2.500');
  await expect(page.locator('#analysis-region')).toHaveValue('central');
});

test('new analysis examples retain complete source values and hide inactive controls without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173');
  await page.locator('#report-details > summary').click();
  await page.locator('#report-analysis-details > summary').click();
  await expect(page.locator('[data-analysis-example="budget"]')).toBeVisible();
  await expect(page.locator('[data-budget-insight]')).toContainText('€12,000 above budget');
  await expect(page.locator('#budget-period')).toBeHidden();
  await expect(page.locator('[data-budget-explain]')).toBeHidden();
  await page.locator('#cariad-role-details > summary').click();
  await expect(page.locator('[data-analysis-example="regional"] tbody tr')).toHaveCount(3);
  await expect(page.locator('#analysis-region')).toBeHidden();
  await context.close();
});

test('general CV is downloadable and languages and analyst skills are present', async ({ page, request }) => {
  await page.goto('/');
  const link = page.locator('[data-i18n-key="resume_button"]');
  await expect(link).toHaveAttribute('href', 'assets/documents/Rushikesh_Pawar_CV.pdf');
  await expect(link).toHaveAttribute('download', 'Rushikesh_Pawar_CV.pdf');
  const response = await request.get('/assets/documents/Rushikesh_Pawar_CV.pdf');
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.locator('.profile-languages')).toContainText('German · B1');
  for (const skill of ['dbt', 'Power Query', 'Excel', 'pandas']) {
    await expect(page.locator('.skill-chip-label').filter({ hasText: new RegExp('^' + skill + '$') })).toBeVisible();
  }
});

test('comparison values remain within narrow containers with doubled German text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('/');
  await page.evaluate(async () => {
    document.documentElement.style.fontSize = '32px';
    document.querySelector('#report-details').open = true;
    document.querySelector('#report-analysis-details').open = true;
    document.querySelector('#cariad-role-details').open = true;
    await document.fonts.ready;
  });
  for (const selector of ['[data-analysis-example="budget"]', '[data-analysis-example="regional"]']) {
    const example = page.locator(selector);
    await example.scrollIntoViewIfNeeded();
    const innerWidth = await example.evaluate(element => element.clientWidth - parseFloat(getComputedStyle(element).paddingLeft) - parseFloat(getComputedStyle(element).paddingRight));
    expect(innerWidth).toBeGreaterThan(175);
    const overflow = await example.locator('select, .analysis-bar-label, .analysis-insight, td, .analysis-method').evaluateAll(elements => elements.filter(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width && (bounds.right > innerWidth + 1 || bounds.left < -1 || element.scrollWidth > element.clientWidth + 1);
    }).map(element => element.className));
    expect(overflow).toEqual([]);
  }
});
