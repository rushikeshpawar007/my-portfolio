// Native dialog enhancement. The screenshot link still works without this script.
(() => {
    const dialog = document.getElementById('spotify-dashboard-viewer');
    if (typeof HTMLDialogElement === 'undefined' || !(dialog instanceof HTMLDialogElement) || typeof dialog.showModal !== 'function') return;
    const close = dialog.querySelector('[data-dashboard-close]');
    const zoom = dialog.querySelector('[data-dashboard-zoom]');
    const canvas = dialog.querySelector('.dashboard-viewer-canvas');
    if (!(close instanceof HTMLButtonElement) || !(zoom instanceof HTMLButtonElement) || !(canvas instanceof HTMLElement)) return;

    /** @type {HTMLAnchorElement | null} */
    let opener = null;
    let pageOverflow = '';
    /** @param {boolean} open */
    const notifyPreviews = open => document.dispatchEvent(new CustomEvent('portfolio:previewoverlaychange', { detail: { open } }));
    const resetZoom = () => {
        zoom.setAttribute('aria-pressed', 'false');
        dialog.removeAttribute('data-dashboard-zoomed');
        canvas.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    };

    document.querySelectorAll('[data-dashboard-open="spotify-dashboard-viewer"]').forEach(link => {
        if (!(link instanceof HTMLAnchorElement)) return;
        link.setAttribute('aria-haspopup', 'dialog');
        link.setAttribute('aria-controls', dialog.id);
        link.addEventListener('click', event => {
            // Retain native open-in-new-tab and modified-click behavior.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || dialog.open) return;
            try { dialog.showModal(); } catch { return; }
            event.preventDefault();
            opener = link;
            pageOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            resetZoom();
            notifyPreviews(true);
        });
    });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
        document.documentElement.style.overflow = pageOverflow;
        resetZoom();
        notifyPreviews(false);
        opener?.focus({ preventScroll: true });
        opener = null;
    });
    zoom.addEventListener('click', () => {
        const enlarged = zoom.getAttribute('aria-pressed') !== 'true';
        zoom.setAttribute('aria-pressed', String(enlarged));
        dialog.toggleAttribute('data-dashboard-zoomed', enlarged);
        canvas.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    });
    // Closing before print prevents a modal top layer from obscuring the portfolio.
    window.addEventListener('beforeprint', () => { if (dialog.open) dialog.close(); });
})();
