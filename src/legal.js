// Match the portfolio's saved theme before the legal document first paints.
(() => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch {}
    const theme = saved === 'light' || saved === 'dark'
        ? saved
        : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.remove());
    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = theme === 'dark' ? '#181C19' : '#F8F7F4';
    document.head.appendChild(themeColor);
})();
