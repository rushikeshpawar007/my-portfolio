const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'denied'));
});

async function fillContactForm(page) {
  await page.locator('#name').fill('Test User');
  await page.locator('#email').fill('test@example.com');
  await page.locator('#message').fill('Original message');
}

for (const success of [true, false]) {
  test(`contact ${success ? 'success' : 'failure'} keeps pending and restored labels in the selected language`, async ({ page }) => {
    let pendingRequest;
    await page.route('**/api.web3forms.com/**', route => { pendingRequest = route; });
    await page.goto('/');
    await fillContactForm(page);
    const form = page.locator('#contact-form');
    const submit = form.locator('button[type="submit"]');
    await submit.click();
    await expect(submit).toHaveText('Sending...');
    await page.locator('#lang-toggle-header').click();
    await expect(submit).toHaveText('Wird gesendet...');
    await expect(form).toHaveAttribute('aria-busy', 'true');
    await expect(submit).toBeDisabled();
    await expect.poll(() => Boolean(pendingRequest)).toBe(true);
    await pendingRequest.fulfill({
      status: success ? 200 : 500,
      contentType: 'application/json',
      body: JSON.stringify({ success }),
    });
    await expect(submit).toBeEnabled();
    await expect(form).toHaveAttribute('aria-busy', 'false');
    await expect(submit).toHaveText('Nachricht senden');
    await expect(page.locator('#message')).toHaveValue(success ? '' : 'Original message');
    await expect(page.locator('.toast').last()).toContainText(success ? 'Vielen Dank!' : 'Fehler');
  });
}

test('a completed request preserves a draft edited while the message was sending', async ({ page }) => {
  let pendingRequest;
  await page.route('**/api.web3forms.com/**', route => { pendingRequest = route; });
  await page.goto('/');
  await fillContactForm(page);
  await page.locator('#contact-form button[type="submit"]').click();
  await expect.poll(() => Boolean(pendingRequest)).toBe(true);
  await page.locator('#message').fill('A new draft that has not been sent');
  await pendingRequest.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  });
  await expect(page.locator('.toast').last()).toContainText('Your message has been sent.');
  await expect(page.locator('#message')).toHaveValue('A new draft that has not been sent');
  await expect(page.locator('#name')).toHaveValue('Test User');
});

test('copy feedback and its reset follow language changes before and after copying', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => new Promise(resolve => { window.completeTestCopy = resolve; }),
      },
    });
  });
  await page.goto('/');
  const button = page.locator('.copy-email-btn');
  await button.click();
  await expect(button).toBeDisabled();
  await page.locator('#lang-toggle-header').click();
  await page.evaluate(() => window.completeTestCopy());
  await expect(button).toHaveText('Kopiert!');
  await expect(button.locator('svg use')).toHaveAttribute('href', '#i-check');
  // The app intentionally throttles language switches to 150 ms.
  await page.waitForTimeout(180);
  await page.locator('#lang-toggle-header').click();
  await expect(button).toHaveText('Copied!');
  await page.waitForTimeout(180);
  await page.locator('#lang-toggle-header').click();
  await expect(button).toHaveText('Kopiert!');
  await expect(button).toBeEnabled({ timeout: 4000 });
  await expect(button).toHaveText('Kopieren');
  await expect(button.locator('svg use')).toHaveAttribute('href', '#i-copy-r');
});

test('choosing a demo question by keyboard keeps focus in the demo, so Escape still closes it', async ({ page }) => {
  await page.goto('/');
  await page.locator('#rag-case-study-details > summary').focus();
  await page.keyboard.press('Enter');
  const island = page.locator('#dynamic-island-container');
  await island.focus();
  await page.keyboard.press('Enter');
  const prompt = page.locator('#bot-question-prompts-apple button').first();
  await prompt.focus();
  await page.keyboard.press('Enter');
  // Greeting, question, answer and citation.
  await expect(page.locator('#bot-messages-apple .bot-message-wrapper')).toHaveCount(4);
  await expect(prompt).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(island).toHaveClass(/collapsed/);
  await expect(island).toBeFocused();
});

test('copying the email by keyboard keeps focus on the button and announces the result', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } });
  });
  await page.goto('/');
  const button = page.locator('.copy-email-btn');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveText('Copied!');
  await expect(button).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'Copied!' })).toHaveCount(1);
});

test('sending the contact form by keyboard keeps focus on the submit button', async ({ page }) => {
  let pendingRequest;
  await page.route('**/api.web3forms.com/**', route => { pendingRequest = route; });
  await page.goto('/');
  await fillContactForm(page);
  const submit = page.locator('#contact-form button[type="submit"]');
  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(submit).toHaveText('Sending...');
  await expect(submit).toBeFocused();
  await expect.poll(() => Boolean(pendingRequest)).toBe(true);
  await pendingRequest.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  await expect(submit).toHaveText('Send message');
  await expect(submit).toBeFocused();
});

test('reopened cookie settings move keyboard focus to the choices and back after dismissal', async ({ page }) => {
  await page.goto('/');
  const opener = page.locator('#reopen-cookie-consent');
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#cookie-consent-banner')).toBeVisible();
  await expect(page.locator('#cookie-decline')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#cookie-consent-banner')).toBeHidden();
  await expect(opener).toBeFocused();
});
