const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}

async function summaryVisibility(summary) {
  return summary.evaluate(element => {
    const box = element.getBoundingClientRect();
    const header = document.querySelector('header').getBoundingClientRect();
    return { inViewport: box.top >= header.bottom && box.bottom <= innerHeight, hit: element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) };
  });
}

test('project titles share one role and each card tells the same sequence', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#projects > h2')).toContainText('Selected work');
  const cards = await page.locator('#projects article').evaluateAll(articles => articles.map(article => {
    const selectors = ['.project-meta, .project-kicker', '.project-title', '.project-outcome', '.project-description'];
    if (article.querySelector('.project-tools')) selectors.push('.project-tools');
    selectors.push('.case-details > summary');
    const fields = selectors.map(selector => article.querySelector(selector));
    const title = article.querySelector('.project-title');
    const style = getComputedStyle(title);
    return {
      id: article.id,
      missing: selectors.filter((_, index) => !fields[index]),
      ordered: fields.every((element, index) => index === 0 || (element && fields[index - 1] && Boolean(fields[index - 1].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))),
      title: { tag: title.tagName, family: style.fontFamily, size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight },
      bodySize: parseFloat(getComputedStyle(article.querySelector('.project-description')).fontSize),
    };
  }));
  expect(cards).toHaveLength(7);
  await expect(page.locator('#royalty-case-study .project-tools')).toHaveText('R · SQL');
  for (const card of cards) {
    expect(card.missing, card.id).toEqual([]);
    expect(card.ordered, card.id).toBe(true);
    expect(card.title, card.id).toEqual(cards[0].title);
    expect(card.title.tag).toBe('H3');
    expect(parseFloat(card.title.size), card.id).toBeGreaterThan(card.bodySize * 1.3);
    expect(card.bodySize, card.id).toBeGreaterThanOrEqual(16);
  }
  const headingSkips = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll(headings => headings.flatMap((heading, index) => index && Number(heading.tagName.slice(1)) > Number(headings[index - 1].tagName.slice(1)) + 1 ? [heading.textContent.trim()] : []));
  expect(headingSkips).toEqual([]);
});

test('category navigation is distinct from project content and still opens the correct work', async ({ page }) => {
  await ready(page);
  await expect(page.locator('.project-route a > span:last-child')).toHaveText(['Reporting', 'Data quality', 'Automation']);
  await expect(page.locator('.project-chapter')).toHaveCount(0);
  for (const link of await page.locator('.project-route a').all()) {
    const target = await link.getAttribute('href');
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    const state = await page.locator(target).evaluate(element => {
      const card = element.closest('article');
      const title = card.querySelector('h3').getBoundingClientRect();
      return { exists: Boolean(card), titleVisible: title.top >= document.querySelector('header').getBoundingClientRect().bottom && title.top < innerHeight };
    });
    expect(state, target).toEqual({ exists: true, titleVisible: true });
  }
});

test('every case study describes its action and keeps keyboard focus when collapsed', async ({ page }) => {
  await ready(page);
  const details = page.locator('#projects details.case-details');
  await expect(details).toHaveCount(7);
  for (const panel of await details.all()) {
    const summary = panel.locator(':scope > summary');
    const label = await summary.getAttribute('aria-describedby');
    expect(label).toBeTruthy();
    await expect(page.locator(`#${label}`)).toHaveCount(1);
    await expect(summary.locator('.detail-read')).toHaveText('Show project details');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toHaveAttribute('open', '');
    await expect(summary.locator('.detail-close')).toBeVisible();
    await expect(summary.locator('.detail-close')).toHaveText('Hide project details');
    const focus = await summary.evaluate(element => ({ width: parseFloat(getComputedStyle(element).outlineWidth), style: getComputedStyle(element).outlineStyle }));
    expect(focus.width).toBeGreaterThanOrEqual(2);
    expect(focus.style).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(panel).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
  }
});

