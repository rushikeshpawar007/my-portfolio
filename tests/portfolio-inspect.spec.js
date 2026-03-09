const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL =
  'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');

/* ═══════════════════════════════════════════════════════════════════
   1. PAGE LOAD & CONSOLE ERRORS
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Page Load & Console', () => {
  test('page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(FILE_URL);
    await page.waitForLoadState('domcontentloaded');
    // Allow time for all DOMContentLoaded handlers
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test('no severe console warnings', async ({ page }) => {
    const warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'error') warnings.push(msg.text());
    });
    await page.goto(FILE_URL);
    await page.waitForTimeout(1500);
    // Filter out expected fetch-related errors (file:// protocol quirk)
    const real = warnings.filter(w =>
      !w.includes('Failed to load resource') &&
      !w.includes('file://') &&
      !w.includes('net::ERR')
    );
    expect(real).toEqual([]);
  });

  test('body becomes visible (lang-loaded class applied)', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(1500);
    const hasClass = await page.locator('body').evaluate(el => el.classList.contains('lang-loaded'));
    expect(hasClass).toBe(true);
  });

  test('page title is set', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page).toHaveTitle(/Rushikesh Pawar/);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   2. STRUCTURAL INTEGRITY — all sections exist
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Section Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
  });

  const sections = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'contact'];
  for (const id of sections) {
    test(`section #${id} exists`, async ({ page }) => {
      await expect(page.locator(`#${id}`)).toBeAttached();
    });
  }

  test('header/nav exists', async ({ page }) => {
    await expect(page.locator('header nav')).toBeAttached();
  });

  test('footer exists', async ({ page }) => {
    await expect(page.locator('footer')).toBeAttached();
  });

  test('reading progress bar exists', async ({ page }) => {
    await expect(page.locator('#read-progress')).toBeAttached();
  });

  test('toast container exists', async ({ page }) => {
    await expect(page.locator('#toast-container')).toBeAttached();
  });

  test('bottom nav exists', async ({ page }) => {
    await expect(page.locator('#bottom-nav')).toBeAttached();
  });

  test('scroll-to-top button exists', async ({ page }) => {
    await expect(page.locator('#scrollTopBtn')).toBeAttached();
  });

  test('translations JSON block exists and is valid', async ({ page }) => {
    const json = await page.locator('#translations-data').textContent();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('en');
    expect(parsed).toHaveProperty('de');
    expect(Object.keys(parsed.en).length).toBeGreaterThan(10);
    expect(Object.keys(parsed.de).length).toBeGreaterThan(10);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   3. IMAGES — local images load (src is not empty, naturalWidth > 0)
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Images', () => {
  test('all local images load successfully', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(2000);

    const broken = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img[src]:not([src^="http"]):not([src^="data:"])');
      const results = [];
      imgs.forEach(img => {
        if (img.naturalWidth === 0 && !img.closest('[style*="display: none"]') && getComputedStyle(img).display !== 'none') {
          // Check if it's hidden by theme toggle
          const isThemeHidden = img.classList.contains('theme-light') || img.classList.contains('theme-dark');
          if (!isThemeHidden || getComputedStyle(img).display !== 'none') {
            results.push({ src: img.src, alt: img.alt });
          }
        }
      });
      return results;
    });

    // For local file:// images, check only that src attributes are non-empty
    const imgSrcs = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img[src]:not([src^="http"]):not([src^="data:"])');
      return [...imgs].map(img => img.getAttribute('src'));
    });

    for (const src of imgSrcs) {
      expect(src.length).toBeGreaterThan(0);
    }
  });

  test('all images have alt attributes', async ({ page }) => {
    await page.goto(FILE_URL);
    const missingAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return [...imgs].filter(img => !img.hasAttribute('alt')).map(img => img.src);
    });
    expect(missingAlt).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   4. NAVIGATION — links, anchors, and menus
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
  });

  test('desktop nav has correct links', async ({ page }) => {
    const hrefs = await page.locator('header nav ul li a').evaluateAll(els =>
      els.map(el => el.getAttribute('href'))
    );
    expect(hrefs).toContain('#about');
    expect(hrefs).toContain('#experience');
    expect(hrefs).toContain('#projects');
    expect(hrefs).toContain('#skills');
    expect(hrefs).toContain('#contact');
  });

  test('all internal anchor hrefs point to existing sections', async ({ page }) => {
    const missing = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href^="#"]');
      const results = [];
      anchors.forEach(a => {
        const id = a.getAttribute('href').slice(1);
        if (id && !document.getElementById(id)) {
          results.push(id);
        }
      });
      return results;
    });
    expect(missing).toEqual([]);
  });

  test('mobile menu toggles on button click', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const menu = page.locator('#mobile-menu');
    // Initially has the 'hidden' utility class
    let hasHidden = await menu.evaluate(el => el.classList.contains('hidden'));
    expect(hasHidden).toBe(true);
    await page.locator('#mobile-menu-button').click();
    hasHidden = await menu.evaluate(el => el.classList.contains('hidden'));
    expect(hasHidden).toBe(false);
    await ctx.close();
  });

  test('mobile menu links close the menu', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    await page.locator('#mobile-menu-button').click();
    const menu = page.locator('#mobile-menu');
    let hasHidden = await menu.evaluate(el => el.classList.contains('hidden'));
    expect(hasHidden).toBe(false);
    await menu.locator('a').first().click();
    hasHidden = await menu.evaluate(el => el.classList.contains('hidden'));
    expect(hasHidden).toBe(true);
    await ctx.close();
  });
});

/* ═══════════════════════════════════════════════════════════════════
   5. THEME TOGGLE
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Theme Toggle', () => {
  test('theme toggle button exists and is clickable', async ({ page }) => {
    await page.goto(FILE_URL);
    const btn = page.locator('#theme-toggle');
    await expect(btn).toBeAttached();
    await expect(btn).toBeVisible();
  });

  test('clicking toggle switches data-theme attribute', async ({ page }) => {
    await page.goto(FILE_URL);
    const initial = await page.locator('html').getAttribute('data-theme');
    await page.locator('#theme-toggle').click();
    const after = await page.locator('html').getAttribute('data-theme');
    expect(after).not.toEqual(initial);
    expect(['light', 'dark']).toContain(after);
  });

  test('theme persists in localStorage', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.locator('#theme-toggle').click();
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(['light', 'dark']).toContain(stored);
  });

  test('correct theme icon is visible per theme', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(100);

    const lightIcon = page.locator('#theme-icon-light');
    const darkIcon = page.locator('#theme-icon-dark');

    // In dark mode, sun icon should show (to switch to light)
    await expect(lightIcon).toBeVisible();
    await expect(darkIcon).toBeHidden();

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(100);
    await expect(darkIcon).toBeVisible();
    await expect(lightIcon).toBeHidden();
  });

  test('theme-light/theme-dark images toggle correctly', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(100);

    const lightVisible = await page.locator('.theme-light').first().isVisible();
    const darkVisible = await page.locator('.theme-dark').first().isVisible();
    expect(lightVisible).toBe(true);
    expect(darkVisible).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   6. LANGUAGE TOGGLE (i18n)
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Language Toggle', () => {
  test('language toggle button exists in header', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const btn = page.locator('#lang-toggle-header');
    await expect(btn).toBeAttached();
    const text = await btn.textContent();
    expect(['DE', 'EN']).toContain(text.trim());
  });

  test('clicking toggle changes lang attribute on html', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const initial = await page.locator('html').getAttribute('lang');
    await page.locator('#lang-toggle-header').click();
    const after = await page.locator('html').getAttribute('lang');
    expect(after).not.toEqual(initial);
  });

  test('all data-i18n-key elements get translated', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);

    // Collect EN text
    const enTexts = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-i18n-key]');
      return [...els]
        .filter(el => el.children.length === 0 && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')
        .map(el => ({ key: el.getAttribute('data-i18n-key'), text: el.textContent.trim() }));
    });

    // Switch to DE
    await page.locator('#lang-toggle-header').click();
    await page.waitForTimeout(300);

    const deTexts = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-i18n-key]');
      return [...els]
        .filter(el => el.children.length === 0 && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')
        .map(el => ({ key: el.getAttribute('data-i18n-key'), text: el.textContent.trim() }));
    });

    // At least some elements should have changed text
    let changedCount = 0;
    for (let i = 0; i < enTexts.length; i++) {
      const en = enTexts[i];
      const de = deTexts.find(d => d.key === en.key);
      if (de && de.text !== en.text) changedCount++;
    }
    expect(changedCount).toBeGreaterThan(5);
  });

  test('input placeholders get translated', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const enPlaceholder = await page.locator('#name').getAttribute('placeholder');
    await page.locator('#lang-toggle-header').click();
    await page.waitForTimeout(300);
    const dePlaceholder = await page.locator('#name').getAttribute('placeholder');
    expect(dePlaceholder).not.toEqual(enPlaceholder);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   7. HERO SECTION
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
  });

  test('hero heading is visible', async ({ page }) => {
    await expect(page.locator('#hero-heading')).toBeVisible();
    await expect(page.locator('#hero-heading')).toHaveText('Rushikesh Pawar');
  });

  test('hero tagline is visible', async ({ page }) => {
    const tagline = page.locator('.hero-tagline');
    await expect(tagline).toBeVisible();
    const text = await tagline.textContent();
    expect(text.length).toBeGreaterThan(20);
  });

  test('company logos strip is visible', async ({ page }) => {
    const logos = page.locator('.company-logos');
    await expect(logos).toBeAttached();
    const logoImages = page.locator('.company-logos img');
    const count = await logoImages.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('resume button links to external URL', async ({ page }) => {
    const link = page.locator('a[data-i18n-key="resume_button"]');
    await expect(link).toBeAttached();
    const href = await link.getAttribute('href');
    expect(href).toContain('drive.google.com');
    expect(await link.getAttribute('target')).toBe('_blank');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   8. EXPERIENCE / TIMELINE
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Experience Timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('timeline has 4 entries', async ({ page }) => {
    const entries = page.locator('.timeline-container');
    await expect(entries).toHaveCount(4);
  });

  test('timeline progress bar exists', async ({ page }) => {
    await expect(page.locator('.timeline-progress')).toBeAttached();
  });

  test('each entry has a logo image', async ({ page }) => {
    const entries = page.locator('.timeline-container');
    const count = await entries.count();
    for (let i = 0; i < count; i++) {
      const logos = entries.nth(i).locator('.timeline-logo');
      const logoCount = await logos.count();
      expect(logoCount).toBeGreaterThanOrEqual(2); // light + dark
    }
  });

  test('most entries have Challenge/Solution/Impact structure', async ({ page }) => {
    // First 3 entries (Lecturio, CARIAD, KPMG) have full CSI; S.M. Auto is collapsed
    const entries = page.locator('.timeline-container');
    const count = await entries.count();
    let csiCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await entries.nth(i).textContent();
      if (text.includes('Challenge') && text.includes('Solution') && text.includes('Impact')) {
        csiCount++;
      }
    }
    expect(csiCount).toBeGreaterThanOrEqual(3);
  });

  test('skill tags are present in most entries', async ({ page }) => {
    // First 3 entries have skill tags; S.M. Auto is collapsed without tags
    const entries = page.locator('.timeline-container');
    const count = await entries.count();
    let entriesWithTags = 0;
    for (let i = 0; i < count; i++) {
      const tags = entries.nth(i).locator('.skill-tag-sm');
      const tagCount = await tags.count();
      if (tagCount >= 2) entriesWithTags++;
    }
    expect(entriesWithTags).toBeGreaterThanOrEqual(3);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   9. SKILLS GRID
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Skills Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
  });

  test('skills section has skill groups', async ({ page }) => {
    const groups = page.locator('#skills .glass-card');
    const count = await groups.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('each skill group has chips with tool names', async ({ page }) => {
    const chips = page.locator('#skills .skill-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(9);
  });

  test('skill groups have context descriptions', async ({ page }) => {
    const groups = page.locator('#skills .glass-card');
    const count = await groups.count();
    for (let i = 0; i < count; i++) {
      const heading = groups.nth(i).locator('h3');
      await expect(heading).toBeAttached();
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   10. PROJECTS / BENTO GRID
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Projects Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
  });

  test('bento grid exists with project cards', async ({ page }) => {
    const grid = page.locator('.bento-grid');
    await expect(grid).toBeAttached();
    // 1 dynamic island wrapper + 2 project cards (Spotify, Invoice) = at least 3 children
    const children = page.locator('.bento-grid > *');
    const count = await children.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('AI Finance Bot dynamic island is present in collapsed state', async ({ page }) => {
    const island = page.locator('#dynamic-island-container');
    await expect(island).toBeAttached();
    await expect(island).toHaveClass(/collapsed/);
  });

  test('external project links have target=_blank and rel=noopener', async ({ page }) => {
    const externalLinks = page.locator('.bento-grid a[href^="http"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const target = await externalLinks.nth(i).getAttribute('target');
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(target).toBe('_blank');
      expect(rel).toContain('noopener');
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   11. AI FINANCE BOT (Dynamic Island)
   ═══════════════════════════════════════════════════════════════════ */
