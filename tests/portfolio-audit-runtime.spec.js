const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'denied');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('lang', 'en');
  });
  // This audit never sends a visitor message or loads an analytics tag.
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://api.web3forms.com/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' }));
});

async function fillContact(page, values = {}) {
  await page.locator('#name').fill(values.name ?? 'Audit Visitor');
  await page.locator('#email').fill(values.email ?? 'audit@example.com');
  await page.locator('#message').fill(values.message ?? 'An unsent audit message.');
}

test('initial English translation preserves readable text nodes and matching attributes', async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const selector = '[data-i18n-key="hero_tagline"], [data-i18n-key="hero_context"], [data-i18n-key="royalty_preview"], [data-i18n-key="spotify_preview"]';
      window.originalTranslationNodes = [...document.querySelectorAll(selector)].map(element => ({
        element, children: [...element.childNodes],
      }));
      const tracked = new Set([
        document.documentElement,
        ...document.querySelectorAll('#name, #email, #message, #theme-toggle, #lang-toggle-header, .hero-portrait img'),
      ]);
      window.initialTranslationAttributeWrites = [];
      const observer = new MutationObserver(records => {
        records.filter(record => tracked.has(record.target)).forEach(record => {
          window.initialTranslationAttributeWrites.push(record.attributeName);
        });
      });
      observer.observe(document.documentElement, {
        subtree: true, attributes: true,
        attributeFilter: ['placeholder', 'aria-label', 'alt', 'title', 'lang'],
      });
      setTimeout(() => observer.disconnect(), 0);
    }, { once: true });
  });
  await page.goto('/');
  expect(await page.evaluate(() => window.originalTranslationNodes.every(({ element, children }) =>
    children.length === element.childNodes.length && children.every((child, index) => element.childNodes[index] === child)))).toBe(true);
  expect(await page.evaluate(() => window.initialTranslationAttributeWrites)).toEqual([]);
});

for (const width of [390, 1280]) {
  test(`demo bookmarks, citations and browser history reveal their content at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#dynamic-island-container');
    await expect(page.locator('#dynamic-island-container')).toHaveClass(/expanded/);
    await expect(page.locator('#bot-question-prompts-apple button')).toHaveCount(3);
    await page.goto('/#demo-source');
    await expect(page.locator('#dynamic-island-container')).toHaveClass(/expanded/);
    await expect(page.locator('#demo-source')).toHaveAttribute('open', '');
    await expect(page.locator('#demo-source table')).toBeVisible();
    await page.locator('#close-island-btn').click();
    const nav = width < 768 ? '#bottom-nav' : 'header nav';
    await page.locator(`${nav} a[href="#skills"]`).click();
    await page.goBack();
    await expect(page).toHaveURL(/#demo-source$/);
    await expect(page.locator('#dynamic-island-container')).toHaveClass(/expanded/);
    await expect(page.locator('#demo-source table')).toBeVisible();
  });
}

test('missing intersection observation preserves navigation, consent, contact and the demo', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { window.IntersectionObserver = undefined; });
  await page.goto('/');
  await expect(page.locator('#copyright-year')).toHaveText(String(new Date().getFullYear()));
  await expect(page.locator('#contact')).toHaveCSS('opacity', '1');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#lang-toggle-header').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.locator('#reopen-cookie-consent').click();
  await page.locator('#cookie-decline').click();
  await expect(page.locator('#cookie-consent-banner')).toBeHidden();
  await page.locator('[data-i18n-key="demo_open"]').click();
  await page.locator('#bot-question-prompts-apple button').first().click();
  await expect(page.locator('#bot-messages-apple .bot-message-wrapper')).toHaveCount(4);
  await fillContact(page);
  await page.locator('#contact-form button[type="submit"]').click();
  await expect(page.locator('.toast-error').last()).toContainText('Fehler');
  await expect(page.locator('#contact-form')).toHaveAttribute('aria-busy', 'false');
  expect(errors).toEqual([]);
});

test('custom form validation focuses the field that needs correction and sends nothing', async ({ page }) => {
  let requests = 0;
  page.on('request', request => { if (request.url().includes('api.web3forms.com')) requests += 1; });
  await page.goto('/');
  for (const [values, field, message] of [
    [{ name: '   ' }, '#name', 'Please fill in all fields.'],
    [{ message: '   ' }, '#message', 'Please fill in all fields.'],
    [{ email: 'audit@example' }, '#email', 'Please enter a valid email address.'],
  ]) {
    await fillContact(page, values);
    await page.locator('#contact-form button[type="submit"]').click();
    await expect(page.locator(field)).toBeFocused();
    await expect(page.locator('.toast-error').last()).toHaveText(message);
  }
  expect(requests).toBe(0);
});

test('duplicate submissions are ignored and malformed responses preserve the draft for a retry', async ({ page }) => {
  const held = [];
  await page.route('https://api.web3forms.com/**', route => { held.push(route); });
  await page.goto('/');
  await fillContact(page);
  const form = page.locator('#contact-form');
  await form.locator('button[type="submit"]').click();
  await expect.poll(() => held.length).toBe(1);
  await form.evaluate(element => { element.requestSubmit(); element.requestSubmit(); });
  await held[0].fulfill({ status: 200, contentType: 'text/html', body: '<h1>Temporary service failure</h1>' });
  await expect(form).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#message')).toHaveValue('An unsent audit message.');
  await expect(page.locator('.toast-error').last()).toBeVisible();
  expect(held).toHaveLength(1);
  await form.locator('button[type="submit"]').click();
  await expect.poll(() => held.length).toBe(2);
  await held[1].fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  await expect(page.locator('#message')).toHaveValue('');
  await expect(form.locator('button[type="submit"]')).toBeEnabled();
});

test('a timed-out submission restores the button and preserves the draft', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, delay === 15000 ? 30 : delay, ...args);
    const nativeFetch = window.fetch;
    window.fetch = (input, options) => String(input).includes('api.web3forms.com')
      ? new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Audit timeout', 'AbortError')), { once: true }))
      : nativeFetch(input, options);
  });
  await page.goto('/');
  await fillContact(page);
  await page.locator('#contact-form button[type="submit"]').click();
  await expect(page.locator('.toast-error').last()).toHaveText('Request timed out. Please try again.');
  await expect(page.locator('#contact-form')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#contact-form button[type="submit"]')).toBeEnabled();
  await expect(page.locator('#message')).toHaveValue('An unsent audit message.');
});

test('denied clipboard permission leaves the email available and the control usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Audit permission denial', 'NotAllowedError')) },
    });
  });
  await page.goto('/');
  const copy = page.locator('.copy-email-btn');
  await copy.focus();
  await page.keyboard.press('Enter');
  await expect(copy).toBeFocused();
  await expect(copy).toBeEnabled();
  await expect(copy).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.toast').last()).toHaveText('rushikeshpawar197@gmail.com');
});

test('closing a pending demo answer cancels the old conversation before reopening', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#dynamic-island-container');
  const prompts = page.locator('#bot-question-prompts-apple button');
  await prompts.first().click();
  await page.locator('#close-island-btn').click();
  await page.waitForTimeout(400);
  await page.locator('#dynamic-island-container').press('Enter');
  await expect(page.locator('#bot-messages-apple .bot-message-wrapper')).toHaveCount(1);
  await expect(page.locator('#bot-messages-apple')).toHaveAttribute('aria-busy', 'false');
  await prompts.last().click();
  await expect(page.locator('#bot-messages-apple .bot-message-wrapper')).toHaveCount(4);
  await expect(page.locator('#bot-messages-apple')).toContainText('forecast');
});
