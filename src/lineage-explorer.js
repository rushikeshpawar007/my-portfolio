/* Illustrative lineage: one current row per deal; history is a separate branch. */
document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('[data-lineage-explorer]');
    if (!(root instanceof HTMLElement)) return;
    const explorer = root;
    /** @type {Record<string, Record<string, string>>} */
    let translations;
    try {
        translations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}');
    } catch {
        return; // Keep the complete authored example if translations cannot load.
    }
    const buttons = Array.from(explorer.querySelectorAll('button[data-lineage-step]'));
    const panels = Array.from(explorer.querySelectorAll('[data-lineage-panel]'));
    const next = explorer.querySelector('[data-lineage-follow]');
    const status = explorer.querySelector('[data-lineage-status]');
    const history = explorer.querySelector('[data-lineage-history]');
    /** @type {HTMLDetailsElement[]} */
    const disclosureAncestors = [];
    for (let details = explorer.closest('details'); details; details = details.parentElement?.closest('details') || null) {
        disclosureAncestors.push(details);
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const printMedia = matchMedia('print');
    let printing = printMedia.matches;
    /** @type {Animation[]} */
    let animations = [];
    let visible = false;
    let step = -1;
    const rows = Array.from(explorer.querySelectorAll('tr[data-lineage-amount]'));
    // Keep this explicit rule aligned with the illustrative SQL. An unrecognised
    // status must not silently enter the open pipeline alongside closed deals.
    const openStages = new Set(['Prospecting', 'Test/Demo/Meeting', 'Proposal/Price Quote', 'Negotiation/Review', 'Commitment']);
    const total = rows.reduce((sum, row) => sum + (openStages.has(row.getAttribute('data-lineage-stage') || '') ? Number(row.getAttribute('data-lineage-amount')) : 0), 0);
    const captions = ['lineage_source_status', 'lineage_model_status', 'lineage_report_status'];
    /** @type {Map<string, Intl.NumberFormat>} */
    const moneyFormats = new Map();
    /** @param {string} key */
    const text = key => translations[document.documentElement.lang]?.[key] || translations.en?.[key] || '';

    function cancelMotion() {
        animations.forEach(animation => animation.cancel());
        animations = [];
    }
    function render() {
        const locale = document.documentElement.lang === 'de' ? 'de-DE' : 'en-GB';
        let money = moneyFormats.get(locale);
        if (!money) {
            money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
            moneyFormats.set(locale, money);
        }
        explorer.querySelectorAll('[data-lineage-money]').forEach(element => {
            element.textContent = money.format(Number(element.getAttribute('data-lineage-money')));
        });
        const result = explorer.querySelector('[data-lineage-total]');
        if (result) result.textContent = money.format(total);
        if (next) next.textContent = text(step < 0 ? 'lineage_follow' : step === 2 ? 'lineage_restart' : 'lineage_next').replace('{amount}', money.format(total));
        if (status) status.textContent = text(step < 0 ? 'lineage_instruction' : captions[step]);
        explorer.dataset.lineageActive = String(step);
        buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === step)));
        panels.forEach((panel, index) => {
            panel.setAttribute('data-lineage-dependent', String(step >= 0 && index >= step));
            panel.setAttribute('data-lineage-current', String(index === step));
        });
        history?.setAttribute('data-lineage-dependent', String(step === 0));
    }
    /** @param {number} chosen */
    function select(chosen) {
        cancelMotion();
        step = chosen;
        render();
        if (!visible || reduced.matches || printing || document.hidden || disclosureAncestors.some(details => !details.open)) return;
        panels.slice(step).forEach((panel, index) => {
            if (typeof panel.animate !== 'function') return;
            const animation = panel.animate([{ opacity: .72, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, delay: index * 45, easing: 'ease-out' });
            animations.push(animation);
            animation.addEventListener('finish', () => { animations = animations.filter(item => item !== animation); }, { once: true });
        });
    }
    buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
    next?.addEventListener('click', () => select((step + 1) % panels.length));
    // Visibility observation is only an animation enhancement; the sample
    // remains interactive and static when the browser cannot observe it.
    if (typeof IntersectionObserver === 'function') {
        const observer = new IntersectionObserver(entries => {
            visible = entries.some(entry => entry.isIntersecting);
            if (!visible) cancelMotion();
        });
        observer.observe(explorer);
    }
    disclosureAncestors.forEach(details => details.addEventListener('toggle', () => { if (!details.open) cancelMotion(); }));
    reduced.addEventListener('change', cancelMotion);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMotion(); });
    printMedia.addEventListener('change', event => { printing = event.matches; if (printing) cancelMotion(); });
    window.addEventListener('beforeprint', () => { printing = true; cancelMotion(); });
    window.addEventListener('afterprint', () => { printing = printMedia.matches; });
    document.addEventListener('portfolio:languagechange', () => { cancelMotion(); render(); });
    render();
    explorer.querySelectorAll('[data-lineage-controls]').forEach(element => { if (element instanceof HTMLElement) element.hidden = false; });
});
