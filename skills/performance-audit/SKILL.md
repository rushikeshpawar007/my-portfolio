---
name: performance-audit
description: Use when optimizing load times, reducing bundle sizes, improving Core Web Vitals, or auditing the static site for performance issues
---

## Overview

Performance optimization workflow for a static single-page portfolio site. Focuses on what matters for GitHub Pages deployment: asset sizes, render-blocking resources, image optimization, and caching.

## When to Use

- Site feels slow or gets poor Lighthouse scores
- Adding new images or assets
- Reviewing overall site performance
- Before a major deployment

## The Audit Process

### 1. MEASURE CURRENT STATE

Check file sizes of critical assets:
- `index.html` — should be under 100KB
- `styles/tailwind.css` — verify minification (`--minify` flag in build)
- `styles/main.css` — check for unused rules
- `src/main.js` — check for dead code
- All images — check dimensions and file sizes

### 2. IMAGES (Biggest Impact)

Images are the #1 performance bottleneck for portfolio sites.

- Use WebP or AVIF format over PNG/JPG where possible
- Resize images to display dimensions (no 2000px images displayed at 200px)
- Add `width` and `height` attributes to prevent layout shift
- Use `loading="lazy"` for below-the-fold images
- Consider `srcset` for responsive images

### 3. CSS OPTIMIZATION

- Tailwind build already uses `--minify` — verify this is active
- Check `styles/main.css` for unused selectors
- Avoid `@import` chains that block rendering
- Critical CSS should be inline or loaded first

### 4. JAVASCRIPT OPTIMIZATION

- `src/main.js` loads all behavior — check for unused event listeners
- Use `defer` attribute on script tags
- IntersectionObserver is already used (good) — verify thresholds are sensible
- Avoid synchronous DOM queries in loops

### 5. HTML OPTIMIZATION

- Inline translations JSON adds weight — verify it's necessary vs. external file trade-off
- Minimize inline styles
- Use semantic HTML for better parser efficiency
- Preconnect to external origins (fonts, APIs)

### 6. CACHING (netlify.toml)

Current setup:
- PNGs: 1 year, immutable (good for static assets)
- JS/CSS: must-revalidate (good for cache-busting)
- Verify `Cache-Control` headers match asset update frequency

## Performance Budget

| Asset | Target |
|-------|--------|
| index.html | < 100KB |
| tailwind.css | < 50KB |
| main.css | < 20KB |
| main.js | < 30KB |
| Individual images | < 200KB |
| Total page weight | < 2MB |

## Common Mistakes

- Adding unoptimized images (raw PNG screenshots at 5MB+)
- Not rebuilding Tailwind CSS with minification before deploy
- Loading fonts synchronously (blocks render)
- Forgetting `loading="lazy"` on images below the fold
- Over-animating with CSS transitions that trigger layout/paint
