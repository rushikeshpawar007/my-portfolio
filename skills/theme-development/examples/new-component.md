# Example: Adding a New Themed Component

## The Pattern

This example shows how to add a "stat badge" component that works in both themes.

### 1. Define CSS Variables (if needed)

If your component needs colors not already in the palette, add to BOTH themes:

```css
html[data-theme='light'] {
    --stat-badge-bg: rgba(13, 148, 136, 0.1);
}
html[data-theme='dark'] {
    --stat-badge-bg: rgba(45, 212, 191, 0.1);
}
```

### 2. Write the CSS using variables

```css
.stat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--stat-badge-bg);
    border: 1px solid var(--glass-border);
    border-radius: 9999px;
    color: var(--accent-color);
    font-weight: 600;
    font-size: 0.875rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--card-glow);
}
```

### 3. Write the HTML

```html
<span class="stat-badge">
    <i class="fas fa-chart-line"></i>
    40% Improvement
</span>
```

### 4. Verify

- Toggle light/dark theme
- Check contrast ratios
- Test hover state in both themes
- Test with prefers-reduced-motion
