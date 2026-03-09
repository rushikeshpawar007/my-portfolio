---
name: theme-development
description: Use when modifying colors, adding dark/light theme styles, working with CSS custom properties, or debugging theme toggle behavior
---

## Overview

Guides development of the dual-theme system (light/dark) that uses `data-theme` on `<html>` with CSS custom properties, persisted in localStorage.

## When to Use

- Adding new colors or visual elements
- Modifying existing theme colors
- Debugging theme toggle issues
- Ensuring new components respect both themes

## How Theming Works

The `<html>` element carries `data-theme="light"` or `data-theme="dark"`. CSS custom properties are defined per theme:

```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #1a1a2e;
  /* ... */
}

[data-theme="dark"] {
  --bg-primary: #0a0a1a;
  --text-primary: #e0e0e0;
  /* ... */
}
```

Components reference these variables:
```css
.card {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

Toggle logic in `src/main.js` flips the attribute and saves to localStorage.

## The Process

### Adding a New Color Variable

1. Define the variable in BOTH `[data-theme="light"]` and `[data-theme="dark"]` blocks in `styles/main.css`
2. Use the variable in your component CSS with `var(--your-variable)`
3. Test in both themes — toggle and verify visual consistency
4. Check contrast ratios meet WCAG AA (4.5:1 for text, 3:1 for large text)

### Adding a New Themed Component

1. Write the HTML structure
2. Style using ONLY existing CSS custom properties where possible
3. If new variables are needed, add them to both theme blocks
4. Never hardcode colors — always use `var(--...)`
5. Test the component in both light and dark modes
6. Verify hover/focus/active states in both themes

### Debugging Theme Issues

1. Inspect `document.documentElement.getAttribute('data-theme')` in console
2. Check localStorage for `theme` key
3. Verify the CSS custom property is defined in both theme blocks
4. Check for hardcoded color values overriding variables

## Common Mistakes

- Hardcoding colors instead of using CSS variables
- Defining a variable in light theme but forgetting dark theme
- Not testing hover/focus states in both themes
- Using opacity tricks that look fine in light but break in dark mode
- Forgetting to check contrast ratios in both themes
