# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Build & Test Commands

- **Build CSS**: `npm run build:css` — compiles `src/input.css` → `styles/tailwind.css` via Tailwind CSS v4 CLI
- **Unit tests**: `npm test` — runs Jest (node environment)
- **E2E tests**: `npx playwright test` — runs Playwright against local `file://` path to `index.html`
- **Single E2E test**: `npx playwright test -g "test name"` — run by grep pattern
- **Install Playwright browsers**: `npx playwright install` (required before first E2E run)

## Architecture

Static single-page portfolio site deployed on Netlify with optional serverless functions.

**Frontend** — No framework. Vanilla HTML/CSS/JS:
- `index.html` — entire site in one file (~60KB), includes embedded i18n JSON translations (EN/DE)
- `src/main.js` — all interactive behavior: theme toggle, i18n switching, scroll animations (IntersectionObserver), contact form submission, AI Finance Bot UI, keyboard shortcuts
- `styles/main.css` — custom styles with CSS custom properties for theming (light/dark)
- `styles/tailwind.css` — compiled Tailwind output (generated, do not edit)
- `src/input.css` — Tailwind entry point (`@import "tailwindcss"`)

**Serverless** — `netlify/functions/gemini.js`: proxies Google Gemini API for the AI Finance Bot with rate limiting (5 req/min/IP), CORS origin validation, and client secret auth.

**Key patterns**:
- Theming uses `data-theme` attribute on `<html>` with CSS custom properties; persisted in localStorage
- i18n uses `data-i18n-key` attributes on HTML elements; translations are inline JSON in `index.html`
- Scroll effects use IntersectionObserver (`section-reveal`, `stagger-item` classes)
- Contact form uses Netlify Forms (hidden `form-name` field)

## Testing

E2E tests in `tests/portfolio-inspect.spec.js` (~840 lines, 50+ tests) cover: page structure, navigation, theme/language toggles, scroll behaviors, AI bot interactions, accessibility, mobile viewport, and keyboard shortcuts. Playwright is configured to test via `file://` protocol against the local `index.html` (no dev server needed).

Jest tests for Netlify functions live in `netlify/functions/__tests__/`.

## Deployment

Netlify builds via `npm run build:css` (configured in `netlify.toml`). Publish directory is repo root. Security headers and cache policies are set in `netlify.toml`.
