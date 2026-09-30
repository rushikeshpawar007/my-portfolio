const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

test('every referenced icon resolves to one nonempty local symbol', async ({ page }) => {
  await page.goto('/');
  const issues = await page.locator('svg use').evaluateAll(uses => uses.flatMap(use => {
    const ref = use.getAttribute('href');
    if (!ref || !ref.startsWith('#')) return [`Nonlocal icon reference: ${ref}`];
    const symbols = document.querySelectorAll(`symbol[id="${ref.slice(1)}"]`);
    return symbols.length === 1 && symbols[0].querySelector('path[d]')
      ? [] : [`Missing, duplicated, or empty symbol: ${ref}`];
  }));
  expect(issues).toEqual([]);
});

test('icon artwork fits its viewport, including file labels and gear teeth', async ({ page }) => {
  await page.goto('/');
  const clipped = await page.locator('[data-icon-sprite] symbol').evaluateAll(symbols => symbols.flatMap(symbol => {
    // Measure rendered geometry in an attached SVG; hidden symbol definitions
    // alone do not consistently expose their bounds across browser engines.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));
    svg.replaceChildren(...[...symbol.children].map(child => child.cloneNode(true)));
    document.body.append(svg);
    const bounds = svg.getBBox();
    const viewport = svg.viewBox.baseVal;
    // Imported path coordinates can overshoot by hundredths of a unit because
    // of rounded Bézier control points (less than 0.01px at display size).
    const tolerance = 0.15;
    const fits = bounds.width > 0 && bounds.height > 0
      && bounds.x >= viewport.x - tolerance
      && bounds.y >= viewport.y - tolerance
      && bounds.x + bounds.width <= viewport.x + viewport.width + tolerance
      && bounds.y + bounds.height <= viewport.y + viewport.height + tolerance;
    svg.remove();
    return fits ? [] : [symbol.id];
  }));
  expect(clipped).toEqual([]);
});

test('social and mobile navigation icons retain meaningful accessible labels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const links = page.locator('.footer-social, #bottom-nav a');
  await expect(links).toHaveCount(9);
  for (const link of await links.all()) {
    await expect(link).toHaveAccessibleName(/\S/);
    await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  }
});

test('decorative icons stay out of the accessibility tree after the demo opens', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-i18n-key="demo_open"]').click();
  await expect(page.locator('.prompt-button').first()).toBeVisible();
  const exposed = await page.locator('svg').evaluateAll(icons => icons
    .filter(icon => icon.getAttribute('aria-hidden') !== 'true'
      || icon.getAttribute('focusable') !== 'false'
      || (icon.hasAttribute('tabindex') && icon.getAttribute('tabindex') !== '-1'))
    .map(icon => icon.id || icon.outerHTML.slice(0, 100)));
  expect(exposed).toEqual([]);
  for (const prompt of await page.locator('.prompt-button').all()) {
    await expect(prompt).toHaveAccessibleName(await prompt.locator('span').textContent());
  }
});
