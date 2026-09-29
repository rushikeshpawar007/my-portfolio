const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

async function revealContent(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('details').forEach(details => { details.open = true; });
    await document.fonts.ready;
  });
}

async function expectReadableSize(page, selector, minimum) {
  const content = await page.locator(selector).evaluateAll(elements => elements.map(element => ({
    text: element.textContent.trim().slice(0, 80),
    size: parseFloat(getComputedStyle(element).fontSize),
  })));
  expect(content.length, `${selector} should identify real content`).toBeGreaterThan(0);
  for (const { text, size } of content) {
    expect(size, `${text} should remain readable`).toBeGreaterThanOrEqual(minimum);
  }
}

test('desktop project titles provide a clear hierarchy above their descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const projects = await page.locator('#projects article').evaluateAll(articles => articles.map(article => {
    const title = article.querySelector('h3');
    const description = article.querySelector('.project-description');
    return {
      name: title?.textContent.trim(),
      heading: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
      body: description ? parseFloat(getComputedStyle(description).fontSize) : 0,
    };
  }));
  expect(projects.length).toBeGreaterThan(0);
  for (const project of projects) {
    expect(project.heading, project.name).toBeGreaterThanOrEqual(28);
    expect(project.body, project.name).toBeGreaterThanOrEqual(16);
    expect(project.heading / project.body, project.name).toBeGreaterThan(1.3);
  }
});

for (const width of [1440, 375]) {
  test(`project information and controls stay readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await revealContent(page);
    // These are explanations and actual data labels, rather than decorative marks.
    for (const selector of [
      '.report-sheet-title', '#finance-case-study .project-outcome > span', '.wb-scene-source-title', '.wb-scene-stage > strong',
      '.dbt-flow-node > strong', '.dbt-version-table tbody td',
      '.invoice-flow .visual-step > span:last-child', '.royalty-flow .visual-step > span:last-child',
      '.preview-question', '.arch-node', '.analysis-bar-label',
      '.form-label', '.copy-email-btn', '.case-details > summary', '[data-preview-control-label]',
    ]) {
      await expectReadableSize(page, selector, 14);
    }
    for (const selector of ['.preview-caption', '.preview-citation', '.workbench-sample', '.dbt-scene-heading > span', '.analysis-kicker']) {
      await expectReadableSize(page, selector, 13);
    }
    await expectReadableSize(page, '#spotify-case-study .case-body h4', 20);
    await expectReadableSize(page, '#spotify-case-study .case-body p, #spotify-case-study .case-body li', 17);
    await page.locator('#dynamic-island-container').click();
    await expectReadableSize(page, '[data-i18n-key="bot_challenge_h"], [data-i18n-key="bot_solution_h"]', 20);
    await expectReadableSize(page, '[data-i18n-key="bot_challenge_p"], [data-i18n-key="bot_solution_p"]', 17);
    await expectReadableSize(page, '[data-i18n-key="bot_subtitle"], .section-intro', 18);
  });
}

test('supporting projects introduce the work before their visual explanation', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('#projects article.project-preview').evaluateAll(articles => articles.map(article => {
    const title = article.querySelector('h3');
    const description = article.querySelector('.project-description');
    const preview = article.querySelector('[data-project-preview]');
    const precedes = (first, second) => Boolean(first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING));
    return {
      name: article.id,
      titleBeforeDescription: precedes(title, description),
      descriptionBeforePreview: precedes(description, preview),
    };
  }));
  expect(order.length).toBeGreaterThan(0);
  for (const project of order) {
    expect(project.titleBeforeDescription, project.name).toBe(true);
    expect(project.descriptionBeforePreview, project.name).toBe(true);
  }
});

for (const language of ['en', 'de']) {
  test(`enlarged ${language} text reflows without clipping letters on a narrow screen`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addInitScript(lang => localStorage.setItem('lang', lang), language);
    await page.goto('/');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await revealContent(page);
    const clipped = await page.locator([
      '#projects article h3', '#projects .project-description', '.preview-caption',
      '.visual-step > span:last-child', '.wb-scene-source-title', '.wb-scene-stage > strong',
      '.dbt-flow-node strong', '.dbt-version-table tbody th', '.arch-node',
      '.form-label', '#contact-form button', '.skill-chip', '#bottom-nav a',
    ].join(', ')).evaluateAll(elements => elements.flatMap(element => {
      if (!element.getBoundingClientRect().width || element.closest('[aria-hidden="true"], .sr-only')) return [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim() || node.parentElement.closest('[aria-hidden="true"], .sr-only')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          let outside = rect.left < -2 || rect.right > innerWidth + 2;
          // Check glyph bounds as well as boxes: overflow clipping can make the
          // document appear to fit while concealing part of an enlarged label.
          for (let ancestor = node.parentElement; ancestor && !outside; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            const bounds = ancestor.getBoundingClientRect();
            if (/hidden|clip/.test(style.overflowX)) outside = rect.left < bounds.left - 2 || rect.right > bounds.right + 2;
            if (/hidden|clip/.test(style.overflowY)) outside ||= rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2;
          }
          if (outside) return [{ text: node.textContent.trim().slice(0, 80), element: element.className || element.id }];
        }
      }
      return [];
    }));
    expect(clipped).toEqual([]);
  });
}
