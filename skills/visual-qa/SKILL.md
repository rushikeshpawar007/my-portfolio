---
name: visual-qa
description: Use before deploying or after visual changes to validate both themes, responsive breakpoints, animations, and accessibility
---

## Overview

Inspired by [Stitch Skills](https://github.com/google-labs-code/stitch-skills) quality assurance patterns. Provides a structured visual QA checklist for verifying design changes across themes, viewports, and accessibility requirements.

## When to Use

- After any CSS or HTML visual change
- Before deploying to production
- When a visual bug is reported
- After adding new components or sections

## The QA Process

### 1. Theme Verification

For every changed element, verify in BOTH themes:
- [ ] Toggle to **light theme** — check colors, contrast, borders
- [ ] Toggle to **dark theme** — check colors, contrast, borders
- [ ] Toggle rapidly — no flash of wrong theme
- [ ] Check `localStorage.theme` persists correctly

### 2. Responsive Breakpoints

Test at these critical widths:
- [ ] **375px** — iPhone SE (smallest supported)
- [ ] **428px** — iPhone Pro Max
- [ ] **768px** — iPad / tablet breakpoint
- [ ] **1024px** — Desktop breakpoint
- [ ] **1440px** — Large desktop

Check:
- [ ] No horizontal overflow
- [ ] Text remains readable (no truncation)
- [ ] Images scale correctly
- [ ] Grid layouts collapse properly
- [ ] Touch targets >= 44x44px on mobile

### 3. Animation Verification

- [ ] Scroll reveals trigger at correct threshold
- [ ] Stagger animations sequence properly
- [ ] Hover states feel responsive (< 250ms)
- [ ] Timeline progress syncs with scroll
- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] No layout shift during animations

### 4. Accessibility Checks

- [ ] **Color contrast** — Text meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] **Focus indicators** — Visible on all interactive elements
- [ ] **Keyboard navigation** — Tab order is logical
- [ ] **Screen reader** — Aria labels present, content readable
- [ ] **Skip link** — "Skip to main content" works

### 5. Performance Spot-Check

- [ ] No new render-blocking resources
- [ ] Images lazy-loaded below fold
- [ ] CSS file size hasn't ballooned (< 70KB combined)
- [ ] No `will-change` left on non-animating elements
- [ ] Scroll performance smooth (no jank)

## Quick Validation Commands

```bash
# Run E2E tests covering visual behavior
npx playwright test

# Run specific visual test
npx playwright test -g "theme"

# Check CSS file size
wc -c styles/main.css styles/tailwind.css
```

## Common Issues

- Glass cards losing border in dark theme
- Gradient text invisible on certain backgrounds
- Hover glow too intense in light theme
- Section reveals overlapping on fast scroll
- Mobile bottom nav overlapping content
