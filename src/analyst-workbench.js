/* Fictional, deterministic samples accompanying real portfolio case studies. */
document.addEventListener('DOMContentLoaded', () => {
    /** @type {Record<string, Record<string, string>>} */
    let translations = {};
    try {
        translations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}');
    } catch {
        // Leave the authored English markup untouched; rendering now would show raw keys.
        return;
    }
    const locale = () => document.documentElement.lang === 'de' ? 'de-DE' : 'en-GB';
    /** @type {Map<string, { money: Intl.NumberFormat, date: Intl.DateTimeFormat }>} */
    const formatters = new Map();
    function formats() {
        const lang = locale();
        let cached = formatters.get(lang);
        if (!cached) {
            cached = {
                money: new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
                date: new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
            };
            formatters.set(lang, cached);
        }
        return cached;
    }
    /** @param {string} key */
    const t = key => translations[document.documentElement.lang]?.[key] || translations.en?.[key] || key;
    /** @param {number} amount */
    const money = amount => formats().money.format(amount);
    /** @param {string} value */
    const date = value => formats().date.format(new Date(`${value}T00:00:00Z`));
    /** @param {string} start @param {string} end */
    const days = (start, end) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    /** @type {Map<Element, Animation>} */
    const animations = new Map();
    function stopMotion() {
        animations.forEach(animation => animation.cancel());
        animations.clear();
    }
    /** @param {HTMLElement | null} element */
    function reveal(element) {
        if (!element) return;
        animations.get(element)?.cancel();
        animations.delete(element);
        if (reducedMotion.matches || document.hidden || typeof element.animate !== 'function') return;
        const animation = element.animate([{ opacity: 0.65, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
        animations.set(element, animation);
        animation.addEventListener('finish', () => {
            if (animations.get(element) === animation) animations.delete(element);
        }, { once: true });
    }
    reducedMotion.addEventListener('change', stopMotion);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopMotion(); });
    window.addEventListener('beforeprint', stopMotion);

    const reconciliation = document.querySelector('[data-workbench="reconciliation"]');
    /** @type {{id: string, bookings: number | null, accounting: number | null}[]} */
    const records = [
        { id: 'R-101', bookings: 12000, accounting: 12000 },
        { id: 'R-102', bookings: 8500, accounting: 8000 },
        { id: 'R-103', bookings: 6200, accounting: null },
        { id: 'R-104', bookings: null, accounting: 4200 },
        { id: 'R-105', bookings: 3300, accounting: 3300 },
    ];
    /** @param {typeof records[number]} record */
    const difference = record => (record.bookings ?? 0) - (record.accounting ?? 0);
    /** @param {typeof records[number]} record */
    const status = record => record.bookings === null ? 'workbench_accounting_only' : record.accounting === null ? 'workbench_bookings_only' : difference(record) !== 0 ? 'workbench_amount_difference' : 'workbench_matched';
    let showReview = false;
    function renderReconciliation() {
        if (!reconciliation) return;
        const selected = records.filter(record => !showReview || status(record) !== 'workbench_matched');
        reconciliation.querySelectorAll('tbody tr').forEach(row => {
            const record = records.find(item => item.id === row.getAttribute('data-record'));
            if (!record || !(row instanceof HTMLElement)) return;
            row.hidden = !selected.includes(record);
            const fields = { bookings: record.bookings === null ? t('workbench_missing') : money(record.bookings), accounting: record.accounting === null ? t('workbench_missing') : money(record.accounting), difference: money(difference(record)) };
            Object.entries(fields).forEach(([field, value]) => {
                const target = row.querySelector(`[data-record-${field}]`);
                if (target) target.textContent = value;
            });
        });
        const totals = { bookings: records.reduce((sum, record) => sum + (record.bookings ?? 0), 0), accounting: records.reduce((sum, record) => sum + (record.accounting ?? 0), 0), difference: records.reduce((sum, record) => sum + difference(record), 0) };
        Object.entries(totals).forEach(([field, value]) => {
            const target = reconciliation.querySelector(`[data-total="${field}"]`);
            if (target) target.textContent = money(value);
        });
        reconciliation.querySelectorAll('[data-reconciliation-filter]').forEach(button => button.setAttribute('aria-pressed', String((button.getAttribute('data-reconciliation-filter') === 'review') === showReview)));
        const count = reconciliation.querySelector('[data-reconciliation-count]');
        if (count) count.textContent = t(showReview ? 'workbench_showing_review' : 'workbench_showing_all');
    }
    reconciliation?.querySelectorAll('[data-reconciliation-filter]').forEach(button => button.addEventListener('click', () => {
        showReview = button.getAttribute('data-reconciliation-filter') === 'review';
        renderReconciliation();
        reveal(reconciliation.querySelector('[data-reconciliation-result]'));
    }));

    const history = document.querySelector('[data-workbench="history"]');
    const asOf = '2026-03-31';
    /** @type {{id: string, close: string, closed: boolean, stages: {key: string, entered: string}[]}[]} */
    const deals = [
        { id: 'D-201', close: '2026-03-25', closed: false, stages: [{ key: 'workbench_prospecting', entered: '2026-03-02' }, { key: 'workbench_demo', entered: '2026-03-09' }, { key: 'workbench_proposal', entered: '2026-03-18' }] },
        { id: 'D-202', close: '2026-03-20', closed: true, stages: [{ key: 'workbench_prospecting', entered: '2026-03-01' }, { key: 'workbench_demo', entered: '2026-03-05' }, { key: 'workbench_proposal', entered: '2026-03-11' }, { key: 'workbench_negotiation', entered: '2026-03-14' }, { key: 'workbench_commitment', entered: '2026-03-17' }, { key: 'workbench_won', entered: '2026-03-19' }] },
        { id: 'D-203', close: '2026-03-31', closed: false, stages: [{ key: 'workbench_prospecting', entered: '2026-03-03' }, { key: 'workbench_demo', entered: '2026-03-08' }, { key: 'workbench_proposal', entered: '2026-03-15' }, { key: 'workbench_negotiation', entered: '2026-03-24' }] },
    ];
    const select = history?.querySelector('select');
    function renderHistory() {
        if (!history) return;
        const deal = deals.find(item => item.id === select?.value) || deals[0];
        const overdue = !deal.closed && deal.close < asOf;
        const dueToday = !deal.closed && deal.close === asOf;
        const current = deal.stages[deal.stages.length - 1];
        const fields = {
            id: deal.id,
            close: date(deal.close),
            stage: t(current.key),
            status: deal.closed ? t('workbench_closed') : overdue ? t('workbench_overdue').replace('{days}', String(days(deal.close, asOf))) : t(dueToday ? 'workbench_due_today' : 'workbench_on_track'),
        };
        history.setAttribute('data-deal-status', deal.closed ? 'closed' : overdue ? 'overdue' : dueToday ? 'due-today' : 'open');
        Object.entries(fields).forEach(([field, value]) => {
            const target = history.querySelector(`[data-deal-${field}]`);
            if (target) target.textContent = value;
        });
        const timeline = history.querySelector('[data-deal-timeline]');
        if (!timeline) return;
        const fragment = document.createDocumentFragment();
        deal.stages.forEach((stage, index) => {
            const item = document.createElement('li');
            const heading = document.createElement('strong');
            heading.textContent = t(stage.key);
            const entered = document.createElement('time');
            entered.dateTime = stage.entered;
            entered.textContent = date(stage.entered);
            const duration = document.createElement('span');
            duration.className = 'workbench-duration';
            const next = deal.stages[index + 1];
            const elapsed = days(stage.entered, next?.entered || asOf);
            duration.textContent = !next && deal.closed ? t('workbench_deal_complete') : t(next ? 'workbench_days_in_stage' : 'workbench_days_so_far').replace('{days}', String(elapsed));
            if (!next) item.setAttribute('data-current-stage', '');
            item.append(heading, entered, duration);
            fragment.append(item);
        });
        timeline.replaceChildren(fragment);
    }
    select?.addEventListener('change', () => {
        renderHistory();
        reveal(history?.querySelector('[data-history-result]') || null);
    });
    document.addEventListener('portfolio:languagechange', () => {
        renderReconciliation();
        renderHistory();
    });
    renderReconciliation();
    renderHistory();
    document.querySelectorAll('[data-workbench-controls]').forEach(element => { if (element instanceof HTMLElement) element.hidden = false; });
});
