/* ============================================================
   PORTFOLIO - Main JavaScript
   Rushikesh Pawar - Data Analytics Portfolio
   ============================================================ */

/** @param {Event} event */
function isCurrentPageActivation(event) {
    // Modified clicks belong to the browser (new tab/window or download).
    return event instanceof MouseEvent && event.button === 0 && !event.defaultPrevented
        && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        /* ── UTILITIES ─────────────────────────────────────── */

        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
        let prefersReducedMotion = motionPreference.matches;
        motionPreference.addEventListener('change', event => { prefersReducedMotion = event.matches; });
        /** @type {Record<string, boolean>} */
        const _throttleFlags = {};
        /**
         * @param {string} key
         * @param {(...args: any[]) => void} fn
         * @param {number} [delay]
         */
        function throttled(key, fn, delay = 150) {
            /** @this {any} @param {any[]} args */
            return function (...args) {
                if (_throttleFlags[key]) return;
                _throttleFlags[key] = true;
                fn.apply(this, args);
                setTimeout(() => { _throttleFlags[key] = false; }, delay);
            };
        }

        /** @param {string} message @param {boolean} [isError] */
        function showToast(message, isError = false) {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = 'toast' + (isError ? ' toast-error' : '');
            toast.textContent = message;
            container.appendChild(toast);
            requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 350);
            }, 4000);
        }

        /* ── I18N / TRANSLATIONS ───────────────────────────── */

        /** @type {Record<string, Record<string, string>>} */
        let translations = {};
        try {
            translations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}');
        } catch (e) {
            console.error("Failed to parse translations.", e);
            translations = { en: {}, de: {} };
        }

        let currentLang = document.documentElement.lang || 'en';
        try {
            const savedLang = localStorage.getItem('lang');
            if (savedLang === 'en' || savedLang === 'de') currentLang = savedLang;
        } catch { /* The default English content remains usable without storage. */ }
        const langToggleHeader = document.getElementById("lang-toggle-header");
        const langToggleMobile = document.getElementById("lang-toggle-mobile");
        const themeToggle = document.getElementById('theme-toggle');

        function syncControlLabels() {
            const localized = translations[currentLang] || {};
            /** @param {HTMLElement | null} button @param {string} key @param {string} fallback */
            const labelControl = (button, key, fallback) => {
                if (!button) return;
                const labelKey = localized[key] ? key : localized[fallback] ? fallback : translations.en?.[key] ? key : fallback;
                const label = localized[labelKey] || translations.en?.[labelKey];
                if (!label) return; // Retain the authored accessible name if translations are unavailable.
                if (button.dataset.i18nAria !== labelKey) button.dataset.i18nAria = labelKey;
                if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
                if (button.title !== label) button.title = label;
            };
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            labelControl(themeToggle, `label_theme_${nextTheme}`, 'label_theme');
            const nextLanguage = currentLang === 'de' ? 'en' : 'de';
            [langToggleHeader, langToggleMobile].forEach(button => labelControl(button, `label_language_${nextLanguage}`, 'label_language'));
        }

        function translatePage() {
            document.querySelectorAll("[data-i18n-key]").forEach(el => {
                const key = el.getAttribute("data-i18n-key");
                if (!key) return;
                const t = translations[currentLang]?.[key];
                if (!t) return;
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    const field = /** @type {HTMLInputElement} */ (el);
                    if (field.placeholder !== t) field.placeholder = t;
                } else if (el.hasAttribute('data-i18n-html')) {
                    // Author-controlled translation strings only (safe, static markup like <span>/<strong>)
                    if (el.innerHTML !== t) el.innerHTML = t;
                } else if (el.children.length === 0) {
                    if (el.textContent !== t) el.textContent = t;
                }
            });
            const next = currentLang === 'de' ? 'EN' : 'DE';
            [langToggleHeader, langToggleMobile].forEach(button => {
                if (!button) return;
                if (button.textContent !== next) button.textContent = next;
            });
            document.querySelectorAll('[data-i18n-aria]').forEach(el => {
                const key = el.getAttribute('data-i18n-aria');
                const label = key && translations[currentLang]?.[key];
                if (label && el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
            });
            document.querySelectorAll('[data-i18n-alt]').forEach(el => {
                const key = el.getAttribute('data-i18n-alt');
                const alt = key && translations[currentLang]?.[key];
                if (alt && el.getAttribute('alt') !== alt) el.setAttribute('alt', alt);
            });
            if (document.documentElement.lang !== currentLang) document.documentElement.lang = currentLang;
            syncControlLabels();
        }

        function toggleLanguage() {
            currentLang = currentLang === 'de' ? 'en' : 'de';
            try { localStorage.setItem('lang', currentLang); } catch {}
            translatePage();
            document.dispatchEvent(new Event('portfolio:languagechange'));
            // data-i18n-html re-renders replace .metric-highlight spans,
            // detaching them from the count-up observer - re-observe, but skip
            // any currently on screen so visible numbers don't reset-and-retally.
            observeMetrics(true);
        }

        const throttledToggleLang = throttled('lang', toggleLanguage);
        if (langToggleHeader) langToggleHeader.addEventListener("click", throttledToggleLang);
        if (langToggleMobile) langToggleMobile.addEventListener("click", throttledToggleLang);
        translatePage();

        /* ── THEME TOGGLE ──────────────────────────────────── */

        // Keep the mobile browser chrome tinted like the sheet
        /** @param {string} next */
        function syncThemeColor(next) {
            document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = next === 'dark' ? '#181C19' : '#F8F7F4';
            document.head.appendChild(meta);
        }

        let themeTransitionGeneration = 0;
        /** @param {string} next */
        function setTheme(next) {
            const generation = ++themeTransitionGeneration;
            const finish = () => {
                // An earlier transition may finish after another toggle has started.
                if (generation === themeTransitionGeneration) document.documentElement.classList.remove('theme-switching');
            };
            const apply = () => {
                document.documentElement.setAttribute('data-theme', next);
                try { localStorage.setItem('theme', next); } catch {}
                syncThemeColor(next);
                syncControlLabels();
            };
            // Cross-fade the whole sheet like turning a page (progressive enhancement)
            if (document.startViewTransition && !prefersReducedMotion) {
                document.documentElement.classList.add('theme-switching');
                try {
                    const vt = document.startViewTransition(apply);
                    // A skipped visual transition still applies the theme, but its
                    // ready promise rejects (for example when the tab is hidden).
                    vt.ready.catch(() => {});
                    // Handle both outcomes without leaving a rejected finally() promise.
                    vt.finished.then(finish, finish);
                } catch {
                    finish();
                    apply();
                }
            } else {
                finish();
                apply();
            }
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', throttled('theme', () => {
                setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
            }));
        }

        // Reconcile browser-chrome tint with the ACTIVE theme (a saved theme
        // can oppose the OS scheme the static media-based metas key on)
        syncThemeColor(document.documentElement.getAttribute('data-theme') || 'light');

        /* ── MOBILE MENU ───────────────────────────────────── */

        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            /** @param {boolean} open */
            const setMenuOpen = open => {
                mobileMenu.classList.toggle('hidden', !open);
                mobileMenuButton.setAttribute('aria-expanded', String(open));
            };
            mobileMenuButton.addEventListener('click', () => {
                setMenuOpen(mobileMenu.classList.contains('hidden'));
            });
            mobileMenu.querySelectorAll('a[href^="#"]').forEach(link =>
                link.addEventListener('click', event => {
                    if (!isCurrentPageActivation(event)) return;
                    setMenuOpen(false);
                    const target = document.getElementById((link.getAttribute('href') || '').slice(1));
                    if (target) {
                        target.setAttribute('tabindex', '-1');
                        target.focus({ preventScroll: true });
                    }
                })
            );
            document.addEventListener('keydown', event => {
                if (event.key !== 'Escape' || mobileMenu.classList.contains('hidden')) return;
                setMenuOpen(false);
                mobileMenuButton.focus({ preventScroll: true });
            });
            document.addEventListener('pointerdown', event => {
                if (event.target instanceof Node && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
                    setMenuOpen(false);
                }
            });
            document.addEventListener('focusin', event => {
                if (event.target instanceof Node && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
                    setMenuOpen(false);
                }
            });
            // Reset the disclosure when the desktop links or phone tabs take over.
            window.matchMedia('(min-width: 1024px), (max-width: 767px)').addEventListener('change', event => {
                if (!event.matches) return;
                const focusWasInMenu = mobileMenu.contains(document.activeElement) || document.activeElement === mobileMenuButton;
                setMenuOpen(false);
                if (focusWasInMenu) langToggleHeader?.focus({ preventScroll: true });
            });
        }

        /* ── NAV HIGHLIGHTING (unified desktop + mobile) ──── */

        const sections = document.querySelectorAll('main section[id]');
        const navLinks = document.querySelectorAll('header nav ul li a, #mobile-menu a');
        const bottomNavLinks = document.querySelectorAll('#bottom-nav a');

        /** @param {Element} link @param {string | null} id @param {string} activeClass */
        function updateNavLink(link, id, activeClass) {
            const active = link.getAttribute('href') === `#${id}`;
            link.classList.toggle(activeClass, active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        }

        // A fixed band at ~35-45% of the viewport decides the active section:
        // a 50%-visibility threshold is unreachable for sections taller than
        // twice the viewport (Experience, Projects), and unlinked sections
        // (#impact, #education) must not wipe the highlight.
        const navObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link =>
                    updateNavLink(link, id, 'active-link')
                );
                bottomNavLinks.forEach(link =>
                    updateNavLink(link, id, 'active-bottom')
                );
            });
        }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 }) : null;

        const linkedIds = new Set([...navLinks, ...bottomNavLinks].map(a => a.getAttribute('href')));
        sections.forEach(s => { if (s.id === 'hero' || linkedIds.has(`#${s.id}`)) navObserver?.observe(s); });

        /* ── SCROLL STATE / READING PROGRESS ──────────────── */

        const scrollTopBtn = document.getElementById('scrollTopBtn');
        const readProgress = document.getElementById('read-progress');
        const folioProgress = document.getElementById('folio-progress');
        const header = document.querySelector('header');
        // Modern engines connect the indicator transforms directly to scrolling
        // in CSS. JavaScript only changes controls when their visible state changes.
        const nativeScrollProgress = CSS.supports('animation-timeline: scroll(root block)');
        let scrollTicking = false;
        let scrollRange = 0;
        let rangeDirty = !nativeScrollProgress;
        let headerScrolled = header?.classList.contains('scrolled') || false;
        /** @type {boolean | undefined} */
        let topButtonVisible;
        let lastProgress = -1;

        function updateScrollState() {
            scrollTicking = false;
            // Finish all geometry reads before making any DOM/style changes.
            const scrollY = window.scrollY;
            if (rangeDirty) {
                scrollRange = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
                rangeDirty = false;
            }
            const scrolled = scrollY > 8;
            const showTopButton = scrollY > 300;
            const progress = scrollRange > 0 ? Math.min(1, Math.max(0, scrollY / scrollRange)) : 0;
            if (header && scrolled !== headerScrolled) {
                header.classList.toggle('scrolled', scrolled);
                headerScrolled = scrolled;
            }
            if (scrollTopBtn && showTopButton !== topButtonVisible) {
                scrollTopBtn.style.display = showTopButton ? 'block' : 'none';
                topButtonVisible = showTopButton;
            }
            if (!nativeScrollProgress && progress !== lastProgress) {
                if (readProgress) readProgress.style.transform = `scaleX(${progress})`;
                if (folioProgress) folioProgress.style.transform = `scaleY(${progress})`;
                lastProgress = progress;
            }
        }

        function scheduleScrollUpdate() {
            if (scrollTicking) return;
            scrollTicking = true;
            requestAnimationFrame(updateScrollState);
        }

        function refreshScrollRange() {
            rangeDirty = !nativeScrollProgress;
            scheduleScrollUpdate();
        }

        window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
        if (!nativeScrollProgress) {
            // Cache document extent between actual size changes, including the
            // intermediate frames of disclosures and late-loading images/fonts.
            if (typeof ResizeObserver === 'function') {
                const rangeObserver = new ResizeObserver(refreshScrollRange);
                rangeObserver.observe(document.body);
            }
            window.addEventListener('resize', refreshScrollRange, { passive: true });
            window.addEventListener('load', refreshScrollRange, true);
            document.addEventListener('portfolio:languagechange', refreshScrollRange);
            document.addEventListener('toggle', refreshScrollRange, true);
            window.addEventListener('pageshow', refreshScrollRange);
        }
        scheduleScrollUpdate();

        if (scrollTopBtn) scrollTopBtn.onclick = () => {
            document.getElementById('main')?.focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        };

        /* ── COOKIE CONSENT (GDPR) ─────────────────────────── */

        const consentBanner = document.getElementById('cookie-consent-banner');
        const analyticsId = 'G-H2TJQ5H08S';
        let analyticsLoaded = false;
        let analyticsConsent = false;
        function loadAnalytics() {
            if (analyticsLoaded) return;
            analyticsLoaded = true;
            const s = document.createElement('script');
            s.async = true;
            s.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
            document.head.appendChild(s);
            if (typeof gtag === 'function') {
                gtag('js', new Date());
                gtag('config', analyticsId, { anonymize_ip: true });
            }
        }
        /** @param {string} name @param {Record<string, string>} params */
        function trackEvent(name, params) {
            if (analyticsConsent && typeof gtag === 'function') gtag('event', name, params);
        }
        // Withdrawn consent must also stop a tag loaded earlier in this visit and
        // remove the cookies it set; a consent update alone leaves both in place.
        /** @param {boolean} granted */
        function applyAnalyticsConsent(granted) {
            analyticsConsent = granted;
            /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (window))[`ga-disable-${analyticsId}`] = !granted;
            if (granted) return;
            document.cookie.split(';').map(cookie => cookie.split('=')[0].trim())
                .filter(name => /^_ga(_|$)/.test(name))
                .forEach(name => {
                    document.cookie = `${name}=; Max-Age=0; path=/`;
                    document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
                });
        }
        if (consentBanner) {
            const consentOpener = document.getElementById('reopen-cookie-consent');
            let returnConsentFocus = false;
            let storedConsent = null;
            try { storedConsent = localStorage.getItem('cookie-consent'); } catch {}
            if (!storedConsent) {
                consentBanner.hidden = false;
            } else if (storedConsent === 'granted') {
                analyticsConsent = true;
                if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'granted' });
                loadAnalytics();
            }
            /** @param {boolean} granted */
            const setConsent = (granted) => {
                try { localStorage.setItem('cookie-consent', granted ? 'granted' : 'denied'); } catch {}
                applyAnalyticsConsent(granted);
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
                }
                if (granted) loadAnalytics();
                consentBanner.hidden = true;
                if (returnConsentFocus) consentOpener?.focus({ preventScroll: true });
                returnConsentFocus = false;
            };
            document.getElementById('cookie-accept')?.addEventListener('click', () => setConsent(true));
            document.getElementById('cookie-decline')?.addEventListener('click', () => setConsent(false));
            consentOpener?.addEventListener('click', () => {
                returnConsentFocus = true;
                consentBanner.hidden = false;
                document.getElementById('cookie-decline')?.focus({ preventScroll: true });
            });
        }

        /* ── GA EVENT TRACKING (data-ga-event) ─────────────── */

        document.querySelectorAll('[data-ga-event]').forEach((el) => {
            const a = /** @type {HTMLAnchorElement} */ (el);
            a.addEventListener('click', () => {
                trackEvent(a.dataset.gaEvent || '', {
                    link_url: a.href || '',
                    link_text: (a.textContent || '').trim().slice(0, 80),
                });
            });
        });

        /* ── CONTACT FORM ──────────────────────────────────── */

        const contactForm = /** @type {HTMLFormElement | null} */ (document.getElementById('contact-form'));
        if (contactForm) {
            const messageField = contactForm.querySelector('#message');
            // Native textarea focus can reveal only the caret behind the phone tabs.
            // Use the document's scroll padding to keep the complete field in view.
            messageField?.addEventListener('focus', () => {
                messageField.scrollIntoView({ block: 'nearest', behavior: 'instant' });
            });
            let isSubmitting = false;
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (isSubmitting) return;

                const nameEl = /** @type {HTMLInputElement | null} */ (contactForm.querySelector('#name'));
                const emailEl = /** @type {HTMLInputElement | null} */ (contactForm.querySelector('#email'));
                const messageEl = /** @type {HTMLTextAreaElement | null} */ (contactForm.querySelector('#message'));
                const submitButton = /** @type {HTMLButtonElement | null} */ (contactForm.querySelector('button[type="submit"]'));
                if (!nameEl || !emailEl || !messageEl || !submitButton) return;

                const name = nameEl.value.trim();
                const email = emailEl.value.trim();
                const message = messageEl.value.trim();
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!name || !email || !message) {
                    showToast(translations[currentLang]?.form_required || 'Please fill in all fields.', true);
                    [nameEl, emailEl, messageEl].find(field => !field.value.trim())?.focus();
                    return;
                }
                if (!emailPattern.test(email)) {
                    showToast(translations[currentLang]?.form_invalid_email || 'Please enter a valid email address.', true);
                    emailEl.focus();
                    return;
                }

                isSubmitting = true;
                const formData = new FormData(contactForm);
                const submittedValues = [nameEl.value, emailEl.value, messageEl.value];

                // aria-disabled keeps keyboard focus on the button (a disabled element
                // loses it); isSubmitting already ignores further submissions.
                submitButton.setAttribute('aria-disabled', 'true');
                submitButton.dataset.i18nKey = 'form_sending_button';
                submitButton.textContent = translations[currentLang]?.form_sending_button || 'Sending...';
                contactForm.setAttribute('aria-busy', 'true');

                const restore = () => {
                    isSubmitting = false;
                    submitButton.removeAttribute('aria-disabled');
                    submitButton.dataset.i18nKey = 'form_send_button';
                    submitButton.textContent = translations[currentLang]?.form_send_button || 'Send message';
                    contactForm.setAttribute('aria-busy', 'false');
                };
                const finishOk = () => {
                    showToast(translations[currentLang]?.form_success_message || "Thank you! Your message has been sent.");
                    // Keep any new draft written while the submitted message was in flight.
                    const fields = [nameEl, emailEl, messageEl];
                    if (fields.every((field, index) => field.value === submittedValues[index])) contactForm.reset();
                    trackEvent('contact_form_submit', { form_name: 'contact', language: currentLang });
                };

                // Fallback: until a Web3Forms access key is configured, open a pre-filled email draft.
                const accessKey = ((/** @type {HTMLInputElement | null} */ (contactForm.querySelector('[name="access_key"]')))?.value || '').trim();
                if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
                    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
                    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
                    window.location.href = `mailto:rushikeshpawar197@gmail.com?subject=${subject}&body=${body}`;
                    // A mailto handoff cannot confirm delivery or even an available mail app.
                    // Preserve the draft so the visitor can copy it or retry.
                    restore();
                    return;
                }

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);

                fetch("https://api.web3forms.com/submit", {
                    method: "POST",
                    body: formData,
                    signal: controller.signal,
                })
                .then(async (response) => {
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || !data.success) throw new Error(data.message || 'Submission failed');
                    finishOk();
                })
                .catch((err) => {
                    if (err.name === 'AbortError') {
                        showToast(translations[currentLang]?.form_timeout || 'Request timed out. Please try again.', true);
                    } else {
                        console.error('Form error:', err);
                        showToast(translations[currentLang]?.form_error_message || 'Sorry, an error occurred.', true);
                    }
                })
                .finally(() => { clearTimeout(timeout); restore(); });
            });
        }

        /* ── COPY EMAIL ────────────────────────────────────── */

        document.querySelectorAll('.copy-email-btn').forEach(el => {
            const btn = /** @type {HTMLButtonElement} */ (el);
            const label = btn.querySelector('[data-i18n-key="copy_email"]');
            const icon = btn.querySelector('svg use');
            const originalIcon = icon?.getAttribute('href');
            // The button's name stays "Copy email address", so the result is announced here.
            const status = btn.parentElement?.querySelector('[data-copy-status]');
            if (!label) return;
            let copying = false;
            /** @param {boolean} busy */
            const setCopying = busy => {
                copying = busy;
                // aria-disabled, unlike disabled, keeps keyboard focus on the button.
                if (busy) btn.setAttribute('aria-disabled', 'true');
                else btn.removeAttribute('aria-disabled');
            };
            btn.addEventListener('click', () => {
                if (copying) return;
                const email = btn.dataset.email || '';
                if (!navigator.clipboard || !navigator.clipboard.writeText) {
                    showToast(email, false);
                    return;
                }
                // Preserve the translated label node through both asynchronous states.
                setCopying(true);
                btn.setAttribute('aria-busy', 'true');
                navigator.clipboard.writeText(email).then(() => {
                    btn.setAttribute('aria-busy', 'false');
                    icon?.setAttribute('href', '#i-check');
                    label.setAttribute('data-i18n-key', 'copied');
                    label.textContent = translations[currentLang]?.copied || 'Copied!';
                    if (status) status.textContent = label.textContent;
                    setTimeout(() => {
                        if (originalIcon) icon?.setAttribute('href', originalIcon);
                        label.setAttribute('data-i18n-key', 'copy_email');
                        label.textContent = translations[currentLang]?.copy_email || 'Copy';
                        if (status) status.textContent = '';
                        setCopying(false);
                    }, 2000);
                }).catch(() => {
                    setCopying(false);
                    btn.setAttribute('aria-busy', 'false');
                    showToast(email, false);
                });
            });
        });

        /* ── INTERSECTION OBSERVERS ────────────────────────── */

        // Count-up animation
        const countUpObs = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = /** @type {HTMLElement} */ (entry.target);
                // Respect reduced-motion: leave the final value as-is (no count-up)
                obs.unobserve(el);
                el.dataset.counted = '1'; // this instance has tallied - never again
                if (prefersReducedMotion) {
                    // Keep the settled rule visible if motion is enabled later.
                    el.closest('.impact-card')?.querySelector('.closing-rule')?.classList.add('drawn');
                    return;
                }
                const match = (el.textContent || '').trim().match(/^(\d+)(%|x|\+)?$/);
                if (!match) {
                    el.closest('.impact-card')?.querySelector('.closing-rule')?.classList.add('drawn');
                    return;
                }
                const target = parseInt(match[1], 10);
                const suffix = match[2] || '';
                const start = performance.now();
                let lastText = el.textContent;
                // A short tally keeps its unit visible so the metric stays legible.
                /** @param {number} now */
                const tick = (now) => {
                    // Translated rich text can replace a metric during its tally.
                    if (!el.isConnected) return;
                    const t = prefersReducedMotion ? 1 : Math.min((now - start) / 850, 1);
                    const text = Math.round((1 - Math.pow(1 - t, 5)) * target) + suffix;
                    if (text !== lastText) {
                        el.textContent = text;
                        lastText = text;
                    }
                    if (t < 1) {
                        requestAnimationFrame(tick);
                    } else {
                        // draw the audit line under the total, after it settles
                        const card = el.closest('.impact-card');
                        const rule = card && card.querySelector('.closing-rule');
                        if (rule) rule.classList.add('drawn');
                    }
                };
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.5 }) : null;
        // hoisted so toggleLanguage (defined earlier, runs post-init) can call it.
        // skipInView: on a language toggle, never reset a number the user is
        // currently looking at - that reset-and-re-tally was a visible glitch.
        /** @param {boolean} [skipInView] */
        function observeMetrics(skipInView) {
            // Release old rich-text spans before registering their translated replacements.
            countUpObs?.disconnect();
            const metrics = Array.from(document.querySelectorAll('.metric-highlight'), node => /** @type {HTMLElement} */ (node))
                .filter(el => !el.dataset.counted);
            const viewportHeight = window.innerHeight;
            // Read every rectangle before dataset/class changes invalidate layout.
            const settled = new Set(!countUpObs ? metrics : skipInView ? metrics.filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.top < viewportHeight && rect.bottom > 0;
            }) : []);
            metrics.forEach(el => {
                if (settled.has(el)) {
                    // Keep visible totals at their final value and settle their rule.
                    el.dataset.counted = '1';
                    el.closest('.impact-card')?.querySelector('.closing-rule')?.classList.add('drawn');
                } else countUpObs?.observe(el);
            });
        }
        observeMetrics(false);

        // Closing rules "draw" left→right when they enter view. Only metrics
        // with a count-up draw their rule when the tally finishes; formatted
        // static values (such as currency) reveal their rule normally.
        const ruleObs = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('drawn');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.6 }) : null;
        document.querySelectorAll('.closing-rule').forEach(el => {
            if (el.closest('.impact-card')?.querySelector('.metric-highlight')) return;
            if (ruleObs) ruleObs.observe(el);
            else el.classList.add('drawn');
        });

        // Section reveal + stagger items (unified observer)
        const revealObs = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('section-reveal')) entry.target.classList.add('revealed');
                    if (entry.target.classList.contains('stagger-item')) entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        // Long case-study sections must reveal even when only their leading edge fits.
        }, { threshold: 0, rootMargin: '0px 0px -50px 0px' }) : null;

        document.querySelectorAll('.section-reveal, .stagger-item').forEach(el => {
            if (revealObs) revealObs.observe(el);
            else {
                if (el.classList.contains('section-reveal')) el.classList.add('revealed');
                if (el.classList.contains('stagger-item')) el.classList.add('visible');
            }
        });

        /* ── AI FINANCE BOT ────────────────────────────────── */

        const financeBot = initFinanceBot(translations);
        document.documentElement.classList.add('motion-ready');

        // Native disclosures keep supporting projects compact, including without JS.
        const disclosures = initAnimatedDisclosures(motionPreference);
        /** @param {Element} target */
        function revealDisclosurePath(target) {
            const ancestors = [];
            for (let details = target.closest('details'); details; details = details.parentElement?.closest('details') || null) {
                ancestors.push(details);
            }
            // Reveal the outer project before an optional analysis or technical
            // subsection so a legacy deep link never opens hidden content only.
            ancestors.reverse().forEach(details => disclosures.open(details));
        }
        // Direct project and role links reveal their details before the anchor scrolls.
        /** @param {string} hash */
        function revealLinkedDisclosure(hash) {
            let id;
            try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
            const target = document.getElementById(id);
            if (!target) return;
            // A bookmarked demo or citation must reveal the same content as a click.
            if (target.closest('#dynamic-island-container')) {
                financeBot?.expand(false);
                if (target instanceof HTMLDetailsElement) target.open = true;
            }
            const details = target.matches('.featured-project, .project-preview')
                ? target.querySelector('details.case-details')
                : target.closest('details');
            if (details) revealDisclosurePath(details);
        }
        document.querySelectorAll('details.analysis-details').forEach(details => {
            details.addEventListener('toggle', () => {
                if (details instanceof HTMLDetailsElement && details.open) revealDisclosurePath(details);
            });
        });
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', event => {
                if (isCurrentPageActivation(event)) revealLinkedDisclosure(link.getAttribute('href') || '');
            });
        });
        window.addEventListener('hashchange', () => revealLinkedDisclosure(window.location.hash));
        revealLinkedDisclosure(window.location.hash);

        /** @type {HTMLDetailsElement[]} */
        let printDisclosures = [];
        window.addEventListener('beforeprint', () => {
            // Finish at the requested state before remembering what print must restore.
            disclosures.finishAll();
            printDisclosures = [...document.querySelectorAll('details.case-details, details.experience-details, details.analysis-details')]
                .filter(el => el instanceof HTMLDetailsElement && !el.open)
                .map(el => /** @type {HTMLDetailsElement} */ (el));
            printDisclosures.forEach(el => { el.open = true; });
        });
        window.addEventListener('afterprint', () => {
            printDisclosures.forEach(el => { el.open = false; });
            printDisclosures = [];
        });

        // Move keyboard focus into the revealed demo after an explicit link activation.
        document.querySelectorAll('a[href="#dynamic-island-container"]').forEach(link => {
            link.addEventListener('click', event => {
                if (!isCurrentPageActivation(event)) return;
                const island = document.getElementById('dynamic-island-container');
                if (island) document.getElementById('close-island-btn')?.focus({ preventScroll: true });
            });
        });

        /* ── COPYRIGHT YEAR ────────────────────────────────── */

        const yearEl = document.getElementById('copyright-year');
        if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    } catch (error) {
        document.documentElement.classList.remove('motion-ready');
        console.error("Page init error:", error);
    } finally {
        document.body.classList.add('lang-loaded');
    }
});

