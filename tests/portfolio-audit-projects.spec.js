const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

const scriptedMotions = root => root.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.constructor.name === 'Animation').length);

test('lineage controls keep working when visibility observation is unavailable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => { if (error.stack?.includes('lineage-explorer.js')) errors.push(error.message); });
  await page.addInitScript(() => { window.IntersectionObserver = undefined; });
  await page.goto('/');
  await page.locator('#dbt-history-details').evaluate(details => { details.open = true; });
  const explorer = page.locator('[data-lineage-explorer]');
  await expect(explorer.locator('[data-lineage-follow]')).toBeVisible();
  await explorer.locator('[data-lineage-follow]').click();
  await expect(explorer).toHaveAttribute('data-lineage-active', '0');
  await expect(explorer.locator('[data-lineage-total]')).toHaveText('€25,000');
  expect(await scriptedMotions(explorer)).toBe(0);
  expect(errors).toEqual([]);
});

test('print media settles short sample animations and keeps subsequent changes static', async ({ page }) => {
  await page.goto('/');
  await page.locator('#reconciliation-details').evaluate(details => { details.open = true; });
  const exercise = page.locator('[data-cleaning]');
  await exercise.scrollIntoViewIfNeeded();
  await exercise.evaluate(element => {
    element.querySelector('[data-cleaning-select="1"]').click();
    element.querySelector('[data-cleaning-result]').getAnimations().forEach(animation => animation.pause());
  });
  expect(await scriptedMotions(exercise)).toBe(1);
  await page.emulateMedia({ media: 'print' });
  await expect.poll(() => scriptedMotions(exercise)).toBe(0);
  for (const selector of ['[data-cleaning-select="2"]', '[data-reconciliation-filter="review"]', '[data-lineage-step="1"]']) {
    await page.locator(selector).evaluate(element => { element.click(); });
  }
  await page.locator('#workbench-deal').evaluate(select => {
    select.value = 'D-202';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  for (const selector of ['[data-cleaning]', '[data-workbench="reconciliation"]', '[data-workbench="history"]', '[data-lineage-explorer]']) {
    expect(await scriptedMotions(page.locator(selector))).toBe(0);
  }
  await expect(page.locator('[data-cleaning]')).toHaveAttribute('data-cleaning-step', '2');
  await expect(page.locator('[data-workbench="history"]')).toHaveAttribute('data-deal-status', 'closed');
});

test('closing an example cancels its motion and selecting the active filter does not replay it', async ({ page }) => {
  await page.goto('/#reconciliation-case-study');
  const example = page.locator('[data-workbench="reconciliation"]');
  await example.locator('[data-reconciliation-filter="all"]').click();
  expect(await scriptedMotions(example)).toBe(0);
  await example.evaluate(element => {
    element.querySelector('[data-reconciliation-filter="review"]').click();
    element.querySelector('[data-reconciliation-result]').getAnimations().forEach(animation => animation.pause());
    element.closest('details').open = false;
  });
  await expect.poll(() => scriptedMotions(example)).toBe(0);
});

test('Power BI context describes the same case as its visible destination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#skills');
  const link = page.locator('a[data-skill="power-bi"]');
  await link.focus();
  await expect(link).toHaveAttribute('href', '#finance-case-study');
  await expect(link.locator('xpath=ancestor::div[contains(@class, "skill-group")]').locator('[data-skill-connection]')).toHaveText('Where I use it · Month-end reports');
});

for (const lang of ['en', 'de']) {
  test(`every skill and employer link reaches its visible destination with ${lang} keyboard navigation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(language => localStorage.setItem('lang', language), lang);
    await page.goto('/');
    const links = page.locator('a.skill-project-link, a.career-stop');
    expect(await links.count()).toBe(17);
    for (const link of await links.all()) {
      const hash = await link.getAttribute('href');
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
      await expect(page.locator(hash)).toBeFocused();
      await expect(page.locator(hash)).toBeInViewport();
    }
  });
}
