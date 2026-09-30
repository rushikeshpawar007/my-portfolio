const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

// Relative bounds isolate icon/label movement from the page's native scrolling.
const geometry = link => link.evaluate(element => {
  const tile = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const leftBorder = parseFloat(style.borderLeftWidth);
  const rightBorder = parseFloat(style.borderRightWidth);
  const bounds = selector => {
    const rect = element.querySelector(selector).getBoundingClientRect();
    return { x: rect.x - tile.x, y: rect.y - tile.y, width: rect.width, height: rect.height };
  };
  return { width: tile.width, height: tile.height, center: leftBorder + (tile.width - leftBorder - rightBorder) / 2, mark: bounds('.skill-chip-icon'), label: bounds('.skill-chip-label'), caption: bounds('.skill-project-label') };
});

const backing = link => link.locator('.skill-icon-wrap').evaluate(element => {
  const style = getComputedStyle(element, '::before');
  return { width: style.width, height: style.height, radius: style.borderRadius, shadow: style.boxShadow, background: style.backgroundColor, opacity: style.opacity };
});

const allIconAppearance = page => page.locator('#skills .skill-chip').evaluateAll(elements => elements.map(element => ({
  skill: element.getAttribute('data-skill'),
  color: getComputedStyle(element.querySelector('.skill-chip-icon')).color,
  backingOpacity: getComputedStyle(element.querySelector('.skill-icon-wrap'), '::before').opacity,
})));

