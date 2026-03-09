/* ============================================================
   PORTFOLIO — Main JavaScript
   Rushikesh Pawar — Data Analytics Portfolio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    try {
        // ── TRANSLATIONS ──
        let translations = {};
        try {
            translations = JSON.parse(document.getElementById('translations-data').textContent);
        } catch (e) {
            console.error("Failed to parse translations.", e);
            translations = { en: {}, de: {} };
        }

        let currentLang = document.documentElement.lang || 'en';
        const langToggleHeader = document.getElementById("lang-toggle-header");
        const langToggleMobile = document.getElementById("lang-toggle-mobile");

        function translatePage() {
            document.querySelectorAll("[data-i18n-key]").forEach(el => {
                const key = el.getAttribute("data-i18n-key");
                const t = translations[currentLang]?.[key];
                if (!t) return;
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = t;
                } else if (el.children.length === 0) {
                    el.textContent = t;
                }
            });
            const next = currentLang === 'de' ? 'EN' : 'DE';
            const title = translations[currentLang]?.['lang_toggle_title'];
            if (langToggleHeader) { langToggleHeader.textContent = next; if (title) langToggleHeader.title = title; }
            if (langToggleMobile) { langToggleMobile.textContent = next; if (title) langToggleMobile.title = title; }
            document.documentElement.lang = currentLang;
        }

        function toggleLanguage() {
            currentLang = currentLang === 'de' ? 'en' : 'de';
            translatePage();
        }

        if (langToggleHeader) langToggleHeader.addEventListener("click", toggleLanguage);
        if (langToggleMobile) langToggleMobile.addEventListener("click", toggleLanguage);
        translatePage();

        // ── THEME TOGGLE ──
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
            });
        }

        // ── MOBILE MENU ──
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
            mobileMenu.querySelectorAll('a, button').forEach(link =>
                link.addEventListener('click', () => mobileMenu.classList.add('hidden'))
            );
        }

        // ── TOAST HELPER ──
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

        // ── NAV HIGHLIGHTING (desktop) ──
        const sections = document.querySelectorAll('main section[id]');
        const navLinks = document.querySelectorAll('header nav ul li a');

        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active-link');
                        if (link.getAttribute('href') === `#${id}`) link.classList.add('active-link');
                    });
                }
            });
        }, { rootMargin: '0px', threshold: 0.5 });

        sections.forEach(s => navObserver.observe(s));

        // ── BOTTOM NAV HIGHLIGHTING (mobile) ──
        const bottomNavLinks = document.querySelectorAll('#bottom-nav a');
        const bottomNavObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    bottomNavLinks.forEach(link =>
                        link.classList.toggle('active-bottom', link.getAttribute('href') === `#${id}`)
                    );
                }
            });
        }, { rootMargin: '0px', threshold: 0.5 });

        sections.forEach(s => bottomNavObserver.observe(s));

        // ── HEADER SHADOW ON SCROLL ──
        const header = document.querySelector('header');
        window.addEventListener('scroll', () => {
            if (header) header.classList.toggle('scrolled', window.scrollY > 8);
        }, { passive: true });

        // ── CONTACT FORM ──
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(contactForm);
                const submitButton = contactForm.querySelector('button[type="submit"]');
                const origText = submitButton.textContent;

                submitButton.disabled = true;
                submitButton.textContent = translations[currentLang]?.form_sending_button || 'Sending...';

                fetch("/", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams(formData).toString(),
                })
                .then(() => {
                    showToast(translations[currentLang]?.form_success_message || "Thank you! Your message has been sent.");
                    contactForm.reset();
                })
                .catch((err) => {
                    console.error('Form error:', err);
                    showToast(translations[currentLang]?.form_error_message || 'Sorry, an error occurred.', true);
                })
                .finally(() => { submitButton.disabled = false; submitButton.textContent = origText; });
            });
        }

        // ── SCROLL TO TOP + READING PROGRESS ──
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        const readProgress = document.getElementById('read-progress');
        window.addEventListener('scroll', () => {
            if (scrollTopBtn) scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
            if (readProgress) {
                const h = document.documentElement.scrollHeight - window.innerHeight;
                readProgress.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%';
            }
        }, { passive: true });
        if (scrollTopBtn) scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        // ── COPY EMAIL ──
        document.querySelectorAll('.copy-email-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.dataset.email;
                navigator.clipboard.writeText(email).then(() => {
                    const orig = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
                    btn.disabled = true;
                    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 2000);
                }).catch(() => prompt('Copy this email:', email));
            });
        });

        // ── COUNT-UP ANIMATION ──
        const countUpObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const match = el.textContent.trim().match(/^(\d+)(%|x|\+)?$/);
                if (!match) return;
                const target = parseInt(match[1], 10);
                const suffix = match[2] || '';
                const start = performance.now();
                const tick = (now) => {
                    const t = Math.min((now - start) / 1200, 1);
                    el.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target) + suffix;
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                obs.unobserve(el);
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.metric-highlight').forEach(el => countUpObs.observe(el));

        // ── TIMELINE SCROLL PROGRESS ──
        const expSection = document.getElementById('experience');
        const timelineProgress = document.querySelector('.timeline-progress');
        if (expSection && timelineProgress) {
            let isExp = false;
            const expObs = new IntersectionObserver(entries => {
                entries.forEach(e => { isExp = e.isIntersecting; });
            }, { threshold: 0 });
            expObs.observe(expSection);

            window.addEventListener('scroll', () => {
                if (!isExp) return;
                const rect = expSection.getBoundingClientRect();
                const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
                timelineProgress.style.height = `${progress * 100}%`;
            });
        }

        // ── TIMELINE CARD ACTIVE STATE ──
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

        // ── SECTION REVEAL ON SCROLL ──
        const revealObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.section-reveal').forEach(el => revealObs.observe(el));

        // ── STAGGER ITEMS ──
        const staggerObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    staggerObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.stagger-item').forEach(el => staggerObs.observe(el));


        // ── KEYBOARD SHORTCUTS ──
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
            if (e.key === 't' || e.key === 'T') {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                showToast(`Theme: ${next === 'dark' ? 'Dark' : 'Light'}`);
            } else if (e.key === '?') {
                const island = document.getElementById('dynamic-island-container');
                if (island && island.classList.contains('collapsed')) {
                    island.click();
                    island.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    showToast('AI Finance Bot opened');
                }
            }
        });


        // ── AI FINANCE BOT ──
        initFinanceBot();

        // ── COPYRIGHT YEAR ──
        const yearEl = document.getElementById('copyright-year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

    } catch (error) {
        console.error("Page init error:", error);
    } finally {
        document.body.classList.add('lang-loaded');
    }
});

/* ── AI FINANCE BOT (Dynamic Island) ── */
function initFinanceBot() {
    const islandContainer = document.getElementById('dynamic-island-container');
    if (!islandContainer) return;

    const closeButton = document.getElementById('close-island-btn');
    const messagesContainer = document.getElementById('bot-messages-apple');
    const promptsContainer = document.getElementById('bot-question-prompts-apple');
    let isBotTyping = false;

    const simData = {
        'q1': { question: "What was our Q3 revenue vs. budget?", answer: "In Q3, we achieved a revenue of \u20AC1.2M, which is 105% of our \u20AC1.14M budget. Great work by the team!" },
        'q2': { question: "What are our top 5 expenses this month?", answer: "Top 5 expenses: Salaries (\u20AC250k), Marketing (\u20AC120k), Cloud Services (\u20AC85k), Office Rent (\u20AC45k), Software Licenses (\u20AC30k)." },
        'q3': { question: "How is the sales funnel health?", answer: "Sales funnel is healthy \u2014 15% increase in qualified leads. However, MQL\u2192SQL conversion rate dropped 5%, worth investigating." }
    };

    const expand = () => {
        if (islandContainer.classList.contains('collapsed')) {
            islandContainer.classList.remove('collapsed');
            islandContainer.classList.add('expanded');
            initBotUI();
        }
    };

    const collapse = () => {
        if (islandContainer.classList.contains('expanded')) {
            islandContainer.classList.remove('expanded');
            islandContainer.classList.add('collapsed');
        }
    };

    islandContainer.addEventListener('click', expand);
    if (closeButton) closeButton.addEventListener('click', (e) => { e.stopPropagation(); collapse(); });

    function addMsg(sender, content, isHtml) {
        const wrapper = document.createElement('div');
        wrapper.className = `bot-message-wrapper ${sender}-message`;
        const bubble = document.createElement('div');
        bubble.className = 'bot-message-bubble';
        if (isHtml) bubble.innerHTML = content; else bubble.textContent = content;
        wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTyping(show) {
        const existing = document.getElementById('bot-typing-indicator');
        if (existing) existing.remove();
        if (show) {
            const el = document.createElement('div');
            el.id = 'bot-typing-indicator';
            el.className = 'bot-message-wrapper bot-message';
            el.innerHTML = `<div class="bot-message-bubble"><div class="typing-indicator-apple"><span></span><span></span><span></span></div></div>`;
            messagesContainer.appendChild(el);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    function handleQ(key) {
        if (isBotTyping) return;
        isBotTyping = true;
        promptsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        const d = simData[key];
        addMsg('user', d.question);

        setTimeout(() => {
            addMsg('bot', `<div class="analysis-animation"><svg viewBox="0 0 100 50"><path d="M 10 40 C 20 10, 30 10, 40 25 S 60 40, 70 20 S 90 10, 90 10" stroke="var(--apple-blue)" fill="none" stroke-width="3" stroke-linecap="round"><animate attributeName="d" values="M 10 40 C 20 10, 30 10, 40 25 S 60 40, 70 20 S 90 10, 90 10;M 10 20 C 20 40, 30 40, 40 15 S 60 10, 70 30 S 90 40, 90 40;M 10 40 C 20 10, 30 10, 40 25 S 60 40, 70 20 S 90 10, 90 10" dur="2s" repeatCount="indefinite"/></path></svg><p class="text-xs" style="color:var(--apple-text-secondary)">Analyzing data...</p></div>`, true);
        }, 500);

        setTimeout(() => {
            const anim = messagesContainer.querySelector('.analysis-animation');
            if (anim) anim.closest('.bot-message-wrapper').remove();
            showTyping(true);
        }, 2500);

        setTimeout(() => {
            showTyping(false);
            addMsg('bot', d.answer);
            isBotTyping = false;
            promptsContainer.querySelectorAll('button').forEach(b => b.disabled = false);
        }, 3500);
    }

    function initBotUI() {
        messagesContainer.innerHTML = '';
        promptsContainer.innerHTML = '';
        addMsg('bot', 'Hello! I\'m a simulation of the Finance Bot. Select a question below to see how I work.');
        Object.keys(simData).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'prompt-button';
            btn.innerHTML = `<span>${simData[key].question}</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`;
            btn.onclick = () => handleQ(key);
            promptsContainer.appendChild(btn);
        });
    }
}