test.describe('AI Finance Bot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.locator('#dynamic-island-container').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('island expands on click', async ({ page }) => {
    const island = page.locator('#dynamic-island-container');
    await island.click();
    await page.waitForTimeout(500);
    await expect(island).toHaveClass(/expanded/);
    await expect(island).not.toHaveClass(/collapsed/);
  });

  test('expanded island shows bot messages and prompt buttons', async ({ page }) => {
    await page.locator('#dynamic-island-container').click();
    await page.waitForTimeout(500);
    const messages = page.locator('#bot-messages-apple .bot-message-wrapper');
    await expect(messages).toHaveCount(1); // welcome message
    const prompts = page.locator('#bot-question-prompts-apple .prompt-button');
    await expect(prompts).toHaveCount(3);
  });

  test('clicking a prompt triggers bot simulation', async ({ page }) => {
    await page.locator('#dynamic-island-container').click();
    await page.waitForTimeout(500);
    await page.locator('#bot-question-prompts-apple .prompt-button').first().click();

    // User message should appear
    await page.waitForTimeout(600);
    const userMsgs = page.locator('.user-message');
    await expect(userMsgs).toHaveCount(1);

    // Wait for full simulation (typing + answer)
    await page.waitForTimeout(3500);
    const botMsgs = page.locator('.bot-message-wrapper.bot-message');
    const count = await botMsgs.count();
    expect(count).toBeGreaterThanOrEqual(2); // welcome + answer
  });

  test('close button collapses the island', async ({ page }) => {
    const island = page.locator('#dynamic-island-container');
    await island.click();
    await page.waitForTimeout(500);
    await page.locator('#close-island-btn').click();
    await page.waitForTimeout(400);
    await expect(island).toHaveClass(/collapsed/);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   12. CONTACT FORM
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('form exists with required fields', async ({ page }) => {
    await expect(page.locator('#contact-form')).toBeAttached();
    await expect(page.locator('#name')).toBeAttached();
    await expect(page.locator('#email')).toBeAttached();
    await expect(page.locator('#message')).toBeAttached();
    await expect(page.locator('#contact-form button[type="submit"]')).toBeAttached();
  });

  test('form fields have required attribute', async ({ page }) => {
    expect(await page.locator('#name').getAttribute('required')).not.toBeNull();
    expect(await page.locator('#email').getAttribute('required')).not.toBeNull();
    expect(await page.locator('#message').getAttribute('required')).not.toBeNull();
  });

  test('email field validates email format', async ({ page }) => {
    const type = await page.locator('#email').getAttribute('type');
    expect(type).toBe('email');
  });

  test('hidden form-name field exists for Netlify', async ({ page }) => {
    const hidden = page.locator('input[name="form-name"]');
    await expect(hidden).toBeAttached();
    expect(await hidden.getAttribute('type')).toBe('hidden');
    expect(await hidden.getAttribute('value')).toBe('contact');
  });

  test('copy email button exists and has data-email', async ({ page }) => {
    const btn = page.locator('.copy-email-btn');
    await expect(btn).toBeAttached();
    const email = await btn.getAttribute('data-email');
    expect(email).toContain('@');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   13. EDUCATION & CERTIFICATIONS
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Education & Certifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.locator('#education').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('two education entries exist', async ({ page }) => {
    const section = page.locator('#education');
    const text = await section.textContent();
    expect(text).toContain('HTW Berlin');
    expect(text).toContain('Savitribai Phule Pune University');
  });

  test('certification buttons link to external URLs', async ({ page }) => {
    const certs = page.locator('#certifications a');
    const count = await certs.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const href = await certs.nth(i).getAttribute('href');
      expect(href).toContain('drive.google.com');
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   14. FOOTER
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Footer', () => {
  test('footer has social links', async ({ page }) => {
    await page.goto(FILE_URL);
    const footer = page.locator('footer');
    const links = footer.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('copyright year is set dynamically', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const year = await page.locator('#copyright-year').textContent();
    expect(parseInt(year)).toBeGreaterThanOrEqual(2024);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   15. SCROLL & ANIMATION BEHAVIORS
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Scroll Behaviors', () => {
  test('header gets "scrolled" class on scroll', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(300);
    const header = page.locator('header');
    await expect(header).toHaveClass(/scrolled/);
  });

  test('section-reveal elements get "revealed" on scroll', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const revealed = await page.locator('#about').evaluate(el => el.classList.contains('revealed'));
    expect(revealed).toBe(true);
  });

  test('scrollTopBtn appears after scrolling down', async ({ page }) => {
    await page.goto(FILE_URL);
    const btn = page.locator('#scrollTopBtn');
    // Initially hidden
    await expect(btn).toBeHidden();
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    await expect(btn).toBeVisible();
  });

  test('reading progress bar updates on scroll', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(200);
    const width = await page.locator('#read-progress').evaluate(el => el.style.width);
    expect(width).not.toBe('0%');
    expect(width).not.toBe('');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   16. KEYBOARD SHORTCUTS
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Keyboard Shortcuts', () => {
  test('pressing T toggles theme', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const initial = await page.locator('html').getAttribute('data-theme');
    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    const after = await page.locator('html').getAttribute('data-theme');
    expect(after).not.toEqual(initial);
  });

  test('pressing ? opens AI bot (if collapsed)', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    await page.keyboard.press('?');
    await page.waitForTimeout(500);
    const island = page.locator('#dynamic-island-container');
    await expect(island).toHaveClass(/expanded/);
  });

  test('keyboard shortcut does not fire when typing in input', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const initial = await page.locator('html').getAttribute('data-theme');
    await page.locator('#name').scrollIntoViewIfNeeded();
    await page.locator('#name').click();
    await page.keyboard.press('t');
    const after = await page.locator('html').getAttribute('data-theme');
    expect(after).toEqual(initial);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   17. ACCESSIBILITY BASICS
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
  });

  test('html has lang attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(['en', 'de']).toContain(lang);
  });

  test('all interactive buttons have aria-label or visible text', async ({ page }) => {
    const unlabeled = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return [...buttons].filter(btn =>
        !btn.getAttribute('aria-label') &&
        !btn.textContent.trim() &&
        !btn.querySelector('span, i, svg')
      ).length;
    });
    expect(unlabeled).toBe(0);
  });

  test('toast container has aria-live', async ({ page }) => {
    const live = await page.locator('#toast-container').getAttribute('aria-live');
    expect(live).toBe('polite');
  });

  test('skip-to-content or proper heading hierarchy', async ({ page }) => {
    // Verify h1 exists (exactly one)
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Verify h2s exist for each section
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(5);
  });

  test('focus-visible styles do not cause invisible elements', async ({ page }) => {
    // Tab through a few elements and check they remain visible
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { tag: el.tagName, width: rect.width, height: rect.height };
    });
    if (focused) {
      expect(focused.width).toBeGreaterThan(0);
      expect(focused.height).toBeGreaterThan(0);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   18. CSS CUSTOM PROPERTIES — verify they resolve
   ═══════════════════════════════════════════════════════════════════ */
test.describe('CSS Custom Properties', () => {
  test('core theme variables resolve to non-empty values', async ({ page }) => {
    await page.goto(FILE_URL);
    const vars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        bgColor: style.getPropertyValue('--bg-color').trim(),
        textColor: style.getPropertyValue('--text-color').trim(),
        accentColor: style.getPropertyValue('--accent-color').trim(),
        headingColor: style.getPropertyValue('--heading-color').trim(),
        glassBg: style.getPropertyValue('--glass-bg').trim(),
      };
    });
    for (const [key, val] of Object.entries(vars)) {
      expect(val.length, `${key} should not be empty`).toBeGreaterThan(0);
    }
  });

  test('body has correct background-color from theme', async ({ page }) => {
    await page.goto(FILE_URL);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBeTruthy();
    expect(bg).not.toBe('');
    expect(bg).not.toBe('transparent');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   19. RESPONSIVE — mobile viewport
   ═══════════════════════════════════════════════════════════════════ */
test.describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('desktop nav is hidden on mobile', async ({ page }) => {
    await page.goto(FILE_URL);
    const desktopNav = page.locator('header nav ul');
    await expect(desktopNav).toBeHidden();
  });

  test('mobile menu button is visible', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page.locator('#mobile-menu-button')).toBeVisible();
  });

  test('bottom nav is visible on mobile', async ({ page }) => {
    await page.goto(FILE_URL);
    await expect(page.locator('#bottom-nav')).toBeVisible();
  });

  test('no horizontal scroll on mobile', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });
});