test('brand reveal keeps optically balanced marks in equal containers and stationary labels', async ({ page }) => {
  await page.goto('/#skills');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.logo-motion-art, [data-logo-part]')).toHaveCount(0);
  await expect(page.locator('#skills .skill-icon-wrap')).toHaveCount(23);
  const marks = await page.locator('#skills .skill-icon-wrap').evaluateAll(wrappers => wrappers.map(wrapper => {
    const mark = wrapper.querySelector('svg');
    const rect = mark.getBoundingClientRect();
    const container = wrapper.getBoundingClientRect();
    return { count: wrapper.querySelectorAll('svg').length, width: rect.width, height: rect.height, containerWidth: container.width, containerHeight: container.height };
  }));
  for (const mark of marks) {
    expect(mark.count).toBe(1);
    expect(mark.containerWidth).toBeCloseTo(52, 2);
    expect(mark.containerHeight).toBeCloseTo(52, 2);
    expect(mark.width).toBeGreaterThanOrEqual(36);
    expect(mark.width).toBeLessThanOrEqual(44);
    expect(mark.height).toBeCloseTo(mark.width, 2);
  }
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((element, value) => { element.dataset.theme = value; }, theme);
      for (const [skill, color] of [['power-bi', 'rgb(242, 200, 17)'], ['dbt', 'rgb(255, 105, 75)'], ['r', 'rgb(39, 109, 195)']]) {
        const link = page.locator(`[data-skill="${skill}"]`);
        await page.mouse.move(0, 0);
        await link.scrollIntoViewIfNeeded();
        const before = await geometry(link);
        await link.hover();
        await expect(link.locator('.skill-chip-icon')).toHaveCSS('color', color);
        await expect(link.locator('.skill-chip-icon')).toHaveCSS('transform', 'none');
        expect(await geometry(link)).toEqual(before);
        expect(before.mark.x + before.mark.width / 2).toBeCloseTo(before.center, 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

for (const theme of ['light', 'dark']) {
  test(`Power BI hover affects only its own icon and resets on mouseleave in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    await page.goto('/#skills');
    const link = page.locator('[data-skill="power-bi"]');
    await link.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const baseline = await allIconAppearance(page);
    expect(baseline).toHaveLength(23);
    expect(new Set(baseline.map(icon => icon.color)).size).toBe(1);
    expect(baseline.every(icon => icon.backingOpacity === '0')).toBe(true);
    await link.hover();
    await expect(link.locator('.skill-chip-icon')).toHaveCSS('color', 'rgb(242, 200, 17)');
    await expect.poll(async () => (await backing(link)).opacity).toBe('1');
    expect((await allIconAppearance(page)).filter(icon => icon.skill !== 'power-bi'))
      .toEqual(baseline.filter(icon => icon.skill !== 'power-bi'));
    await page.mouse.move(0, 0);
    await expect.poll(() => allIconAppearance(page)).toEqual(baseline);
  });
}

test('contrast backings stay tight and shadow-free, with no badge behind ordinary brand colours', async ({ page }) => {
  // This is a stationary hover test; native fragment scrolling is tested elsewhere.
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => { element.dataset.theme = value; }, theme);
    const skills = theme === 'light' ? ['power-bi'] : ['power-bi', 'pandas', 'aws', 'github-pages', 'excel'];
    for (const skill of skills) {
      const link = page.locator(`[data-skill="${skill}"]`);
      // Settle automatic smooth scrolling before placing a fixed mouse pointer.
      // Normal colour/backing transition durations remain enabled for this test.
      await link.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
      await link.hover();
      await expect.poll(async () => (await backing(link)).opacity).toBe('1');
      expect(await backing(link)).toEqual({
        width: '48px', height: '48px', radius: '6px', shadow: 'none', opacity: '1',
        background: skill === 'power-bi' ? 'rgb(41, 45, 41)' : 'rgb(248, 247, 244)',
      });
    }
    const dbt = page.locator('[data-skill="dbt"]');
    await dbt.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await dbt.hover();
    expect((await backing(dbt)).background).toBe('rgba(0, 0, 0, 0)');
    expect((await backing(dbt)).shadow).toBe('none');
  }
});

test('reduced motion keeps keyboard colour feedback immediate and project navigation native', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#skills');
  const link = page.locator('[data-skill="dbt"]');
  await link.scrollIntoViewIfNeeded();
  const inactivePowerBi = page.locator('[data-skill="power-bi"]');
  const inactiveColor = await inactivePowerBi.locator('.skill-chip-icon').evaluate(element => getComputedStyle(element).color);
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toHaveAccessibleName(/dbt.*Where I use it.*Deal history/);
  await expect(link.locator('.skill-chip-icon')).toHaveCSS('color', 'rgb(255, 105, 75)');
  await expect(link.locator('.skill-chip-icon')).toHaveCSS('transition-duration', '0s');
  expect(await link.locator('.skill-icon-wrap').evaluate(element => getComputedStyle(element, '::before').transitionDuration)).toBe('0s');
  expect(await link.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect((await backing(inactivePowerBi)).opacity).toBe('0');
  await expect(inactivePowerBi.locator('.skill-chip-icon')).toHaveCSS('color', inactiveColor);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#dbt-history-case-study$/);
  await expect(page.locator('#dbt-history-case-study')).toBeFocused();
  await expect(page.locator('#dbt-history-details')).toHaveAttribute('open', '');
  await expect(page.locator('.skill-chip.is-connected')).toHaveCount(0);
});

test('no JavaScript retains original marks, brand reveal and usable project links', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/#skills');
  await expect(page.locator('.logo-motion-art')).toHaveCount(0);
  const link = page.locator('[data-skill="power-bi"]');
  await expect(link.locator('.skill-chip-icon')).toBeVisible();
  await link.hover();
  await expect(link.locator('.skill-chip-icon')).toHaveCSS('color', 'rgb(242, 200, 17)');
  expect((await backing(link)).shadow).toBe('none');
  await link.click();
  await expect(page).toHaveURL(/#finance-case-study$/);
  await context.close();
});

test('touch follows a project in one tap without extra artwork or overflow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  await context.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/#skills');
  const link = page.locator('[data-skill="dbt"]');
  await expect(link.locator('.skill-project-label')).toBeVisible();
  await link.tap();
  await expect(page).toHaveURL(/#dbt-history-case-study$/);
  await expect(page.locator('#dbt-history-case-study')).toBeFocused();
  await expect(page.locator('.logo-motion-art')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
