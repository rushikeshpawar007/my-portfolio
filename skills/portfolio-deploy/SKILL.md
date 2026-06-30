---
name: portfolio-deploy
description: Use when preparing to deploy, pushing to production, building for release, or running pre-deployment checks on the portfolio site
---

## Overview

Structured deployment workflow for a static portfolio site on GitHub Pages. Prevents broken deploys by enforcing build, test, and validation gates.

## When to Use

- Before any `git push` to main
- When asked to deploy or prepare for release
- After making CSS, HTML, or JS changes that need to go live

## The Deployment Workflow

Follow these steps in order. Do NOT skip steps or proceed if any gate fails.

### 1. BUILD CSS
```bash
npm run build:css
```
Compiles `src/input.css` to `styles/tailwind.css`. Verify the output file was updated.

### 2. RUN TESTS
```bash
npm test          # runs the Playwright E2E suite
```
All Playwright E2E tests must pass (79 tests): page structure, navigation, theme/language toggles, scroll behaviors, AI bot, accessibility, mobile viewport, and keyboard shortcuts.

### 3. VALIDATE CRITICAL FILES
Check that these exist and are non-empty:
- `index.html` — the entire site
- `styles/tailwind.css` — compiled CSS (must be fresher than `src/input.css`)
- `styles/main.css` — custom styles
- `src/main.js` — all interactive behavior
- `robots.txt` — SEO

### 4. CHECK i18n COMPLETENESS
Verify every `data-i18n-key` in `index.html` has a matching entry in both the EN and DE translation objects.

### 5. STAGE AND COMMIT
Stage only relevant files. Always include `styles/tailwind.css` if CSS changed. Never commit `node_modules/` or `test-results/`.

### 6. PUSH
Push to main only after all gates pass.

## Common Mistakes

- Forgetting to rebuild CSS before committing — causes stale styles in production
- Pushing without running E2E tests — theme/i18n bugs slip through
- Committing `node_modules/` or test artifacts
- Not checking that `tailwind.css` timestamp is newer than `input.css`
