// Small, fictional examples: interactions run only when the visitor changes a control.
document.addEventListener('DOMContentLoaded', () => {
    /** @type {Record<string, Record<string, string>>} */
    let translations = {};
    try { translations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}'); } catch { return; }
    const locale = () => document.documentElement.lang === 'de' ? 'de-DE' : 'en-GB';
    /** @type {Map<string, { money: Intl.NumberFormat, number: Intl.NumberFormat, percent: Intl.NumberFormat }>} */
    const formatters = new Map();
    function formats() {
        const lang = locale();
        let cached = formatters.get(lang);
        if (!cached) {
            cached = {
                money: new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
                number: new Intl.NumberFormat(lang),
                percent: new Intl.NumberFormat(lang, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            };
            formatters.set(lang, cached);
        }
        return cached;
    }
    /** @param {string} key */
    const text = key => translations[document.documentElement.lang]?.[key] || translations.en?.[key] || key;
    /** @param {number} value */
    const money = value => formats().money.format(value);
    /** @param {number} value */
    const number = value => formats().number.format(value);
    /** @param {HTMLElement} root @param {string} selector @param {string} value */
    function write(root, selector, value) {
        const target = root.querySelector(selector);
        if (target) target.textContent = value;
    }
    /** @param {string} key @param {Record<string, string>} values */
    function message(key, values) {
        return text(key).replace(/\{(\w+)\}/g, (_match, name) => values[name] || '');
    }

    const budget = document.querySelector('[data-analysis-example="budget"]');
    const period = document.getElementById('budget-period');
    if (budget instanceof HTMLElement && period instanceof HTMLSelectElement) {
        const periods = { jan: { budget: 100000, actual: 112000 }, feb: { budget: 108000, actual: 96000 } };
        function renderBudget() {
            const root = /** @type {HTMLElement} */ (budget);
            const select = /** @type {HTMLSelectElement} */ (period);
            const values = select.value === 'feb' ? periods.feb : periods.jan;
            const difference = values.actual - values.budget;
            const percent = formats().percent.format(Math.abs(difference / values.budget));
            write(root, '[data-budget-plan]', money(values.budget));
            write(root, '[data-budget-actual]', money(values.actual));
            write(root, '[data-budget-period]', text(select.value === 'feb' ? 'comparison_feb' : 'comparison_jan'));
            for (const kind of /** @type {const} */ (['budget', 'actual'])) {
                const bar = root.querySelector(`[data-budget-bar="${kind}"]`);
                if (bar instanceof HTMLElement) bar.style.transform = `scaleX(${values[kind] / 120000})`;
            }
            write(root, '[data-budget-insight]', message(difference >= 0 ? 'comparison_above' : 'comparison_below', { amount: money(Math.abs(difference)), percent }));
        }
        period.addEventListener('change', renderBudget);
        document.addEventListener('portfolio:languagechange', renderBudget);
        budget.querySelector('[data-comparison-control]')?.removeAttribute('hidden');
        renderBudget();
    }

    const regional = document.querySelector('[data-analysis-example="regional"]');
    const region = document.getElementById('analysis-region');
    if (regional instanceof HTMLElement && region instanceof HTMLSelectElement) {
        const regions = [
            { id: 'north', key: 'comparison_north', incentive: 2000, sales: 120 },
            { id: 'central', key: 'comparison_central', incentive: 2500, sales: 135 },
            { id: 'south', key: 'comparison_south', incentive: 1800, sales: 110 },
        ];
        function renderRegion() {
            const root = /** @type {HTMLElement} */ (regional);
            const select = /** @type {HTMLSelectElement} */ (region);
            for (const item of regions) {
                const row = root.querySelector(`[data-region-row="${item.id}"]`);
                row?.classList.toggle('is-selected', item.id === select.value);
                if (row instanceof HTMLElement) {
                    write(row, '[data-region-incentive]', number(item.incentive));
                    write(row, '[data-region-sales]', number(item.sales));
                }
            }
            const selected = regions.find(item => item.id === select.value) || regions[0];
            write(root, '[data-region-insight]', message('comparison_region_insight', {
                region: text(selected.key), amount: money(selected.incentive), sales: number(selected.sales),
            }));
        }
        region.addEventListener('change', renderRegion);
        document.addEventListener('portfolio:languagechange', renderRegion);
        regional.querySelector('[data-comparison-control]')?.removeAttribute('hidden');
        renderRegion();
    }
});
