---
name: design-system
description: Use when adding colors, components, or tokens to ensure DESIGN.md stays in sync and the design system remains consistent
---

## Overview

Inspired by [Stitch Skills](https://github.com/google-labs-code/stitch-skills) `design-md` pattern. Manages the portfolio's centralized design system document (`DESIGN.md`) and validates consistency across CSS, HTML, and documentation.

## When to Use

- Adding a new CSS custom property
- Creating a new component pattern
- Modifying the color palette or typography
- Before any PR that touches `styles/main.css`
- Periodic design system health checks

## The Process

### Adding a New Design Token

1. **Define** the variable in BOTH `[data-theme="light"]` and `[data-theme="dark"]` blocks in `styles/main.css`
2. **Name** it semantically by role: `--card-glow`, not `--rgba-accent-012`
3. **Document** it in `DESIGN.md` under the appropriate section with:
   - Role name and description
   - Light and dark theme values
   - Usage context
4. **Validate** by running `scripts/validate-tokens.sh`

### Adding a New Component Pattern

1. **Check** existing patterns in DESIGN.md — can you reuse or extend?
2. **Define** the component in CSS using only existing CSS variables
3. **Document** in DESIGN.md under Component Styling:
   - Visual description
   - CSS class name
   - Key properties and values
   - States (hover, focus, active)
4. **Test** in both light and dark themes

### Design System Health Check

Run through this checklist:
- [ ] Every CSS variable in `main.css` is documented in `DESIGN.md`
- [ ] Every color in `DESIGN.md` matches the actual CSS value
- [ ] No hardcoded colors in HTML (use `var(--...)`)
- [ ] All components have both light and dark theme support
- [ ] Typography matches the documented font stack and weights
- [ ] Animation timings are consistent with documented principles

## Resources

- `DESIGN.md` — Single source of truth for the design system
- `styles/main.css` — CSS custom properties and component styles
- `resources/token-naming.md` — Naming conventions for design tokens

## Common Mistakes

- Adding a CSS variable without documenting it
- Using different values in CSS vs DESIGN.md
- Creating one-off colors instead of using existing tokens
- Forgetting dark theme when adding light theme variables
