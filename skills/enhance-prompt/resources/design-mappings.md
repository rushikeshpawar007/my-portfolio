# Design Mappings

Transforms vague terms into professional UI/UX vocabulary, adapted from the Stitch Skills pattern.

## Atmosphere Descriptors

| Vague Term | Professional Specification |
|-----------|---------------------------|
| modern | Clean lines, generous whitespace, subtle shadows, Inter/Space Grotesk typography |
| professional | Muted palette, structured grid, clear hierarchy, minimal decoration |
| clean | High whitespace ratio, restrained color use, consistent spacing rhythm |
| dark mode | Electric high-contrast accents on deep slate (#111827), cyan highlights |
| glassmorphic | Frosted surfaces (backdrop-blur: 20px), semi-transparent backgrounds, subtle borders |
| elegant | Refined typography, deliberate spacing, accent used sparingly for emphasis |
| data-driven | Clear metric displays, tabular-nums, Space Grotesk for numbers, left-aligned data |

## Component Translations

| Vague | Specific |
|-------|----------|
| card | glass-card: frosted bg, 1.25rem radius, 1px glass-border, hover lift |
| button | ios-button: pill-shaped (9999px radius), 0.75rem 1.5rem padding, shadow |
| tag/badge | skill-tag-sm: 9999px radius, 15% accent bg, 0.75rem text, 600 weight |
| animation | IntersectionObserver reveal, 0.6s cubic-bezier(0.16, 1, 0.3, 1) |
| glow | box-shadow: 0 0 30px var(--card-glow), accent border on hover |
| gradient text | background: linear-gradient(135deg, accent, accent-hover), -webkit-background-clip: text |

## Color Role Vocabulary

When specifying colors, always use this format:
**"[Descriptive Name] ([hex]) for [functional role]"**

Examples:
- "Professional Teal (#0d9488) for primary CTAs and active states"
- "Electric Cyan (#2dd4bf) for dark theme accent highlights"
- "Warm Amber (#f59e0b) for award badges and special callouts"
