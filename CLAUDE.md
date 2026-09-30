# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Build & Test Commands

- **Build CSS**: `npm run build:css` — compiles Tailwind, then minifies the ordered portfolio styles into `styles/site.min.css` and the independent legal styles into `styles/legal.min.css`. Edit source styles, then rebuild; do not edit generated files.
- **Tests (E2E)**: `npm test` (alias for `npx playwright test`) — runs Playwright against the local HTTP server at `http://127.0.0.1:4173`
- **Lint**: `npm run lint` — ESLint over `src/`, `tests/`, `scripts/`, and config files (CI runs this too)
- **Type-check**: `npm run typecheck` — `tsc --noEmit` type-checks `src/**/*.js` via JSDoc + `tsconfig.json` (check-only; no build output, files stay `.js`). CI runs this. Annotate DOM lookups with `/** @type {HTMLInputElement} */ (…)` casts when adding code.
- **Single E2E test**: `npx playwright test -g "test name"` — run by grep pattern
- **Install Playwright browsers**: `npx playwright install` (required before first E2E run)

## Architecture

Static single-page portfolio site deployed on GitHub Pages. Development requires Node 22.13+ or a supported newer release; CI uses Node 24 LTS. Install the locked tools with `npm ci`.

See `README.md` for the folder map. Keep `index.html`, `privacy.html`, and `impressum.html` at the root to preserve page routes. Media belongs in `assets/`: `brand/` for favicons and share-card assets, `documents/` for the CV, `fonts/` for local fonts, `images/` grouped by purpose, and `skill-icons/` for SVG artwork and licenses. Reference assets with relative URLs so the site works under GitHub Pages' project path. Design and performance documentation lives in `docs/DESIGN.md` and `docs/PERFORMANCE.md`.

**Frontend** — No framework. Vanilla HTML/CSS/JS:
- `index.html` — complete readable HTML, inline icon sprites and embedded i18n JSON translations (EN/DE)
- `src/main.js` — all interactive behavior: theme toggle, i18n switching, scroll animations (IntersectionObserver), contact form submission, AI Finance Bot UI and keyboard focus management
- `src/project-previews.js` — visibility-controlled, pausable preview animation sequences
- `src/analysis-comparisons.js`, `src/analyst-workbench.js` — local calculations and controls for explicitly fictional sample data
- `styles/main.css` and the feature stylesheets — editable custom styles, with CSS custom properties for light/dark themes
- `styles/legal.css` — self-contained legal-page typography, theme, responsive and print styles
- `scripts/build-css.cjs` — Tailwind compilation and ordered Lightning CSS minification
- `styles/tailwind.css`, `styles/site.min.css`, `styles/legal.min.css` — generated CSS; commit all three for static hosting
- `src/input.css` — Tailwind entry point with explicit HTML/JS sources, excluding tests and documentation from utility detection

**Key patterns**:
- Theming uses `data-theme` attribute on `<html>` with CSS custom properties; persisted in localStorage
- i18n uses `data-i18n-key` attributes on HTML elements; translations are inline JSON in `index.html`
- Scroll effects use IntersectionObserver (`section-reveal`, `stagger-item` classes)

## Testing

E2E tests in `tests/portfolio-*.spec.js` cover page structure, navigation, theme/language toggles, scrolling, bot/form interactions, accessibility, mobile reflow, keyboard controls, sample calculations, asset budgets and animation lifecycle. Playwright starts `scripts/serve.cjs` automatically and tests HTTP-served content; `tests/server.js` remains a compatibility entry point. Regression coverage includes complete marked translations, no-JavaScript and blocked-script fallbacks, mobile overlap, and fictional-source demo behavior.

## Deployment

GitHub Pages serves the repo root as a static site. Run `npm run build:css` and commit the generated `styles/tailwind.css`, `styles/site.min.css`, and `styles/legal.min.css` before pushing. CI rebuilds and rejects stale bundles. The authored source styles remain separate for maintenance; the browser downloads only the relevant minified bundle.

**CSP note**: executable inline `<script>` blocks in `index.html` are allowlisted by sha256 hashes in its CSP meta tag. If you edit an inline script, including its asset paths, recompute its hash (sha256 of the script text with CRLF normalized to LF, base64) and update the CSP. Legal pages use the external `src/legal.js` initializer.
