const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

const iconAppearance = chips => chips.evaluateAll(elements => elements.map(element => ({
  skill: element.getAttribute('data-skill'),
  color: getComputedStyle(element.querySelector('.skill-chip-icon')).color,
  backingOpacity: getComputedStyle(element.querySelector('.skill-icon-wrap'), '::before').opacity,
})));

test('keyboard exploration shows project context without colouring other tools and reaches the chosen case', async ({ page }) => {
  await page.goto('/#skills');
  const dbt = page.locator('a.skill-chip[data-skill="dbt"]');
  const group = dbt.locator('xpath=ancestor::div[contains(@class, "skill-group")]');
  const initialHeight = (await group.boundingBox()).height;
  const otherTools = page.locator('.skill-chip:not([data-skill="dbt"])');
  const otherAppearance = await iconAppearance(otherTools);
  await dbt.focus();
  await expect(dbt.locator('.skill-project-label')).toHaveCSS('opacity', '1');
  await expect(group.locator('[data-skill-connection]')).toHaveText('Salesforce → dbt on Athena → Power BI · Deal history');
  expect(await iconAppearance(otherTools)).toEqual(otherAppearance);
  expect(otherAppearance.every(icon => icon.backingOpacity === '0')).toBe(true);
  expect((await group.boundingBox()).height).toBe(initialHeight);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#dbt-history-case-study$/);
  await expect(page.locator('#dbt-history-case-study')).toBeFocused();
  await expect(page.locator('#dbt-history-details')).toHaveAttribute('open', '');
  expect(await iconAppearance(otherTools)).toEqual(otherAppearance);
});

test('German stack context and project labels remain localized without grid movement', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('/#skills');
  const n8n = page.locator('a.skill-chip[data-skill="n8n"]');
  const group = n8n.locator('xpath=ancestor::div[contains(@class, "skill-group")]');
  const initialHeight = (await group.boundingBox()).height;
  const otherTools = page.locator('.skill-chip:not([data-skill="n8n"])');
  const otherAppearance = await iconAppearance(otherTools);
  await n8n.hover();
  await expect(n8n).toHaveAccessibleName(/Hier setze ich es ein.*Finanz-Chatbot/);
  await expect(group.locator('[data-skill-connection]')).toHaveText('Power BI → n8n → RAG / LLMs · Finanzfragen');
  expect(await iconAppearance(otherTools)).toEqual(otherAppearance);
  expect(otherAppearance.every(icon => icon.backingOpacity === '0')).toBe(true);
  expect((await group.boundingBox()).height).toBe(initialHeight);
  await page.mouse.move(0, 0);
  await expect(group.locator('.skill-note')).toBeVisible();
  expect(await iconAppearance(otherTools)).toEqual(otherAppearance);
});

test('touch visitors see project names and navigate with one tap', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/#skills');
  const python = page.locator('a.skill-chip[data-skill="python"]');
  await expect(python.locator('.skill-project-label')).toHaveCSS('opacity', '1');
  await python.tap();
  await expect(page).toHaveURL(/#invoice-case-study$/);
  await expect(page.locator('#invoice-case-study')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('project links remain usable without JavaScript and unsupported cases are not invented', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/#skills');
  await expect(page.locator('#skills .skill-chip-icon')).toHaveCount(23);
  for (const skill of ['bigquery', 'airflow', 'claude-code', 'pandas', 'power-query']) {
    await expect(page.locator(`.skill-chip[data-skill="${skill}"]`)).not.toHaveAttribute('href');
  }
  await page.locator('a.skill-chip[data-skill="tableau"]').click();
  await expect(page).toHaveURL(/#spotify-case-study$/);
  await expect(page.locator('#spotify-case-study-title')).toBeInViewport();
  await context.close();
});
