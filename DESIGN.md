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
| **Fragment Mono** | Google Fonts, OFL | 400 (latin + latin-ext subsets) | **All data**: numerals, dates, indices, footnote markers, role line, tech tags, chat transcript, diagram nodes |

Core discipline: **if it is data, it is mono.** Numerals always get
`font-variant-numeric: tabular-nums`.

Scale: hero name `clamp(3rem, 8vw, 6.5rem)` Zodiak 700, line-height 0.98, ink
(never a gradient). Section headings `clamp(1.875rem, 3.5vw, 2.75rem)` Zodiak
**400**, sentence case, led by a full-width hairline rule and a mono red index
(`01`–`06`). Body Switzer 400 at 1.0625rem/1.65. Metric numerals
`clamp(3rem, 6vw, 5rem)` Fragment Mono in red ink.

## Color — ivory, charcoal, sage, and terracotta

The page keeps its printed-report identity with a more neutral ivory sheet,
charcoal ink, and terracotta for results, indices, and focus. Muted sage is
reserved for the featured before/after comparison. White panels distinguish
project previews from the page without gradients or shadows.

| Role | Light | Dark |
|---|---|---|
| Page | #F8F7F4 | #181C19 |
| Surface | #FFFFFF | #222823 |
| Heading ink | #242824 | #F3F2EA |
| Body ink | #454B45 | #CCD1C7 |
| Caption ink | #596059 | #B1BAAF |
| Hairline | #D8DDD5 | #404A41 |
| Accent text / data | #A4432E | #EF987E |
| Accent hover | #843323 | #FFB69D |
| Featured surface | #EDF1E9 | #2B352D |
| Featured ink | #354A39 | #D4E1CF |

Measured text contrast: body on page 8.36:1 light / 11.09:1 dark;
captions on surface 6.48:1 / 7.53:1; accent on the featured surface
5.37:1 / 5.74:1; featured ink on featured surface 8.38:1 / 9.38:1.
Semantic color pairs have browser regression coverage at a 4.5:1 minimum.
Legacy aliases resolve to these tokens. The default root palette is light,
so the no-JavaScript page retains intentional styling.

## Atmosphere

- Paper grain: one inline-SVG `feTurbulence` tile on `body::before`, fixed,
  1.2% multiply (light) / 1.8% screen (dark). Never stronger.
- The ledger margin line: a single fixed 1px red vertical rule at the left
  edge of the content grid, ≥1200px only (`.content-wrapper::before`).
- **No** gradients, glows, radial washes, backdrop blur, or box shadows.
  Hierarchy comes exclusively from hairlines and the two-step surface color.
- Radii: 0 on rules/tables/mats; 2px max on buttons/tags/nodes.

## Component grammar

- **Masthead**: solid paper, hairline bottom rule, name mark in small caps,
  nav links with CSS-generated mono red indices (`01`–`05`), active section =
  2px red overline. Toggles are square hairline-bordered typographic buttons.
- **Hero**: asymmetric spread — stable mono role line, Zodiak name,
  closing rule, tagline, chips as footnote entries (`¹ ² ³` superscripts that
  anchor to `#impact`), employer logos in a hairline-ruled row (grayscale at
  rest), rectangular CTAs (ink-filled / hairline outline; hover inverts).
- **Impact ledger**: three-column hairline table, no cards; red mono numerals
  with red closing rules; labels in small caps. Mobile: journal rows —
  numeral left, label right-aligned.
- **Experience**: single-column ruled ledger ("Schedule of Operations").
  Challenge / Solution / Impact as a three-column mini-table with mono red
  column headers; dates in mono red; thin red progress rail on the left
  (JS-driven `.timeline-progress`); rows at full opacity, logos
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
document; count-ups skipped.

### "The report, plotted" — richer motion layer
The same restrained language, extended so the page reads as an annual report being
drawn/typeset. All added on top of the existing reveal classes; all forced to their
end-state under `prefers-reduced-motion` (so nothing that starts hidden stays hidden):
- **Closing rules draw** left→right (`scaleX 0→1`, `.closing-rule.drawn`, added by a
  `ruleObs` observer). The three metric rules draw *after* the count-up settles (drawn
  from the count-up's final frame) — the audit line ruled under the total.
- **Section headings "set"** via a top-down `clip-path` reveal on the title text span
  (eyebrow index excluded); the hero name uses a matching clip+fade (`hero-name-set`).
- **Architecture diagrams assemble** — `.arch-layer`/`.arch-connector` stagger in on the
  card's `.visible`.
- **Folio ink line** — the left-margin rule fills top→down with scroll progress via
  `--folio` (set in the scroll handler) driving `.content-wrapper::after` `scaleY`.
- **Ledger rows** un-dim + take a faint accent wash on hover.
Guardrail: initial hidden states (`scaleX(0)`, clipped) depend on JS adding the trigger
class, consistent with the existing `.section-reveal` contract; reduced-motion overrides
make them visible regardless.

## Anti-slop rules (enforced in review)

- Red ink is for **data, indices, rules, and focus states only** — if body
  links, icons, and backgrounds all go red, the ledger becomes a promo flyer.
- The closing double rule appears at exactly four ledger moments (six rule
  elements). Never add a fifth moment.
- Project previews use a thin border and a white / raised surface. Elsewhere prefer rules to cards; no shadows, backdrop blur, or pills.
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


## Portfolio review — September 2026

- Reading order: hero, impact, selected projects (01), about (02), experience (03), skills (04), education (05), contact (06).
- The role line is stable: Senior Business Analyst · Finance BI & Automation. Mobile uses a small portrait and places the finance case-study action before the CV link.
- Month-end report preparation fell from approximately 10 hours to 5 minutes per month (about 99%); this measures manual preparation for that report, not total reporting operations or maintenance.
- Project exhibits 1.0–1.4 cover monthly reporting, royalties, the finance chatbot, invoice automation, and Spotify. Case-study facts use ruled definition lists.
- The chatbot is a predefined, bilingual demonstration using explicitly fictional figures and a visible source table. It shows both a calculation and an unavailable-data response.
- No global character-key shortcuts. Demo disclosure retains Enter/Space and Escape with focus restoration.
- Reveal animations are gated by successful initialization through .motion-ready; default and failed-script rendering remains readable.
- At mobile sizes, the cookie banner sits above the bottom navigation. The expanded demo has no fixed height limit.
- Browser tests run through the local HTTP server, with regression coverage for translations, script failure, sources, and responsive layouts.

## Compact project presentation — September 2026

- Content measure: 1280px. The compact desktop hero and impact strip fit within the first 900px viewport at 1440px width.
- The reporting project leads with a sage before/after panel, large mono values, and a terracotta top rule. Its measurement scope remains in the expandable case study.
- Four supporting previews form a two-column desktop grid and a single phone column. Native details disclose the full case studies and work without JavaScript.
- Each disclosure references its project title for assistive technology. Deep links open the relevant case study; print opens all studies and restores their previous state afterward.
- Phone navigation uses the bottom tabs only. The menu button is retained at tablet widths (768–1023px); desktop uses the masthead links. Theme and language controls remain available at every size.
- Product screenshots are deferred. The existing Spotify image is retained inside its case study.
