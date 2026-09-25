const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

test('every impact metric draws its closing rule, including formatted currency', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('#impact').scrollIntoViewIfNeeded();
  const rules = page.locator('#impact .closing-rule');
  await expect(rules).toHaveCount(3);
  for (const rule of await rules.all()) {
    await expect(rule).toHaveClass(/drawn/);
    await expect(rule).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  }
  await expect(page.locator('#impact .impact-number').last()).toHaveText('₹200k');
});

for (const id of ['report-details', 'royalty-case-study-details', 'lecturio-role-details']) {
  test(`${id} expands gently and preserves native keyboard focus`, async ({ page }) => {
    await page.goto('/');
    const details = page.locator('#' + id);
    const summary = details.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    const dimensions = await details.evaluate(el => {
      const animation = el.getAnimations()[0];
      expectAnimation(animation);
      animation.pause();
      const frames = animation.effect.getKeyframes();
      animation.currentTime = 60;
      return { from: parseFloat(frames[0].height), to: parseFloat(frames[1].height), current: el.getBoundingClientRect().height };
      function expectAnimation(value) { if (!value) throw new Error('Expected an active disclosure animation'); }
    });
    expect(dimensions.current).toBeGreaterThan(dimensions.from);
    expect(dimensions.current).toBeLessThan(dimensions.to);
    await details.evaluate(el => el.getAnimations()[0].play());
    await expect(details).not.toHaveAttribute('data-disclosure-state');
    await expect(details).toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await page.keyboard.press('Space');
    await expect(details).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
    expect(await details.evaluate(el => ({ height: el.style.height, overflow: el.style.overflow }))).toEqual({ height: '', overflow: '' });
  });
}

test('rapid disclosure reversals continue from their current height', async ({ page }) => {
  await page.goto('/');
  const details = page.locator('#royalty-case-study-details');
  const jumps = await details.evaluate(el => {
    const summary = el.querySelector('summary');
    const heights = [];
    summary.click();
    for (let i = 0; i < 2; i += 1) {
      const animation = el.getAnimations()[0];
      animation.pause();
      animation.currentTime = 70;
      const before = el.getBoundingClientRect().height;
      summary.click();
      const after = el.getBoundingClientRect().height;
      heights.push(Math.abs(after - before));
    }
    return heights;
  });
  expect(jumps.every(jump => jump < 1)).toBe(true);
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  await expect(details).toHaveAttribute('open', '');
  expect(await details.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
});

test('reduced motion opens and closes every disclosure without animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const states = await page.locator('details.case-details, details.experience-details').evaluateAll(elements => elements.map(el => {
    el.querySelector('summary').click();
    const opened = el.open && el.getAnimations().length === 0 && !el.dataset.disclosureState;
    el.querySelector('summary').click();
    return opened && !el.open && el.style.overflow === '';
  }));
  expect(states).toHaveLength(11);
  expect(states.every(Boolean)).toBe(true);
});

test('enabling reduced motion settles both opening and closing disclosures', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const opening = document.getElementById('report-details');
    const closing = document.getElementById('royalty-case-study-details');
    closing.open = true;
    for (const el of [opening, closing]) {
      el.querySelector('summary').click();
      el.getAnimations()[0].pause();
    }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#report-details')).toHaveAttribute('open', '');
  await expect(page.locator('#royalty-case-study-details')).not.toHaveAttribute('open');
  await expect(page.locator('[data-disclosure-state]')).toHaveCount(0);
  expect(await page.locator('#report-details, #royalty-case-study-details').evaluateAll(elements => elements.every(el => el.getAnimations().length === 0 && el.style.overflow === ''))).toBe(true);
});

test('printing mid-animation reveals all content and restores intended states', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const closing = document.getElementById('report-details');
    const opening = document.getElementById('royalty-case-study-details');
    closing.open = true;
    for (const el of [opening, closing]) {
      el.querySelector('summary').click();
      el.getAnimations()[0].pause();
    }
    dispatchEvent(new Event('beforeprint'));
  });
  await expect(page.locator('details.case-details[open], details.experience-details[open]')).toHaveCount(11);
  await expect(page.locator('[data-disclosure-state]')).toHaveCount(0);
  expect(await page.locator('details.case-details, details.experience-details').evaluateAll(elements => elements.every(el => el.style.overflow === '' && el.getAnimations().length === 0))).toBe(true);
  await page.evaluate(() => dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#report-details')).not.toHaveAttribute('open');
  await expect(page.locator('#royalty-case-study-details')).toHaveAttribute('open', '');
  await expect(page.locator('details.case-details[open], details.experience-details[open]')).toHaveCount(1);
});

test('printing a collapsed chatbot includes its explanation and preserves the screen state', async ({ page }) => {
  await page.goto('/');
  const chatbot = page.locator('#dynamic-island-container');
  const explanation = chatbot.locator('.expanded-content');
  const challenge = chatbot.locator('[data-i18n-key="bot_challenge_p"]');
  const solution = chatbot.locator('[data-i18n-key="bot_solution_p"]');
  await expect(chatbot).toHaveClass('collapsed');
  await expect(challenge).toBeHidden();

  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
  await expect(challenge).toBeVisible();
  await expect(solution).toBeVisible();
  await expect(explanation).toHaveCSS('opacity', '1');
  await expect(explanation).toHaveCSS('transition-duration', '0s');
  await expect(chatbot.locator('#bot-simulation-window-apple')).toBeHidden();

  await page.evaluate(() => dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });
  await expect(chatbot).toHaveClass('collapsed');
  await expect(challenge).toBeHidden();
  await expect(solution).toBeHidden();
  await expect(explanation).toHaveCSS('pointer-events', 'none');
});

test('a deep link interrupts closing and opens the full case study', async ({ page }) => {
  await page.goto('/#royalty-case-study');
  const details = page.locator('#royalty-case-study-details');
  await expect(details).toHaveAttribute('open', '');
  await details.evaluate(el => {
    el.querySelector('summary').click();
    el.getAnimations()[0].pause();
    dispatchEvent(new HashChangeEvent('hashchange'));
  });
  await expect(details).toHaveAttribute('open', '');
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  expect(await details.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
});

test('native disclosure fallback works when the animation API is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Element.prototype.animate = undefined; });
  await page.goto('/');
  const details = page.locator('#lecturio-role-details');
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
});