for (const width of [390, 1440]) {
  for (const language of ['en', 'de']) {
    test(`seven full-width projects keep their primary stories visible with details closed at ${width}px in ${language}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(value => localStorage.setItem('lang', value), language);
      await ready(page);
      const articles = page.locator('#projects article');
      await expect(articles).toHaveCount(7);
      await expect(page.locator('#projects details[open]')).toHaveCount(0);
      const previews = [];
      for (const article of await articles.all()) {
        const preview = article.locator('[data-project-preview]').first();
        await preview.scrollIntoViewIfNeeded();
        await expect(preview).toBeVisible();
        await expect(preview).toHaveAttribute('data-preview-state', 'complete');
        await expect(preview.locator('[data-preview-toggle]')).toHaveCount(1);
        expect(await preview.evaluate(element => Boolean(element.closest('details')))).toBe(false);
        previews.push(await preview.getAttribute('data-project-preview'));
      }
      expect(previews).toEqual(['report', 'reconciliation', 'deal-history', 'royalty', 'chat', 'invoice', 'spotify']);
      await expect(page.locator('#projects details[open]')).toHaveCount(0);
      const layout = await page.evaluate(() => {
        const grid = document.querySelector('#projects .bento-grid').getBoundingClientRect();
        const projects = [...document.querySelectorAll('#projects article')].map(article => {
          const box = article.getBoundingClientRect();
          const preview = article.querySelector('[data-project-preview]').getBoundingClientRect();
          const copy = article.querySelector('.project-intro').getBoundingClientRect();
          const action = article.querySelector('.case-details > summary').getBoundingClientRect();
          return { id: article.id, top: box.top, bottom: box.bottom, left: box.left, right: box.right, contentBottom: Math.max(preview.bottom, copy.bottom), actionTop: action.top };
        });
        const copy = document.querySelector('.feature-copy').getBoundingClientRect();
        const visual = document.querySelector('.report-comparison').getBoundingClientRect();
        return { left: grid.left, right: grid.right, projects, featuredTopDifference: Math.abs(copy.top - visual.top) };
      });
      for (const [index, project] of layout.projects.entries()) {
        expect(Math.abs(project.left - layout.left), project.id).toBeLessThan(2);
        expect(Math.abs(project.right - layout.right), project.id).toBeLessThan(2);
        expect(project.actionTop, project.id).toBeGreaterThanOrEqual(project.contentBottom - 1);
        if (index) expect(project.top, project.id).toBeGreaterThanOrEqual(layout.projects[index - 1].bottom);
      }
      if (width === 1440) expect(layout.featuredTopDifference).toBeLessThan(2);
    });
  }
}

for (const width of [768, 1440]) {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    test(`expanded cases use the reading width without losing their control at ${width}px (${reducedMotion})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion });
      await ready(page);
      // Both analytical cases keep their full reading width and usable controls.
      for (const id of ['reconciliation-details', 'pipeline-history-details']) {
        const panel = page.locator('#' + id);
        const summary = panel.locator(':scope > summary');
        const visibility = () => summaryVisibility(summary);
        for (const input of ['mouse', 'keyboard']) {
          await summary.scrollIntoViewIfNeeded();
          if (input === 'keyboard') await summary.focus();
          if (input === 'mouse') await summary.click(); else await page.keyboard.press('Enter');
          await expect(panel).toHaveAttribute('open', '');
          await expect(panel).not.toHaveAttribute('data-disclosure-state');
          await expect.poll(visibility, { message: `${id} remains usable after ${input} opening` }).toEqual({ inViewport: true, hit: true });
          const widths = await panel.evaluate(element => ({ body: element.querySelector('.case-body').getBoundingClientRect().width, grid: element.closest('.bento-grid').getBoundingClientRect().width }));
          expect(widths.body).toBeGreaterThan(widths.grid * .9);
          // Click the actual current position: locator.click() would scroll away a regression.
          if (input === 'mouse') {
            const bounds = await summary.boundingBox();
            await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
          } else await page.keyboard.press('Enter');
          await expect(panel).not.toHaveAttribute('open');
          await expect(panel).not.toHaveAttribute('data-disclosure-state');
          await expect.poll(visibility, { message: `${id} remains usable after ${input} closing` }).toEqual({ inViewport: true, hit: true });
          await expect(summary).toBeFocused();
        }
      }
    });
  }
}