/* ── NATIVE DISCLOSURE MOTION ───────────────────────────── */
/** @param {MediaQueryList} motionPreference */
function initAnimatedDisclosures(motionPreference) {
    /** @type {Map<HTMLDetailsElement, (open?: boolean) => void>} */
    const controls = new Map();
    document.querySelectorAll('details.case-details, details.experience-details').forEach(details => {
        if (!(details instanceof HTMLDetailsElement)) return;
        const summary = details.querySelector('summary');
        if (!summary) return;
        /** @type {Animation | null} */
        let animation = null;
        let targetOpen = details.open;
        const originalOverflow = details.style.overflow;
        /** @type {{ top: number } | null} */
        let summaryPosition = null;
        /** @type {AbortController | null} */
        let positionEvents = null;

        const releaseSummaryPosition = () => {
            summaryPosition = null;
            positionEvents?.abort();
            positionEvents = null;
        };

        // A case can span a new grid row when opened. Keep its activated control
        // in view without making later scrolling or linked navigation sticky.
        const restoreSummaryPosition = () => {
            if (!summaryPosition) return;
            const offset = summary.getBoundingClientRect().top - summaryPosition.top;
            if (Math.abs(offset) > 1) window.scrollBy({ top: offset, behavior: 'instant' });
        };
        /** @param {boolean} [release] */
        const settleSummaryPosition = (release = false) => {
            const position = summaryPosition;
            restoreSummaryPosition();
            // Native scroll anchoring can settle after the layout mutation.
            requestAnimationFrame(() => {
                if (summaryPosition !== position) return;
                restoreSummaryPosition();
                if (release) releaseSummaryPosition();
            });
        };

        /** @param {boolean} [open] @param {boolean} [preservePosition] */
        const finish = (open, preservePosition = false) => {
            const restore = preservePosition && summaryPosition;
            const next = open ?? (animation ? targetOpen : details.open);
            if (animation) {
                animation.onfinish = null;
                animation.cancel();
                animation = null;
            }
            details.open = next;
            targetOpen = next;
            details.style.overflow = originalOverflow;
            delete details.dataset.disclosureState;
            if (restore) settleSummaryPosition(true);
            else releaseSummaryPosition();
        };
        controls.set(details, finish);

        // Enter and Space already dispatch a click on native summary controls.
        // Intercept only activation; links inside a summary keep their own behavior.
        summary.addEventListener('click', event => {
            if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('a, button, input, select, textarea'))) return;
            event.preventDefault();
            releaseSummaryPosition();
            summaryPosition = { top: summary.getBoundingClientRect().top };
            positionEvents = new AbortController();
            // Real navigation/scroll input wins over the short layout correction.
            // A scroll event alone also fires for the browser's own anchoring.
            for (const type of ['wheel', 'touchmove', 'pointerdown', 'keydown']) {
                window.addEventListener(type, releaseSummaryPosition, { passive: true, signal: positionEvents.signal });
            }
            targetOpen = !(animation ? targetOpen : details.open);
            if (motionPreference.matches || window.matchMedia('print').matches || typeof details.animate !== 'function') {
                finish(targetOpen, true);
                return;
            }

            // Read the currently painted height before cancelling, so a quick second
            // activation reverses naturally instead of jumping to either endpoint.
            const startHeight = details.getBoundingClientRect().height;
            if (animation) {
                animation.onfinish = null;
                animation.cancel();
            }
            details.dataset.disclosureState = targetOpen ? 'opening' : 'closing';
            details.open = targetOpen;
            const endHeight = details.getBoundingClientRect().height;
            // Keep content rendered until a closing animation reaches its endpoint.
            details.open = true;
            details.style.overflow = 'clip';
            try {
                animation = details.animate([
                    { height: `${startHeight}px` },
                    { height: `${endHeight}px` },
                ], { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
                settleSummaryPosition();
                animation.onfinish = () => finish(targetOpen, true);
            } catch {
                // Unsupported animation engines still retain a usable native control.
                finish(targetOpen, true);
            }
        });
        // Lazy-loaded media can change the natural height during an expansion.
        details.addEventListener('load', () => { if (animation) finish(undefined, true); }, true);
    });

    document.documentElement.classList.add('disclosures-ready');
    const finishAll = () => controls.forEach(finish => finish());
    motionPreference.addEventListener('change', event => { if (event.matches) finishAll(); });
    window.addEventListener('resize', finishAll, { passive: true });
    window.addEventListener('hashchange', finishAll);
    document.addEventListener('portfolio:languagechange', finishAll);
    return {
        finishAll,
        /** @param {HTMLDetailsElement} details */
        open(details) {
            const finish = controls.get(details);
            if (finish) finish(true);
            else details.open = true;
        },
    };
}

