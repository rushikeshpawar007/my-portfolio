/* An illustrative cleaning exercise, separate from the employer case study. */
document.addEventListener('DOMContentLoaded', () => {
    const exercise = document.querySelector('[data-cleaning]');
    if (!exercise) return;
    /** @type {Record<string, Record<string, string>>} */
    let translations;
    try {
        translations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}');
    } catch {
        return;
    }
    if (!translations.en?.cleaning_title) return;
    /** @param {string} key */
    const t = key => translations[document.documentElement.lang]?.[key] || translations.en[key] || key;
    const records = [
        { id: 'C-101', date: '03/03/2026', amount: 1200 },
        { id: 'C-102', date: '2026-03-05', amount: 850 },
        { id: 'C-102', date: '2026-03-05', amount: 850 },
        { id: 'C-103', date: '07/03/2026', amount: null },
    ];
    // Duplicate means the entire input record is identical, not simply its ID.
    const duplicates = records.map((record, index) => records.findIndex(candidate => candidate.id === record.id && candidate.date === record.date && candidate.amount === record.amount) !== index);
    const retained = records.filter((_, index) => !duplicates[index]);
    const review = retained.filter(record => record.amount === null).length;
    const dateChanges = records.filter(record => record.date.includes('/')).length;
    /** @param {string} value */
    const normalizeDate = value => value.includes('/') ? value.split('/').reverse().join('-') : value;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const printMedia = matchMedia('print');
    let printing = printMedia.matches;
    const result = exercise.querySelector('[data-cleaning-result]');
    /** @type {Animation | undefined} */
    let animation;
    let step = 0;
    const stop = () => { animation?.cancel(); animation = undefined; };
    const phaseKeys = ['cleaning_identify_note', 'cleaning_normalize_note', 'cleaning_review_note'];
    /** @type {Map<string, Intl.NumberFormat>} */
    const moneyFormats = new Map();
    /** @param {boolean} [announce] */
    function render(announce = false) {
        const locale = document.documentElement.lang === 'de' ? 'de-DE' : 'en-GB';
        let money = moneyFormats.get(locale);
        if (!money) {
            money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
            moneyFormats.set(locale, money);
        }
        exercise?.setAttribute('data-cleaning-step', String(step));
        exercise?.querySelectorAll('[data-cleaning-row]').forEach(row => {
            const index = Number(row.getAttribute('data-cleaning-row'));
            const record = records[index];
            const duplicate = duplicates[index];
            const changedDate = normalizeDate(record.date) !== record.date;
            const statusKey = duplicate ? (step === 2 ? 'cleaning_removed' : 'cleaning_duplicate') : record.amount === null ? (step === 2 ? 'cleaning_review' : 'cleaning_missing') : step === 0 && changedDate ? 'cleaning_check_date' : 'cleaning_ready';
            row.setAttribute('data-cleaning-attention', String(duplicate || record.amount === null || (step === 0 && changedDate)));
            row.setAttribute('data-cleaning-removed', String(duplicate && step === 2));
            const status = row.querySelector('[data-cleaning-status]');
            if (status) {
                status.setAttribute('data-i18n-key', statusKey);
                status.textContent = t(statusKey);
            }
            const date = row.querySelector('[data-cleaning-date]');
            if (date) {
                date.replaceChildren();
                if (changedDate && step > 0) {
                    const before = document.createElement('del');
                    before.textContent = record.date;
                    date.append(before, document.createTextNode(` → ${normalizeDate(record.date)}`));
                } else date.textContent = record.date;
            }
            const amount = row.querySelector('[data-cleaning-amount]');
            if (amount) amount.textContent = record.amount === null ? t('cleaning_missing') : money.format(record.amount);
        });
        const count = t(step === 2 ? 'cleaning_count_final' : 'cleaning_count_input').replace('{input}', String(records.length)).replace('{retained}', String(retained.length)).replace('{review}', String(review));
        const note = t(phaseKeys[step]).replace('{dates}', String(dateChanges)).replace('{duplicates}', String(records.length - retained.length));
        const countElement = exercise?.querySelector('[data-cleaning-count]');
        if (countElement) countElement.textContent = count;
        const noteElement = exercise?.querySelector('[data-cleaning-note]');
        if (noteElement) noteElement.textContent = note;
        exercise?.querySelectorAll('[data-cleaning-select]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.getAttribute('data-cleaning-select')) === step)));
        const live = exercise?.querySelector('[data-cleaning-announcement]');
        if (announce && live) live.textContent = `${note} ${count}`;
    }
    exercise.querySelectorAll('[data-cleaning-select]').forEach(button => button.addEventListener('click', () => {
        const next = Number(button.getAttribute('data-cleaning-select'));
        if (next === step) return;
        stop();
        step = next;
        render(true);
        if (!motion.matches && !printing && !document.hidden && disclosureAncestors.every(details => details.open) && result && typeof result.animate === 'function') {
            const active = result.animate([{ opacity: .6, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
            animation = active;
            active.addEventListener('finish', () => { if (animation === active) animation = undefined; }, { once: true });
        }
    }));
    motion.addEventListener('change', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    printMedia.addEventListener('change', event => { printing = event.matches; if (printing) stop(); });
    window.addEventListener('beforeprint', () => { printing = true; stop(); });
    window.addEventListener('afterprint', () => { printing = printMedia.matches; });
    /** @type {HTMLDetailsElement[]} */
    const disclosureAncestors = [];
    for (let details = exercise.closest('details'); details; details = details.parentElement?.closest('details') || null) disclosureAncestors.push(details);
    disclosureAncestors.forEach(details => details.addEventListener('toggle', () => { if (!details.open) stop(); }));
    document.addEventListener('portfolio:languagechange', () => render(Boolean(exercise.querySelector('[data-cleaning-announcement]')?.textContent)));
    render();
    const controls = exercise.querySelector('[data-cleaning-controls]');
    if (controls instanceof HTMLElement) controls.hidden = false;
});
