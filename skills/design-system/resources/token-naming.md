# Design Token Naming Conventions

## Rules

1. **Name by role, not value**: `--accent-color` not `--teal-500`
2. **Use hierarchy**: `--bg-color` (base), `--glass-bg` (surface), `--form-bg` (component)
3. **Include state**: `--accent-hover` for hover state of accent
4. **RGB variants**: Add `--accent-rgb` when opacity manipulation is needed
5. **Effect tokens**: Prefix with the effect type: `--card-glow`, `--hero-glow`, `--pulse-color`

## Naming Patterns

```
--{scope}-{property}
--{scope}-{property}-{variant}
```

Examples:
- `--bg-color` — base background
- `--glass-bg` — glass surface background
- `--glass-border` — glass surface border
- `--accent-color` — primary accent
- `--accent-hover` — primary accent hover state
- `--accent-rgb` — primary accent as RGB components
- `--accent-secondary` — secondary accent color
- `--card-glow` — card hover glow effect
- `--hero-glow` — hero section radial glow

## Anti-patterns

- `--color-1`, `--color-2` — meaningless names
- `--rgba-45-212-191-015` — value as name
- `--dark-bg` — theme-specific name in a theme-agnostic variable
- `--new-card-bg` — temporal name (what's "new" today is "old" tomorrow)