/* ── AI FINANCE BOT (Dynamic Island) ──────────────────────── */
/** @param {Record<string, Record<string, string>>} demoTranslations */
function initFinanceBot(demoTranslations) {
    const islandContainer = document.getElementById('dynamic-island-container');
    if (!islandContainer) return;

    const closeButton = document.getElementById('close-island-btn');
    // Cast to non-null after the guard below: the nested helpers are closures,
    // so TS can't carry the null-narrowing into them.
    const messagesContainer = /** @type {HTMLElement} */ (document.getElementById('bot-messages-apple'));
    const promptsContainer = /** @type {HTMLElement} */ (document.getElementById('bot-question-prompts-apple'));
    if (!messagesContainer || !promptsContainer) return;
    let isBotTyping = false;
    /** @type {number[]} */
    let botTimers = [];

    function clearBotTimers() {
        botTimers.forEach(clearTimeout);
        botTimers = [];
        isBotTyping = false;
    }

    /** @param {string} key */
    const tr = key => demoTranslations[document.documentElement.lang]?.[key] || demoTranslations.en?.[key] || '';
    const questionKeys = ['q1', 'q2', 'q3'];
    document.addEventListener('portfolio:languagechange', () => {
        if (islandContainer.classList.contains('expanded')) initBotUI();
    });

    // The ticket is a div - make it a keyboard-operable disclosure control
    islandContainer.setAttribute('role', 'button');
    islandContainer.setAttribute('tabindex', '0');
    islandContainer.setAttribute('aria-expanded', 'false');

    /** @param {boolean} [moveFocus] */
    const expand = (moveFocus = true) => {
        if (islandContainer.classList.contains('collapsed')) {
            islandContainer.classList.remove('collapsed');
            islandContainer.classList.add('expanded');
            // open panel holds real buttons - it must not itself be a button
            islandContainer.removeAttribute('role');
            islandContainer.setAttribute('tabindex', '-1');
            islandContainer.setAttribute('aria-expanded', 'true');
            initBotUI();
            if (moveFocus) closeButton?.focus({ preventScroll: true });
        }
    };

    const collapse = () => {
        if (islandContainer.classList.contains('expanded')) {
            islandContainer.classList.remove('expanded');
            islandContainer.classList.add('collapsed');
            islandContainer.setAttribute('role', 'button');
            islandContainer.setAttribute('tabindex', '0');
            islandContainer.setAttribute('aria-expanded', 'false');
            clearBotTimers();
        }
    };

    islandContainer.addEventListener('click', () => expand());
    islandContainer.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && islandContainer.classList.contains('collapsed')) {
            e.preventDefault();
            expand();
        } else if (e.key === 'Escape' && islandContainer.classList.contains('expanded')) {
            collapse();
            islandContainer.focus();
        }
    });
    if (closeButton) closeButton.addEventListener('click', (e) => { e.stopPropagation(); collapse(); islandContainer.focus({ preventScroll: true }); });

    /** @param {string} sender @param {string} content */
    function addMsg(sender, content) {
        const wrapper = document.createElement('div');
        wrapper.className = `bot-message-wrapper ${sender}-message`;
        const bubble = document.createElement('div');
        bubble.className = 'bot-message-bubble';
        bubble.textContent = content;
        wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /** @param {string} sender @param {Node} element */
    function addMsgElement(sender, element) {
        const wrapper = document.createElement('div');
        wrapper.className = `bot-message-wrapper ${sender}-message`;
        const bubble = document.createElement('div');
        bubble.className = 'bot-message-bubble';
        bubble.appendChild(element);
        wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /** @param {string} key */
    function handleQ(key) {
        if (isBotTyping) return;
        isBotTyping = true;
        // aria-disabled, unlike disabled, keeps keyboard focus (and Escape) inside the demo.
        promptsContainer.querySelectorAll('button').forEach(b => { b.setAttribute('aria-disabled', 'true'); });
        addMsg('user', tr('demo_' + key));
        messagesContainer.setAttribute('aria-busy', 'true');
        botTimers.push(setTimeout(() => {
            addMsg('bot', tr('demo_a' + key.slice(1)));
            const sourceLink = document.createElement('a');
            sourceLink.href = '#demo-source';
            sourceLink.className = 'case-link';
            sourceLink.textContent = tr('demo_citation');
            sourceLink.addEventListener('click', event => {
                if (!isCurrentPageActivation(event)) return;
                const source = /** @type {HTMLDetailsElement | null} */ (document.getElementById('demo-source'));
                if (source) source.open = true;
            });
            addMsgElement('bot', sourceLink);
            isBotTyping = false;
            messagesContainer.setAttribute('aria-busy', 'false');
            promptsContainer.querySelectorAll('button').forEach(b => { b.removeAttribute('aria-disabled'); });
        }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350));
    }

    function initBotUI() {
        clearBotTimers();
        while (messagesContainer.firstChild) messagesContainer.firstChild.remove();
        while (promptsContainer.firstChild) promptsContainer.firstChild.remove();
        messagesContainer.setAttribute('aria-busy', 'false');
        addMsg('bot', tr('demo_greeting'));
        const svgNS = 'http://www.w3.org/2000/svg';
        questionKeys.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'prompt-button';
            const spanEl = document.createElement('span');
            spanEl.textContent = tr('demo_' + key);
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('class', 'w-4 h-4');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('viewBox', '0 0 24 24');
            const pathEl = document.createElementNS(svgNS, 'path');
            pathEl.setAttribute('stroke-linecap', 'round');
            pathEl.setAttribute('stroke-linejoin', 'round');
            pathEl.setAttribute('stroke-width', '2');
            pathEl.setAttribute('d', 'M9 5l7 7-7 7');
            svg.appendChild(pathEl);
            btn.appendChild(spanEl);
            btn.appendChild(svg);
            btn.onclick = () => handleQ(key);
            promptsContainer.appendChild(btn);
        });
    }

    return { expand };
}
