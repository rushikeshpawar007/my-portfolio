// Native project links work without JavaScript. This adds documented stack context.
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('skills');
    if (!root) return;
    const links = [...root.querySelectorAll('a.skill-project-link')];
    const groups = [...root.querySelectorAll('.skill-note-wrap')];
    /** @type {Record<string, Record<string, string>>} */
    let translations = {};
    try { translations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}'); } catch { return; }
    /** @param {string} key */
    const text = key => translations[document.documentElement.lang]?.[key] || translations.en?.[key] || '';
    /** @type {Element | null} */
    let hovered = null;
    /** @type {Element | null} */
    let focused = null;
    /** @type {Element | null} */
    let active = null;

    /** @param {Element | null} link */
    function render(link) {
        active = link;
        const stack = link?.getAttribute('data-skill-stack');
        const current = link?.closest('.skill-group')?.querySelector('.skill-note-wrap');
        for (const group of groups) {
            const selected = group === current;
            group.classList.toggle('has-skill-connection', selected);
            const note = group.querySelector('.skill-note');
            if (selected) note?.setAttribute('aria-hidden', 'true');
            else note?.removeAttribute('aria-hidden');
            const caption = group.querySelector('[data-skill-connection]');
            if (caption) caption.textContent = selected
                ? stack ? text(`skill_stack_${stack}`) : `${text('skill_project_where')} · ${text(link?.getAttribute('data-project-key') || '')}`
                : '';
        }
    }

    for (const link of links) {
        link.addEventListener('pointerenter', event => {
            if (event instanceof PointerEvent && event.pointerType === 'touch') return;
            hovered = link;
            render(link);
        });
        link.addEventListener('pointerleave', () => {
            if (hovered === link) hovered = null;
            render(focused);
        });
        link.addEventListener('focus', () => { focused = link; render(link); });
        link.addEventListener('blur', () => { focused = null; render(hovered); });
        link.addEventListener('click', event => {
            if (!(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            const target = document.getElementById((link.getAttribute('href') || '').slice(1));
            if (!(target instanceof HTMLElement)) return;
            // Keep the native hash and scroll, moving subsequent keyboard navigation
            // to the project the visitor chose rather than back into the tool grid.
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            hovered = null;
            target.focus({ preventScroll: true });
            render(null);
        });
    }
    document.addEventListener('portfolio:languagechange', () => render(active));
    window.addEventListener('blur', () => { hovered = null; focused = null; render(null); });
});
