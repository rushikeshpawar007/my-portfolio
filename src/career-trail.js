// The trail uses native links and CSS motion. Move keyboard focus to the
// selected role so continued reading starts at the chosen experience.
document.addEventListener('DOMContentLoaded', () => {
    for (const link of document.querySelectorAll('.career-stop')) {
        link.addEventListener('click', event => {
            if (!(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            const role = document.getElementById((link.getAttribute('href') || '').slice(1));
            if (!(role instanceof HTMLElement)) return;
            if (!role.hasAttribute('tabindex')) role.setAttribute('tabindex', '-1');
            role.focus({ preventScroll: true });
        });
    }
});
