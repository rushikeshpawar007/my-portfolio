---
name: i18n-management
description: Use when adding, editing, or removing translated text, working with language switching, or validating translation completeness across EN and DE
---

## Overview

Manages the inline i18n system that uses `data-i18n-key` attributes on HTML elements with embedded JSON translation objects in `index.html`.

## When to Use

- Adding new visible text to the site
- Editing existing translated content
- Removing sections or elements with translations
- Debugging language switching issues
- Validating translation completeness

## How i18n Works in This Project

Translations are embedded as JSON in `index.html` inside `<script>` tags:

```html
<script id="translations" type="application/json">
{
  "en": { "hero.title": "Data Analyst", ... },
  "de": { "hero.title": "Datenanalyst", ... }
}
</script>
```

HTML elements reference keys via `data-i18n-key`:
```html
<h1 data-i18n-key="hero.title">Data Analyst</h1>
```

`src/main.js` reads the active language from localStorage and applies translations on load and on toggle.

## The Process

### Adding New Text

1. Choose a descriptive key following the `section.element` convention (e.g., `about.description`, `contact.submit`)
2. Add the key+value to BOTH `en` and `de` objects in the translations JSON
3. Add `data-i18n-key="your.key"` to the HTML element
4. Set the element's innerHTML to the English default
5. Test by toggling language — both EN and DE must display correctly

### Editing Existing Text

1. Find the `data-i18n-key` on the element
2. Update the value in BOTH `en` and `de` translation objects
3. Update the HTML element's default text to match the EN value

### Removing Text

1. Remove the `data-i18n-key` attribute from the element
2. Remove the key from BOTH `en` and `de` translation objects
3. Verify no orphan keys remain

### Validation Checklist

- Every `data-i18n-key` in HTML has entries in both EN and DE
- No orphan keys in JSON that have no matching HTML element
- Key naming follows `section.element` convention
- Default HTML text matches the EN translation value

## Common Mistakes

- Adding a key to EN but forgetting DE (or vice versa)
- Leaving orphan keys after removing HTML elements
- Using inconsistent key naming (e.g., mixing camelCase with dot notation)
- Forgetting to update the default innerHTML when changing the EN translation
