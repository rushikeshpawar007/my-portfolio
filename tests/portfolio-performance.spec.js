const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

async function useProgressFallback(page) {
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    CSS.supports = (...args) => args.some(value => value.includes('animation-timeline')) ? false : supports(...args);
  });
}

async function openPortfolio(page, fallback, url = '/') {
  if (fallback) await useProgressFallback(page);
  await page.goto(url);
  if (fallback) {
    // Match an engine without the CSS feature as well as its JS detection.
    await page.addStyleTag({ content: '#read-progress, #folio-progress { animation: none !important; }' });
  }
  await page.evaluate(() => document.fonts.ready);
}

async function progressState(page) {
  return page.evaluate(() => {
    const range = document.documentElement.scrollHeight - innerHeight;
    return {
      expected: range > 0 ? scrollY / range : 0,
      reading: new DOMMatrixReadOnly(getComputedStyle(document.getElementById('read-progress')).transform).a,
      folio: new DOMMatrixReadOnly(getComputedStyle(document.getElementById('folio-progress')).transform).d,
      range,
    };
  });
}

async function expectAccurateProgress(page) {
  await expect.poll(async () => {
    const state = await progressState(page);
    return Math.max(Math.abs(state.reading - state.expected), Math.abs(state.folio - state.expected));
  }).toBeLessThan(0.003);
}

for (const fallback of [false, true]) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    test(`${fallback ? 'fallback' : 'native'} progress tracks top, middle, and end with ${reducedMotion} motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await openPortfolio(page, fallback);
      if (!fallback) expect(await page.evaluate(() => CSS.supports('animation-timeline: scroll(root block)'))).toBe(true);
      for (const fraction of [0, 0.5, 1]) {
        await page.evaluate(value => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * value, behavior: 'instant' }), fraction);
        await expectAccurateProgress(page);
        const state = await progressState(page);
        expect(state.expected).toBeCloseTo(fraction, 2);
      }
    });
  }
}

test('scrolling does not rewrite root styles or settled controls, and native indicators need no DOM writes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPortfolio(page, false);
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
  await expect(page.locator('header')).toHaveClass(/scrolled/);
  await expect(page.locator('#scrollTopBtn')).toBeVisible();
  const mutations = await page.evaluate(async () => {
    const counts = { root: 0, reading: 0, folio: 0, header: 0, top: 0 };
    const selectors = { root: 'html', reading: '#read-progress', folio: '#folio-progress', header: 'header', top: '#scrollTopBtn' };
    const observers = Object.entries(selectors).map(([name, selector]) => {
      const observer = new MutationObserver(records => { counts[name] += records.length; });
      observer.observe(document.querySelector(selector), { attributes: true, attributeFilter: [name === 'header' ? 'class' : 'style'] });
      return observer;
    });
    for (const y of [1100, 1300, 1500, 1700, 1900]) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    observers.forEach(observer => observer.disconnect());
    return counts;
  });
  expect(mutations).toEqual({ root: 0, reading: 0, folio: 0, header: 0, top: 0 });
});

test('the masthead keeps its height when the page starts scrolling', async ({ page }) => {
  await openPortfolio(page, false);
  const initialHeight = await page.locator('header').evaluate(el => el.getBoundingClientRect().height);
  await page.evaluate(() => window.scrollTo({ top: 80, behavior: 'instant' }));
  await expect(page.locator('header')).toHaveClass(/scrolled/);
  await expect.poll(() => page.locator('header').evaluate(el => el.getBoundingClientRect().height)).toBe(initialHeight);
  // Check after the former padding-transition duration as well as at its start.
  await page.waitForTimeout(300);
  expect(await page.locator('header').evaluate(el => el.getBoundingClientRect().height)).toBe(initialHeight);
});

test('fallback progress refreshes its range after disclosure, language, and viewport changes', async ({ page }) => {
  await openPortfolio(page, true);
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
  await expectAccurateProgress(page);
  const before = await progressState(page);
  await page.locator('#report-details > summary').evaluate(el => el.click());
  await expect(page.locator('#report-details')).toHaveAttribute('open', '');
  await expect(page.locator('#report-details')).not.toHaveAttribute('data-disclosure-state');
  await expectAccurateProgress(page);
  expect((await progressState(page)).range).toBeGreaterThan(before.range);
  await page.locator('#lang-toggle-header').evaluate(el => el.click());
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expectAccurateProgress(page);
  await page.setViewportSize({ width: 1280, height: 700 });
  await expectAccurateProgress(page);
  await page.locator('#report-details > summary').evaluate(el => el.click());
  await expect(page.locator('#report-details')).not.toHaveAttribute('open');
  await expectAccurateProgress(page);
  expect(await page.locator('html').getAttribute('style')).toBeNull();
});

test('fallback progress initializes correctly on a deep link with expanded content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPortfolio(page, true, '/#royalty-case-study');
  await expect(page.locator('#royalty-case-study-details')).toHaveAttribute('open', '');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expectAccurateProgress(page);
});
