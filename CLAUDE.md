# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Build & Test Commands

- **Build CSS**: `npm run build:css` — compiles `src/input.css` → `styles/tailwind.css` via Tailwind CSS v4 CLI
- **Tests (E2E)**: `npm test` (alias for `npx playwright test`) — runs Playwright against local `file://` path to `index.html`
- **Lint**: `npm run lint` — ESLint over `src/`, `tests/`, and config files (CI runs this too)
- **Single E2E test**: `npx playwright test -g "test name"` — run by grep pattern
- **Install Playwright browsers**: `npx playwright install` (required before first E2E run)

## Architecture

Static single-page portfolio site deployed on GitHub Pages.

**Frontend** — No framework. Vanilla HTML/CSS/JS:
- `index.html` — entire site in one file (~60KB), includes embedded i18n JSON translations (EN/DE)
- `src/main.js` — all interactive behavior: theme toggle, i18n switching, scroll animations (IntersectionObserver), contact form submission, AI Finance Bot UI, keyboard shortcuts
- `styles/main.css` — custom styles with CSS custom properties for theming (light/dark)
- `styles/tailwind.css` — compiled Tailwind output (generated, do not edit)
- `src/input.css` — Tailwind entry point (`@import "tailwindcss"`)

**Key patterns**:
- Theming uses `data-theme` attribute on `<html>` with CSS custom properties; persisted in localStorage
- i18n uses `data-i18n-key` attributes on HTML elements; translations are inline JSON in `index.html`
- Scroll effects use IntersectionObserver (`section-reveal`, `stagger-item` classes)

## Testing

E2E tests in `tests/portfolio-inspect.spec.js` (81 tests) cover: page structure, navigation, theme/language toggles, scroll behaviors, AI bot interactions, accessibility, mobile viewport, and keyboard shortcuts. Playwright is configured to test via `file://` protocol against the local `index.html` (no dev server needed).

## Deployment

GitHub Pages serves the repo root as a static site. CSS must be pre-built (`npm run build:css`) and the compiled `styles/tailwind.css` committed before pushing — CI fails if the committed file is stale (`git diff --exit-code styles/tailwind.css`).

**CSP note**: the inline `<script>` blocks in `index.html`, `impressum.html`, and `privacy.html` are allowlisted by sha256 hashes in each page's CSP meta tag. If you edit an inline script, recompute its hash (sha256 of the script text with CRLF normalized to LF, base64) and update the CSP.
