# DESIGN.md — Portfolio Design System

> Inspired by the [Stitch Skills](https://github.com/google-labs-code/stitch-skills) design system documentation pattern.

---

## Visual Theme & Atmosphere

**Vibe:** Professional-minimal with glassmorphism depth. Clean, confident, and data-driven — reflecting a senior analyst's precision. Generous whitespace, subtle animations, and frosted-glass surfaces create a modern, approachable feel.

**Mood:** Calm authority. Not flashy, not sterile — the sweet spot between a polished SaaS landing page and a personal creative portfolio.

---

## Color Palette & Roles

### Light Theme
| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Pure White | `#ffffff` | Page canvas |
| Text Primary | Dark Slate | `#0f172a` | Body text, paragraphs |
| Text Secondary | Muted Sage | `#657b83` | Supporting text, captions |
| Heading | Deep Ink | `#0b1220` | Section titles, card headers |
| Accent Primary | Professional Teal | `#0d9488` | CTAs, links, highlights, active states |
| Accent Hover | Deep Teal | `#0f766e` | Button hover, link hover |
| Accent Secondary | Warm Amber | `#f59e0b` | Award badges, special highlights |
| Glass Surface | Frosted White | `rgba(255,255,255,0.82)` | Card backgrounds |
| Glass Border | Subtle Slate | `rgba(15,23,42,0.08)` | Card borders, dividers |

### Dark Theme
| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep Space | `#111827` | Page canvas |
| Text Primary | Soft Light | `#eaeaea` | Body text, paragraphs |
| Text Secondary | Silver Gray | `#d1d5db` | Supporting text, captions |
| Heading | Near White | `#f9fafb` | Section titles, card headers |
| Accent Primary | Electric Cyan | `#2dd4bf` | CTAs, links, highlights, active states |
| Accent Hover | Bright Cyan | `#5eead4` | Button hover, link hover |
| Accent Secondary | Warm Amber | `#f59e0b` | Award badges, special highlights |
| Glass Surface | Dark Frosted | `rgba(31,41,55,0.75)` | Card backgrounds |
| Glass Border | Subtle Gray | `rgba(75,85,99,0.3)` | Card borders, dividers |

### Atmospheric Effects (Dark Theme)
- **Hero Glow:** Radial gradient of accent color at 8% opacity behind hero section
- **Card Glow on Hover:** `box-shadow: 0 0 30px rgba(accent, 0.12)` for interactive feedback
- **Gradient Border on Hover:** Accent-to-transparent gradient border on project cards

---

## Typography Rules

| Element | Font | Weight | Size | Letter Spacing |
|---------|------|--------|------|----------------|
| Hero Name | Space Grotesk | 700 | 4xl–6xl | -0.02em |
| Section Titles | Inter | 700 | 3xl | -0.02em |
| Card Headings | Inter | 700 | xl | -0.02em |
| Body Text | Inter | 400 | base | -0.015em |
| Supporting Text | Inter | 400 | sm | -0.015em |
| Skill Tags | Inter | 600 | 0.75rem | default |
| Metric Numbers | Space Grotesk | 700 | 4xl–5xl | -0.02em |

**Special:** Hero name uses gradient text effect (accent → accent-hover) for visual emphasis.

---

## Component Styling

### Glass Cards
- Background: `var(--glass-bg)` with `backdrop-filter: blur(20px) saturate(180%)`
- Border: `1px solid var(--glass-border)`, radius `1.25rem`
- Shadow: `0 8px 32px rgba(0,0,0,0.1)`
- Hover: Lift `translateY(-2px)`, accent glow shadow, optional gradient border
- Gradient overlay: `135deg` from white 10% to transparent

### Buttons
- **Primary:** Solid accent, pill-shaped (`border-radius: 9999px`), shadow
- **Secondary:** Glass bg, border, accent text color
- Hover: Scale 1.04, lift -3px, glow shadow

### Impact Cards
- 3-column grid, left border accent (3px solid)
- Large metric numbers with count-up animation
- Hover: Lift + accent glow

### Skill Chips
- Pill-shaped, 15% accent background, glass border
- Hover: Lift -1px, subtle shadow, icon color shift

### Timeline
- Center vertical line with animated accent progress bar
- Active card: Scale 1.05, full saturation; Inactive: 60% grayscale, 0.75 opacity
- Logo rotation on active state

---

## Animation Principles

### Scroll Reveals
- Default: `translateY(20px)` fade-in at 0.5s ease
- Directional variants: `reveal-left` (from -30px X), `reveal-right` (from +30px X)
- Stagger: 50ms increments per child (up to 450ms)

### Micro-interactions
- Card hover: 220ms ease transition
- Button hover: Scale + glow, 200ms
- Skill chip icon: Color shift on hover
- Profile image ring: Subtle pulse animation
- Scroll indicator: Bounce animation at hero bottom

### Performance
- All animations use IntersectionObserver (no scroll listeners)
- `will-change` applied only during animation, cleared after
- `contain: layout style` on cards
- `prefers-reduced-motion` fully respected

---

## Layout Principles

- **Max-width:** Content constrained to `max-w-5xl` (hero), `max-w-4xl` (impact), `max-w-3xl` (skills)
- **Spacing rhythm:** Sections `py-16`, internal `p-6` to `p-12`
- **Grid:** Bento grid for projects (1→2→3 columns), standard grid for education (2 columns)
- **Mobile-first:** Single column → multi-column breakpoints at 640px, 768px, 1024px
- **Z-index layers:** Header (50), Bottom nav (100), Toast (9998), Progress bar (9999)
