/* ============================================================
   PORTFOLIO - Main JavaScript
   Rushikesh Pawar - Data Analytics Portfolio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    try {
        /* ── UTILITIES ─────────────────────────────────────── */

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

        function translatePage() {
            document.querySelectorAll("[data-i18n-key]").forEach(el => {
                const key = el.getAttribute("data-i18n-key");
                if (!key) return;
                const t = translations[currentLang]?.[key];
                if (!t) return;
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    (/** @type {HTMLInputElement} */ (el)).placeholder = t;
                } else if (el.hasAttribute('data-i18n-html')) {
                    // Author-controlled translation strings only (safe, static markup like <span>/<strong>)
                    el.innerHTML = t;
                } else if (el.children.length === 0) {
                    el.textContent = t;
                }
            });
            const next = currentLang === 'de' ? 'EN' : 'DE';
            const title = translations[currentLang]?.['lang_toggle_title'];
            if (langToggleHeader) { langToggleHeader.textContent = next; if (title) langToggleHeader.title = title; }
            if (langToggleMobile) { langToggleMobile.textContent = next; if (title) langToggleMobile.title = title; }
            document.querySelectorAll('[data-i18n-aria]').forEach(el => {
                const key = el.getAttribute('data-i18n-aria');
                if (key && translations[currentLang]?.[key]) el.setAttribute('aria-label', translations[currentLang][key]);
            });
            document.documentElement.lang = currentLang;
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

        /** @param {string} next */
        function setTheme(next) {
            const apply = () => {
                document.documentElement.setAttribute('data-theme', next);
                try { localStorage.setItem('theme', next); } catch {}
                syncThemeColor(next);
            };
            // Cross-fade the whole sheet like turning a page (progressive enhancement)
            if (document.startViewTransition && !prefersReducedMotion) {
                document.documentElement.classList.add('theme-switching');
                const vt = document.startViewTransition(apply);
                vt.finished.finally(() => document.documentElement.classList.remove('theme-switching'));
            } else {
                apply();
            }
        }

        const themeToggle = document.getElementById('theme-toggle');
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
            mobileMenuButton.addEventListener('click', () => {
                const open = !mobileMenu.classList.toggle('hidden');
                mobileMenuButton.setAttribute('aria-expanded', String(open));
            });
            mobileMenu.querySelectorAll('a, button').forEach(link =>
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                })
            );
        }

        /* ── NAV HIGHLIGHTING (unified desktop + mobile) ──── */

        const sections = document.querySelectorAll('main section[id]');
        const navLinks = document.querySelectorAll('header nav ul li a');
        const bottomNavLinks = document.querySelectorAll('#bottom-nav a');

        // A fixed band at ~35-45% of the viewport decides the active section:
        // a 50%-visibility threshold is unreachable for sections taller than
        // twice the viewport (Experience, Projects), and unlinked sections
        // (#impact, #education) must not wipe the highlight.
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link =>
                    link.classList.toggle('active-link', link.getAttribute('href') === `#${id}`)
                );
                bottomNavLinks.forEach(link =>
                    link.classList.toggle('active-bottom', link.getAttribute('href') === `#${id}`)
                );
            });
        }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

        const linkedIds = new Set([...navLinks, ...bottomNavLinks].map(a => a.getAttribute('href')));
        sections.forEach(s => { if (linkedIds.has(`#${s.id}`)) navObserver.observe(s); });

        /* ── SCROLL HANDLER (rAF-throttled) ────────────────── */

        const scrollTopBtn = document.getElementById('scrollTopBtn');
        const readProgress = document.getElementById('read-progress');
        const header = document.querySelector('header');
        let scrollTicking = false;
        window.addEventListener('scroll', () => {
            if (!scrollTicking) {
                requestAnimationFrame(() => {
                    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
                    if (scrollTopBtn) scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
                    const h = document.documentElement.scrollHeight - window.innerHeight;
                    const ratio = h > 0 ? window.scrollY / h : 0;
                    if (readProgress) readProgress.style.width = `${ratio * 100}%`;
                    // drive the left-margin "folio ink" fill (CSS scaleY(var(--folio)))
                    document.documentElement.style.setProperty('--folio', String(ratio));
                    scrollTicking = false;
                });
                scrollTicking = true;
            }
        }, { passive: true });

        if (scrollTopBtn) scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        /* ── CURSOR GLOW ON GLASS CARDS ────────────────────── */

        if (window.matchMedia('(hover: hover)').matches && !prefersReducedMotion) {
            document.querySelectorAll('.glass-card').forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const el = /** @type {HTMLElement} */ (card);
                    const me = /** @type {MouseEvent} */ (e);
                    const rect = el.getBoundingClientRect();
                    el.style.setProperty('--mouse-x', `${me.clientX - rect.left}px`);
                    el.style.setProperty('--mouse-y', `${me.clientY - rect.top}px`);
                });
            });
        }

        /* ── COOKIE CONSENT (GDPR) ─────────────────────────── */

        const consentBanner = document.getElementById('cookie-consent-banner');
        let analyticsLoaded = false;
        function loadAnalytics() {
            if (analyticsLoaded) return;
            analyticsLoaded = true;
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://www.googletagmanager.com/gtag/js?id=G-H2TJQ5H08S';
            document.head.appendChild(s);
            if (typeof gtag === 'function') {
                gtag('js', new Date());
                gtag('config', 'G-H2TJQ5H08S', { anonymize_ip: true });
            }
        }
        if (consentBanner) {
            let storedConsent = null;
            try { storedConsent = localStorage.getItem('cookie-consent'); } catch {}
            if (!storedConsent) {
                consentBanner.hidden = false;
            } else if (storedConsent === 'granted') {
                if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'granted' });
                loadAnalytics();
            }
            /** @param {boolean} granted */
            const setConsent = (granted) => {
                try { localStorage.setItem('cookie-consent', granted ? 'granted' : 'denied'); } catch {}
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
                }
                if (granted) loadAnalytics();
                consentBanner.hidden = true;
            };
            document.getElementById('cookie-accept')?.addEventListener('click', () => setConsent(true));
            document.getElementById('cookie-decline')?.addEventListener('click', () => setConsent(false));
            document.getElementById('reopen-cookie-consent')?.addEventListener('click', () => { consentBanner.hidden = false; });
        }

        /* ── GA EVENT TRACKING (data-ga-event) ─────────────── */

        document.querySelectorAll('[data-ga-event]').forEach((el) => {
            const a = /** @type {HTMLAnchorElement} */ (el);
            a.addEventListener('click', () => {
                if (typeof gtag === 'function') {
                    gtag('event', a.dataset.gaEvent, {
                        link_url: a.href || '',
                        link_text: (a.textContent || '').trim().slice(0, 80),
                    });
                }
            });
        });

        /* ── CONTACT FORM ──────────────────────────────────── */

        const contactForm = /** @type {HTMLFormElement | null} */ (document.getElementById('contact-form'));
        if (contactForm) {
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
                    return;
                }
                if (!emailPattern.test(email)) {
                    showToast(translations[currentLang].form_invalid_email, true);
                    return;
                }

                isSubmitting = true;
                const formData = new FormData(contactForm);
                const origText = submitButton.textContent;

                submitButton.disabled = true;
                submitButton.textContent = translations[currentLang]?.form_sending_button || 'Sending...';

                const restore = () => { isSubmitting = false; submitButton.disabled = false; submitButton.textContent = origText; };
                const finishOk = () => {
                    showToast(translations[currentLang]?.form_success_message || "Thank you! Your message has been sent.");
                    contactForm.reset();
                    if (typeof gtag === 'function') {
                        gtag('event', 'contact_form_submit', { form_name: 'contact', language: currentLang });
                    }
                };

                // Fallback: until a Web3Forms access key is configured, open a pre-filled email draft.
                const accessKey = ((/** @type {HTMLInputElement | null} */ (contactForm.querySelector('[name="access_key"]')))?.value || '').trim();
                if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
                    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
                    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
                    window.location.href = `mailto:rushikeshpawar197@gmail.com?subject=${subject}&body=${body}`;
                    contactForm.reset();
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
                        showToast(translations[currentLang].form_timeout, true);
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
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                const email = btn.dataset.email || '';
                if (!navigator.clipboard || !navigator.clipboard.writeText) {
                    showToast(email, false);
                    return;
                }
                // Snapshot + disable BEFORE the async write so a double-click
                // can't capture the mutated "Copied!" state as the original.
                btn.disabled = true;
                const origNodes = Array.from(btn.childNodes).map(n => n.cloneNode(true));
                navigator.clipboard.writeText(email).then(() => {
                    btn.textContent = '';
                    const svgNS = 'http://www.w3.org/2000/svg';
                    const icon = document.createElementNS(svgNS, 'svg');
                    icon.setAttribute('class', 'icon mr-1');
                    icon.setAttribute('aria-hidden', 'true');
                    const use = document.createElementNS(svgNS, 'use');
                    use.setAttribute('href', '#i-check');
                    icon.appendChild(use);
                    btn.appendChild(icon);
                    btn.appendChild(document.createTextNode(translations[currentLang].copied));
                    setTimeout(() => {
                        btn.textContent = '';
                        origNodes.forEach(n => btn.appendChild(n));
                        btn.disabled = false;
                    }, 2000);
                }).catch(() => {
                    btn.disabled = false;
                    showToast(email, false);
                });
            });
        });

        /* ── INTERSECTION OBSERVERS ────────────────────────── */

        // Count-up animation
        const countUpObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = /** @type {HTMLElement} */ (entry.target);
                // Respect reduced-motion: leave the final value as-is (no count-up)
                obs.unobserve(el);
                el.dataset.counted = '1'; // this instance has tallied - never again
                if (prefersReducedMotion) return;
                const match = (el.textContent || '').trim().match(/^(\d+)(%|x|\+)?$/);
                if (!match) return;
                const target = parseInt(match[1], 10);
                const suffix = match[2] || '';
                const start = performance.now();
                // Quintic ease-out: the figure tallies, decelerates, then the unit is posted last
                /** @param {number} now */
                const tick = (now) => {
                    const t = Math.min((now - start) / 1200, 1);
                    if (t < 1) {
                        el.textContent = String(Math.round((1 - Math.pow(1 - t, 5)) * target));
                        requestAnimationFrame(tick);
                    } else {
                        el.textContent = target + suffix;
                        // draw the audit line under the total, after it settles
                        const card = el.closest('.impact-card');
                        const rule = card && card.querySelector('.closing-rule');
                        if (rule) rule.classList.add('drawn');
                    }
                };
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.5 });
        // hoisted so toggleLanguage (defined earlier, runs post-init) can call it.
        // skipInView: on a language toggle, never reset a number the user is
        // currently looking at - that reset-and-re-tally was a visible glitch.
        /** @param {boolean} [skipInView] */
        function observeMetrics(skipInView) {
            document.querySelectorAll('.metric-highlight').forEach(node => {
                const el = /** @type {HTMLElement} */ (node);
                if (el.dataset.counted) return; // already tallied this instance
                if (skipInView) {
                    const r = el.getBoundingClientRect();
                    if (r.top < window.innerHeight && r.bottom > 0) return;
                }
                countUpObs.observe(el);
            });
        }
        observeMetrics(false);

        // Closing rules "draw" left→right when they enter view. The three
        // metric rules are drawn by the count-up above (audit-line-after-total),
        // so exclude them here.
        const ruleObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('drawn');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        document.querySelectorAll('.closing-rule').forEach(el => {
            if (el.closest('.impact-card')) return;
            ruleObs.observe(el);
        });

        // Timeline scroll progress
        const expSection = document.getElementById('experience');
        const timelineProgress = /** @type {HTMLElement | null} */ (document.querySelector('.timeline-progress'));
        if (expSection && timelineProgress) {
            let isExp = false;
            const expObs = new IntersectionObserver(entries => {
                entries.forEach(e => { isExp = e.isIntersecting; });
            }, { threshold: 0 });
            expObs.observe(expSection);

            let tlTicking = false;
            window.addEventListener('scroll', () => {
                if (!isExp || tlTicking) return;
                requestAnimationFrame(() => {
                    const rect = expSection.getBoundingClientRect();
                    // guard: section shorter than viewport would divide by <= 0
                    const denom = Math.max(1, rect.height - window.innerHeight);
                    const progress = Math.max(0, Math.min(1, -rect.top / denom));
                    timelineProgress.style.height = `${progress * 100}%`;
                    tlTicking = false;
                });
                tlTicking = true;
            }, { passive: true });
        }

        // Timeline card active state
        const timelineContainers = document.querySelectorAll('.timeline-container');
        if (timelineContainers.length) {
            const tlObs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        timelineContainers.forEach(c => c.classList.remove('timeline-card-active'));
                        entry.target.classList.add('timeline-card-active');
                    }
                });
            }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
            timelineContainers.forEach(c => tlObs.observe(c));
            timelineContainers[0]?.classList.add('timeline-card-active');
        }

        // Section reveal + stagger items (unified observer)
        const revealObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('section-reveal')) entry.target.classList.add('revealed');
                    if (entry.target.classList.contains('stagger-item')) entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        // Long case-study sections must reveal even when only their leading edge fits.
        }, { threshold: 0, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.section-reveal, .stagger-item').forEach(el => revealObs.observe(el));

        /* ── AI FINANCE BOT ────────────────────────────────── */

        initFinanceBot();
        document.documentElement.classList.add('motion-ready');

        // Native disclosures keep supporting projects compact, including without JS.
        // Direct case-study links reveal their details before the anchor scrolls.
        /** @param {string} hash */
        function revealLinkedCase(hash) {
            let id;
            try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
            const target = document.getElementById(id);
            if (!target) return;
            const details = target.matches('.featured-project, .project-preview')
                ? target.querySelector('details.case-details')
                : target.closest('details.case-details');
            if (details instanceof HTMLDetailsElement) details.open = true;
        }
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', () => revealLinkedCase(link.getAttribute('href') || ''));
        });
        window.addEventListener('hashchange', () => revealLinkedCase(window.location.hash));
        revealLinkedCase(window.location.hash);

        /** @type {HTMLDetailsElement[]} */
        let printDisclosures = [];
        window.addEventListener('beforeprint', () => {
            printDisclosures = [...document.querySelectorAll('details.case-details')]
                .filter(el => el instanceof HTMLDetailsElement && !el.open)
                .map(el => /** @type {HTMLDetailsElement} */ (el));
            printDisclosures.forEach(el => { el.open = true; });
        });
        window.addEventListener('afterprint', () => {
            printDisclosures.forEach(el => { el.open = false; });
            printDisclosures = [];
        });

        // Open the disclosure when visitors follow the case study's demo link.
        document.querySelectorAll('a[href="#dynamic-island-container"]').forEach(link => {
            link.addEventListener('click', () => {
                const island = document.getElementById('dynamic-island-container');
                if (island && island.classList.contains('collapsed')) island.click();
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

/* ── AI FINANCE BOT (Dynamic Island) ──────────────────────── */
function initFinanceBot() {
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

    /** @type {Record<string, Record<string, string>>} */
    const demoTranslations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}');
    /** @param {string} key */
    const tr = key => (demoTranslations[document.documentElement.lang] || demoTranslations.en)[key];
    const questionKeys = ['q1', 'q2', 'q3'];
    document.addEventListener('portfolio:languagechange', () => {
        if (islandContainer.classList.contains('expanded')) initBotUI();
    });

    // The ticket is a div - make it a keyboard-operable disclosure control
    islandContainer.setAttribute('role', 'button');
    islandContainer.setAttribute('tabindex', '0');
    islandContainer.setAttribute('aria-expanded', 'false');

    const expand = () => {
        if (islandContainer.classList.contains('collapsed')) {
            islandContainer.classList.remove('collapsed');
            islandContainer.classList.add('expanded');
            // open panel holds real buttons - it must not itself be a button
            islandContainer.removeAttribute('role');
            islandContainer.setAttribute('tabindex', '-1');
            islandContainer.setAttribute('aria-expanded', 'true');
            initBotUI();
            closeButton?.focus({ preventScroll: true });
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

    islandContainer.addEventListener('click', expand);
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
        promptsContainer.querySelectorAll('button').forEach(b => { b.disabled = true; });
        addMsg('user', tr('demo_' + key));
        messagesContainer.setAttribute('aria-busy', 'true');
        botTimers.push(setTimeout(() => {
            addMsg('bot', tr('demo_a' + key.slice(1)));
            const sourceLink = document.createElement('a');
            sourceLink.href = '#demo-source';
            sourceLink.className = 'case-link';
            sourceLink.textContent = tr('demo_citation');
            sourceLink.addEventListener('click', () => {
                const source = /** @type {HTMLDetailsElement | null} */ (document.getElementById('demo-source'));
                if (source) source.open = true;
            });
            addMsgElement('bot', sourceLink);
            isBotTyping = false;
            messagesContainer.setAttribute('aria-busy', 'false');
            promptsContainer.querySelectorAll('button').forEach(b => { b.disabled = false; });
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
}
