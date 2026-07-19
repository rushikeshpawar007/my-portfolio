# DESIGN.md — "The Closing Ledger" Design System

The portfolio is typeset as a **printed, audited annual report** — the object a
Big-4 partner keeps on the desk. Warm rag paper in light mode, deep warm ink in
dark mode, hairline rules instead of cards, and every quantitative claim set in
red-ink mono like a ledger line item. The analyst's craft *is* the aesthetic:
the page reads as a beautifully typeset financial statement of a career.

**Signature move:** the accountant's closing double rule (1px hairline + 4px
double rule). Six rules at exactly four ledger moments — under the hero name,
under each of the three impact numerals (one ledger), under the contact form,
and above the footer colophon — and nowhere else. Scarcity is what makes it a
signature. Utility class: `.closing-rule` (+ `.closing-rule--red` for metrics).

---

## Typography

Three self-hosted families (`fonts/*.woff2`, no CDNs, CSP `font-src 'self'`):

| Family | Source / license | Weights | Role |
|---|---|---|---|
| **Zodiak** | Fontshare, ITF free license | 400, 700 | Display serif: hero name (700), section headings, project/degree titles, drop cap, email link |
| **Switzer** | Fontshare, ITF free license | 400, 500, 600 | Running text, labels, buttons, nav. Small-caps effects = uppercase + 0.06–0.1em tracking at 0.6875–0.8125rem, weight 500 |
| **Fragment Mono** | Google Fonts, OFL | 400 (latin + latin-ext subsets) | **All data**: numerals, dates, indices, footnote markers, typing role, tech tags, chat transcript, diagram nodes |

Core discipline: **if it is data, it is mono.** Numerals always get
`font-variant-numeric: tabular-nums`.

Scale: hero name `clamp(3rem, 8vw, 6.5rem)` Zodiak 700, line-height 0.98, ink
(never a gradient). Section headings `clamp(1.875rem, 3.5vw, 2.75rem)` Zodiak
**400**, sentence case, led by a full-width hairline rule and a mono red index
(`01`–`06`). Body Switzer 400 at 1.0625rem/1.65. Metric numerals
`clamp(3rem, 6vw, 5rem)` Fragment Mono in red ink.

## Color — one ink, two states

Red ink is the **only** color, and it means *data* (numerals, indices, rules,
focus). Scanning the page for color is scanning it for data.

### Light — "the page in daylight" (all pairs verified AA)

The paper stock is **"Softwhite"** (`#FAF4EA`, hue ≈37.5°, ~95% L). The original
`#F6F1E7` sat at hue 40° (the yellow/khaki zone) at 93.5% L — a lightness
dead-zone that reads dingy: too dark to be white, too light to be sepia.
Softwhite nudges the hue toward orange-pink and lifts lightness out of the
zone. Do not darken the paper below ~94.5% L or shift its hue past 40°.

| Role | Hex | Contrast on paper |
|---|---|---|
| Paper (bg) | `#FAF4EA` | — |
| Raised surface | `#FEFBF4` | panels, fields, plate mats |
| Ink (headings, strong rules) | `#1C1A16` | 15.9:1 |
| Body ink | `#4A4334` | 9.0:1 |
| Caption ink | `#57503F` | 7.3:1 |
| Hairline | `#DDD3C2` | structural rules only |
| Red ink (accent + small text) | `#9E2B14` | 6.8:1 |
| Red pressed (hover) | `#7C2110` | 9.2:1 |

### Dark — "the page as its own ink negative"
| Role | Hex | Contrast on bg |
|---|---|---|
| Deep ink (bg) | `#151310` | warm near-black, never navy |
| Raised surface | `#1D1A15` | — |
| Cream (headings) | `#ECE4D2` | 14.7:1 |
| Body cream | `#BFB49D` | 8.8:1 |
| Caption cream | `#A89E89` | 7.0:1 |
| Hairline | `#3A342A` | — |
| Red display (`--accent-color`) | `#E0532E` | 4.8:1 — large text/rules ONLY |
| Red small-text (`--accent-text`) | `#EF7048` | 6.3:1 (5.9:1 on raised) |

**Rule:** in dark mode, small red text must use `--accent-text`, never
`--accent-color` (which is only 4.50:1 on raised surfaces — a failed AA pass
for body sizes).

Legacy variable aliases (`--glass-bg` → surface, `--glass-border` → hairline,
etc.) are kept so Tailwind arbitrary values in markup keep resolving.

## Atmosphere

- Paper grain: one inline-SVG `feTurbulence` tile on `body::before`, fixed,
  2.5% multiply (light) / 4% screen (dark). Never stronger.
- The ledger margin line: a single fixed 1px red vertical rule at the left
  edge of the content grid, ≥1200px only (`.content-wrapper::before`).
- **No** gradients, glows, radial washes, backdrop blur, or box shadows.
  Hierarchy comes exclusively from hairlines and the two-step surface color.
- Radii: 0 on rules/tables/mats; 2px max on buttons/tags/nodes.

## Component grammar

- **Masthead**: solid paper, hairline bottom rule, name mark in small caps,
  nav links with CSS-generated mono red indices (`01`–`05`), active section =
  2px red overline. Toggles are square hairline-bordered typographic buttons.
- **Hero**: asymmetric spread — mono red role line (typing caret), Zodiak name,
  closing rule, tagline, chips as footnote entries (`¹ ² ³` superscripts that
  anchor to `#impact`), employer logos in a hairline-ruled row (grayscale at
  rest), rectangular CTAs (ink-filled / hairline outline; hover inverts).
- **Impact ledger**: three-column hairline table, no cards; red mono numerals
  with red closing rules; labels in small caps. Mobile: journal rows —
  numeral left, label right-aligned.
