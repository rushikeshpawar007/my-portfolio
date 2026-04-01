---
name: enhance-prompt
description: Use when planning any visual change, new section, or UI improvement — transforms vague ideas into structured, actionable design specifications
---

## Overview

Inspired by [Stitch Skills](https://github.com/google-labs-code/stitch-skills) `enhance-prompt` pattern. Transforms vague UI ideas into structured, detailed specifications before implementation begins.

## When to Use

- Planning a new section or component
- Redesigning an existing section
- Adding visual effects or animations
- Any time you think "make it look better" without a clear plan

## The Enhancement Pipeline

### Step 1: Assess the Input

Before implementing, check for missing elements:
- [ ] **Platform context** — Desktop-first? Mobile-first? Both?
- [ ] **Section/component type** — Hero, card, grid, form, navigation?
- [ ] **Content structure** — What data/text goes where?
- [ ] **Visual style** — Matches existing DESIGN.md atmosphere?
- [ ] **Color usage** — Uses existing CSS variables? Needs new ones?
- [ ] **Interaction states** — Hover, focus, active, disabled?

### Step 2: Check DESIGN.md

Always consult `DESIGN.md` before proceeding:
1. Read the Visual Theme & Atmosphere section
2. Verify color choices against the palette
3. Check typography rules for the component type
4. Review animation principles for consistency

### Step 3: Apply Enhancements

Transform vague terms into professional specifications:

| Vague | Specific |
|-------|----------|
| "nice header" | "sticky nav with glassmorphism, backdrop-blur-xl, accent border on scroll" |
| "make it pop" | "accent glow shadow on hover, 220ms ease transition, translateY(-2px)" |
| "modern cards" | "glass-card with frosted bg, 1.25rem radius, gradient overlay, hover lift" |
| "cool animation" | "IntersectionObserver reveal, 0.6s cubic-bezier(0.16, 1, 0.3, 1), stagger 50ms" |
| "better colors" | "Use --accent-color for emphasis, --accent-secondary for highlights" |

### Step 4: Structure the Specification

Format every visual change as:

```
## [Component Name]

**Vibe:** [one-line atmosphere description]
**Design System:** Uses [list CSS variables from DESIGN.md]
**Structure:**
1. [Element] — [styling details]
2. [Element] — [styling details]
**States:** hover | focus | active
**Animation:** [type, duration, easing]
**Accessibility:** [contrast ratio, reduced-motion handling]
```

## Common Mistakes

- Implementing before specifying — always write the spec first
- Using hardcoded colors instead of CSS variables
- Forgetting to define all interaction states
- Not checking DESIGN.md for consistency
- Skipping reduced-motion considerations