for (const fallback of ['without JavaScript', 'without the animation API']) {
  test(`case controls remain reachable ${fallback}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', javaScriptEnabled: fallback !== 'without JavaScript' });
    try {
      await context.addInitScript(() => {
        localStorage.setItem('cookie-consent', 'denied');
        Element.prototype.animate = undefined;
      });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4173/');
      await page.evaluate(() => document.fonts.ready);
      for (const id of ['reconciliation-details', 'pipeline-history-details']) {
        const panel = page.locator('#' + id);
        const summary = panel.locator(':scope > summary');
        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(panel).toHaveAttribute('open', '');
        await expect.poll(() => summaryVisibility(summary)).toEqual({ inViewport: true, hit: true });
        await page.keyboard.press('Enter');
        await expect(panel).not.toHaveAttribute('open');
        await expect.poll(() => summaryVisibility(summary)).toEqual({ inViewport: true, hit: true });
        await expect(summary).toBeFocused();
      }
    } finally {
      await context.close();
    }
  });
}

test('scrolling during a case expansion is not pulled back to the control', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page);
  const panel = page.locator('#reconciliation-details');
  const summary = panel.locator(':scope > summary');
  await summary.focus();
  await panel.evaluate(element => element.addEventListener('click', () => element.getAnimations()[0]?.pause(), { once: true }));
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-disclosure-state', 'opening');
  const start = await page.evaluate(() => window.scrollY);
  await page.mouse.move(1400, 500);
  await page.mouse.wheel(0, 250);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(start + 250);
  await panel.evaluate(element => element.getAnimations()[0].finish());
  await expect(panel).not.toHaveAttribute('data-disclosure-state');
  expect(await page.evaluate(() => window.scrollY)).toBe(start + 250);
});

for (const width of [390, 768, 1440]) {
  for (const language of ['en', 'de']) {
    test(`shared layout fits ${width}px in ${language}, including an open case study`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(value => localStorage.setItem('lang', value), language);
      await ready(page);
      await page.locator('#reconciliation-details > summary').click();
      const layout = await page.evaluate(() => {
        const selectors = ['main > section', '#projects article', '.project-title', '.project-description', '.project-outcome', '.case-details > summary', '.experience-header', '.skill-matrix', '#contact-form'];
        const outside = [...document.querySelectorAll(selectors.join(','))].flatMap(element => {
          const box = element.getBoundingClientRect();
          if (!box.width || !box.height) return [];
          return box.left < -1 || box.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1 ? [element.id || element.className] : [];
        });
        const sections = [...document.querySelectorAll('main > section:not(#hero):not(#impact)')].map(element => element.getBoundingClientRect());
        const controls = [...document.querySelectorAll('.case-details > summary')].map(element => element.getBoundingClientRect().height);
        return { width: document.documentElement.scrollWidth, outside, leftEdges: sections.map(box => box.left), rightEdges: sections.map(box => box.right), controls };
      });
      expect(layout.width).toBeLessThanOrEqual(width);
      expect(layout.outside).toEqual([]);
      expect(Math.max(...layout.leftEdges) - Math.min(...layout.leftEdges)).toBeLessThan(2);
      expect(Math.max(...layout.rightEdges) - Math.min(...layout.rightEdges)).toBeLessThan(2);
      for (const height of layout.controls) expect(height).toBeGreaterThanOrEqual(44);
    });
  }
}

for (const theme of ['light', 'dark']) {
  test(`primary reading roles and actions retain readable contrast in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    await ready(page);
    const samples = await page.locator('.hero-role, .hero-tagline, .hero-context, .section-title, .section-intro, .project-title, .project-meta, .project-kicker, .project-outcome, .project-description, .project-tools, .case-details > summary, .form-label, .ios-button').evaluateAll(elements => {
      const parse = color => (color.match(/[\d.]+/g) || []).map(Number);
      const luminance = rgb => rgb.slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
      return elements.flatMap(element => {
        if (!element.getBoundingClientRect().height) return [];
        const style = getComputedStyle(element);
        let background;
        for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
          const value = parse(getComputedStyle(ancestor).backgroundColor);
          if (value.length === 3 || value[3] === 1) { background = value; break; }
        }
        if (!background) return [{ text: element.textContent.trim().slice(0, 60), ratio: 0, required: 4.5 }];
        const fg = luminance(parse(style.color)), bg = luminance(background);
        const size = parseFloat(style.fontSize), weight = Number(style.fontWeight);
        return [{ text: element.textContent.trim().slice(0, 60), ratio: (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05), required: size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5 }];
      });
    });
    expect(samples.length).toBeGreaterThan(30);
    for (const sample of samples) expect(sample.ratio, sample.text).toBeGreaterThanOrEqual(sample.required);
  });
}