- **Experience**: single-column ruled ledger ("Schedule of Operations").
  Challenge / Solution / Impact as a three-column mini-table with mono red
  column headers; dates in mono red; thin red progress rail on the left
  (JS-driven `.timeline-progress`); inactive rows at 55% opacity, logos
  grayscale until active.
- **Projects**: exhibits with mono figure indices (3.0–3.3). Bot demo is a
  full-width rectangular ticket (`3.0 … +`) expanding into a report-appendix
  transcript: bot lines carry an ink left rule, user lines a red right rule,
  no bubbles. Dashboard screenshot is plate-mounted (`.plate-mount`: raised
  mat + ink border). Architecture diagrams are ruled flows: hairline node
  boxes, mono uppercase labels, red arrows.
- **Skills**: ruled index matrix — run-in small-caps heading sitting ON the
  hairline rule, cells share hairlines (per-cell `border-right/bottom` so
  unfilled tracks stay paper), mono uppercase names, icons grayscale; hover
  inverts cell to ink. Flagship group (`.skill-group--key`) gets a red heading.
- **Education**: hairline ledger rows, dates right-aligned mono red.
  Certifications are hairline stub buttons with a red `↗`.
- **Contact**: two-column filing form. Visible small-caps labels; inputs are
  underline-only (1px ink → 2px red on focus, label turns red). Email is a
  Zodiak link with red underline. Facts carry 6px red square bullets.
- **Footer**: colophon — final closing rule, name mark, social links, typeset
  credit line, mono metadata. Mobile tab bar: solid paper, hairline top rule,
  mono labels, active tab = 2px red overline.
- **Toasts / cookie banner**: raised surface, ink border, mono text, square.

## Motion — print-restrained

Rules lead, content follows: each section's top hairline draws in
(`scaleX 0→1`) on reveal, then content fades up 12px with 50ms stagger
(existing IntersectionObserver classes `section-reveal/revealed`,
`stagger-item/visible`). Hero staggers in at 100ms steps. Hover language is
strictly typographic: fill inversion, underline slide, logos regaining color —
nothing scales past 1.05, nothing glows, no parallax.
`prefers-reduced-motion`: everything pre-drawn and fully legible as a still
document; typing caret static; count-ups skipped.

## Anti-slop rules (enforced in review)

- Red ink is for **data, indices, rules, and focus states only** — if body
  links, icons, and backgrounds all go red, the ledger becomes a promo flyer.
- The closing double rule appears at exactly four ledger moments (six rule
  elements). Never add a fifth moment.
- No cards where a rule will do; no shadows ever; no backdrop blur; no pills.
- No decorative icons glued to headings; ornaments (indices, footnote markers)
  live in `aria-hidden` spans or CSS pseudo-elements, **never inside
  `data-i18n-key` nodes** (the i18n renderer overwrites textContent).
- No gradients (the hero-name gradient died with the old theme).
- Numerals inside `.metric-highlight` must remain bare `number+suffix` text —
  the count-up JS parses `textContent` (`/^(\d+)(%|x|\+)?$/`).
- German strings run ~20% longer: ruled cells use min-width + wrapping, never
  fixed widths. Verify umlauts (ä ö ü ß) render in all three faces after any
  font change.
- 1px hairlines only (no 0.5px transforms) — Windows 125–150% scaling.

## Performance & a11y invariants

- Fonts preloaded: `zodiak-700`, `switzer-400`, `fragment-mono-latin`.
  Total font budget ~140KB woff2 across 7 files.
- All reveals via IntersectionObserver; `contain: layout style` on ledger rows.
- WCAG AA verified for every token pair above; `:focus-visible` = 2px red
  outline, 3px offset, square; selection = **ink** bg / paper text (selection
  is the reader's touch, not data — red would violate the red-role rule).
- `prefers-contrast: more` collapses surfaces to bg and doubles rule weights.

## Feel & finishing (second print run)

- `scroll-padding-top: 5.5rem` — anchor jumps land with the section's leading
  hairline visible below the masthead.
- `@media print` — the report actually prints: chrome hidden, dark-mode users
  get the light sheet on white, reveals pre-fired, external links print their
  URL in mono (spot-color red is kept). Test with Ctrl+P after content edits.
- Theme toggle cross-fades via the View Transitions API (260ms, progressive
  enhancement in `src/main.js`; `.theme-switching` suppresses per-element
  transitions during the snapshot). Reduced-motion and Firefox fall back to an
  instant swap. Theme tests use `expect.poll` because the attribute write is
  async by a frame.
- `theme-color` meta (paper/ink pair + JS sync on load and on toggle) tints
  mobile browser chrome to the sheet. Known limitation: on the legal pages
  (no main.js) a saved theme opposing the OS scheme shows the OS-keyed tint.
- Favicon is the ledger mark: serif RP on paper over a red closing double rule,
  theme-aware via `prefers-color-scheme`.
- Typography: `text-wrap: balance` on display lines, `pretty` on prose (hero
  name excluded); `hyphens: auto` scoped to `html[lang='de']` prose only;
  `font-synthesis: none`; sup markers use line-height 0 so footnotes never
  disturb leading; mono numerals carry zero letter-spacing (respect the grid);
  About intro measures 60ch.
- Rhythm: 96px chapter breaks ≥768px; hero–impact tightened so the footnote
  chips visibly cite the metrics ledger; colophon gets last-page weight; one
  20px gutter on mobile shared by masthead, sections, and colophon; footer
  clears the fixed tab bar (it sits outside `<main>`).
- Press physics: hover engages at 80ms, releases at 300ms (stamp fast, ink
  dries slow); `:active` = 1px translateY, never scale. Form caret is red ink.
- Count-up uses quintic ease-out and posts the unit (%/+) only on the final
  frame; `.metric-highlight` text contract unchanged.
