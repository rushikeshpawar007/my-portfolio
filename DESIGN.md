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
| **Fragment Mono** | Google Fonts, OFL | 400 (latin + latin-ext subsets) | Numerals, dates, section indices, skill labels, diagram nodes, and compact metadata |

Core discipline: **if it is data, it is mono.** Numerals always get
`font-variant-numeric: tabular-nums`.

Scale: desktop hero name `clamp(3.5rem, 6vw, 5rem)` Zodiak 700, line-height 0.98, ink
(never a gradient). Section headings `clamp(1.875rem, 3.5vw, 2.75rem)` Zodiak
**400**, sentence case, led by a full-width hairline rule and a mono red index
(`01`–`06`). Body Switzer 400 at 1.0625rem/1.65. Metric numerals
`clamp(2.5rem, 4vw, 3.5rem)` on desktop, in Fragment Mono and red ink.

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

- The paper surface uses its solid theme color. Avoid full-viewport grain
  overlays and blend layers: profiling showed a substantial scrolling cost.
- The ledger margin line: a single fixed 1px red vertical rule at the left
  edge of the content grid, ≥1200px only (`.content-wrapper::before`).
- **No** gradients, glows, radial washes, backdrop blur, or box shadows.
  Hierarchy comes exclusively from hairlines and the two-step surface color.
- Radii: 0 on rules/tables/mats; 2px max on buttons/tags/nodes.

## Component grammar

- **Masthead**: solid paper, hairline bottom rule, RP mark and compact name.
  Desktop active section uses a 2px overline; the tablet overlay uses an inline
  rule and leaves page geometry unchanged. Navigation and toggle targets are at
  least 44px high. Toggles are square hairline-bordered typographic buttons.
- **Hero**: asymmetric spread — stable body-font role line, Zodiak name,
  closing rule, tagline, one primary case-study action, and quieter CV/LinkedIn
  links. Employer logos sit in a ruled row, with portrait/location alongside.
- **Impact ledger**: three-column hairline table, no cards; red mono numerals
  with red closing rules; labels in sentence case. Mobile: journal rows —
  numeral left, label right-aligned.
- **Experience**: four single-column ruled rows share the same logo, role,
  company, date, and lead layout. The first three have optional native details
  with Challenge / Solution / Impact columns. Dates use muted mono text; rows
  remain at full opacity, with stable monochrome logos in both themes.
- **Projects**: featured finance comparison followed by supporting exhibits
  1.1–1.4. Bot demo is a full-width rectangular ticket expanding into a report-appendix
  transcript: bot lines carry an ink left rule, user lines a red right rule,
  no bubbles. Dashboard screenshot is plate-mounted (`.plate-mount`: raised
  mat + ink border). Architecture diagrams are ruled flows: hairline node
  boxes, mono uppercase labels, red arrows.
- **Skills**: ruled index matrix — run-in small-caps heading sitting ON the
  hairline rule, cells share hairlines (per-cell `border-right/bottom` so
  unfilled tracks stay paper), mono uppercase names, icons grayscale. Static
  labels retain their appearance on hover; interactive certification links
  carry button feedback. The flagship group has an accent rule.
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
(`scaleX 0→1`) on reveal, then project items settle by 8px with a short row stagger
(existing IntersectionObserver classes `section-reveal/revealed`,
`stagger-item/visible`). Hero staggers in at 60ms steps, capped at 300ms. Hover uses
fill inversion, underline movement, a 2px button lift, and gentle preview motion —
nothing scales past 1.05, nothing glows, no parallax.
`prefers-reduced-motion`: everything pre-drawn and fully legible as a still
document; count-ups skipped.

### "The report, plotted" — richer motion layer
The same restrained language, extended so the page reads as an annual report being
drawn/typeset. All added on top of the existing reveal classes; all forced to their
end-state under `prefers-reduced-motion` (so nothing that starts hidden stays hidden):
- **Closing rules draw** left→right (`scaleX 0→1`, `.closing-rule.drawn`, added by a
  `ruleObs` observer). Animated metrics draw their rules after the count-up settles;
  formatted static metrics draw their rules when they enter view.
- **Section headings settle** by 5px as their section fades in; the hero name uses
  the same gentle fade and 6px lift as the other hero copy.
- **Architecture diagrams assemble** — `.arch-layer`/`.arch-connector` stagger in on the
  card's `.visible`.
- **Folio ink line** — `#folio-progress` fills top→down using a CSS scroll timeline;
  older browsers update its transform directly without inherited custom properties.
- **Ledger rows** retain full opacity and take a faint accent wash on hover.
Guardrail: initial hidden states depend on successful JS initialization and the
`.motion-ready` class. Reduced-motion, print, and script-failure overrides keep
the page readable.

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
- `theme-color` meta tints mobile browser chrome to the active sheet. The
  portfolio and legal pages both reconcile saved themes with the browser tint.
- Header, browser, touch, and sharing icons use the same outlined Zodiak RP
  square. The SVG favicon adapts to the browser color scheme; PNG fallbacks
  use the light-theme mark. Rebuild exports with `node scripts/export-brand-assets.cjs`.
- Typography: `text-wrap: balance` on display lines, `pretty` on prose (hero
  name excluded); `hyphens: auto` scoped to `html[lang='de']` prose only;
  `font-synthesis: none`; sup markers use line-height 0 so footnotes never
  disturb leading; mono numerals carry zero letter-spacing (respect the grid);
  About intro measures 60ch.
- Rhythm: 56px chapter padding ≥768px and 40px on phones; hero–impact uses
  tighter spacing; colophon gets last-page weight; one
  20px gutter on mobile shared by masthead, sections, and colophon; footer
  clears the fixed tab bar (it sits outside `<main>`).
- Buttons use a 180ms color transition and a 240ms eased, 2px lift on pointer
  hover; pressing moves down 1px. Form caret is red ink.
- Count-up uses an 850ms quintic ease-out and retains the unit (%/+) throughout;
  `.metric-highlight` final text stays unchanged.


## Portfolio review — September 2026

- Reading order: hero, impact, selected projects (01), about (02), experience (03), skills (04), education (05), contact (06).
- The role line is stable: Senior Business Analyst. Mobile uses a small portrait and places the finance case-study action before the CV link.
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
- The Spotify screenshot appears in its preview and its expanded case study; supporting projects use compact workflow illustrations.

## Final editorial refinement

- The hero uses a stable Senior Business Analyst role, the approved finance ownership statement, and one primary case-study action. CV and LinkedIn use quieter text links.
- Location and availability sit beside the portrait. Repeated technology chips and navigation indices are removed.
- Supporting projects use top rules and aligned disclosure controls instead of surrounding boxes. The reporting comparison remains the main visual anchor.
- The first three experience entries show a lead and two contributions. Native role disclosures retain the full context, work without scripts, and expand for print.
- Warm paper, charcoal, terracotta, and sage remain the palette, with corresponding accessible dark-theme colors.

## UI and interaction refinement

- Supporting projects now show concise workflow illustrations and the existing Spotify dashboard preview before their disclosures. The figures describe the actual workflows; full details remain available in each case study.
- A small RP masthead mark, sentence-case headings, and readable impact captions carry the editorial identity. Main chapter padding is 56px on desktop and 40px on phones; the hero and impact strip retain their own spacing.
- The About section pairs the introduction with a compact facts column on desktop and stacks on phones. At 320px, impact values are smaller to give German labels adequate room.
- Contact fields sit on a distinct surface, with native name/email autocomplete, a vertically resizable message field, and a privacy link. Cookie, theme, language, and copy controls meet a 44px minimum target. The copy control is bilingual.
- Tablet navigation dismisses on Escape, outside interaction, focus leaving, and breakpoint changes. Navigation announces the active section with `aria-current`; section jumps and Back to top preserve a useful keyboard focus destination.

## Subtle motion refinement

- The existing light and dark palettes remain unchanged. Motion uses one gentle ease and short distances. Section reveals remain one-shot; project previews loop while visible with a pause control.
- Sections fade in once over 500ms. Headings settle by 5px, project items by 8px, and row stagger is limited to 60ms (120ms for the third impact metric). Phone project cards have no stagger delay.
- Hero copy settles by 6px with a maximum 300ms delay. The closing rule draws independently, without the previous competing translation.
- Case studies and role details open and close over 240ms. Repeated activation reverses from the current height; keyboard activation, direct case links, printing, content changes, and viewport changes retain native disclosure behavior.
- Buttons, disclosure labels, and project previews have small pointer-hover responses. All extra movement respects reduced motion; changes to the OS preference take effect during the session, and script failure keeps content readable.
- Unused pointer tracking and hidden timeline progress calculations have been removed.

## High-refresh rendering

- Reading indicators use `transform` with native CSS scroll timelines where supported. The fallback updates only the two indicator elements; document range is cached and refreshed when content or viewport size changes. Never animate the progress bar's width or write scroll progress to an inherited root variable.
- The masthead keeps a fixed height while scrolling. JavaScript changes header and Back to top state only when their thresholds are crossed.
- Count-ups write text only when the displayed value changes. Decorative reveals remain one-shot transforms and fades; no continuous FPS counter or animation loop runs while idle.
- Native disclosures retain their short height transition so surrounding content moves naturally. Project cards use layout/style containment to bound that work without clipping content or focus outlines. Do not replace expansion with text-distorting scale effects or add `will-change: height`.
- Target budget for 120 Hz is 8.33ms per frame, shared by JavaScript, styles, layout, paint, and compositing. Actual delivery depends on the display, browser, and hardware and must be checked on a 120 Hz device.
- Guidance: [Chrome scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) and [web.dev animation performance](https://web.dev/articles/animations-guide).

## Project previews

- Four short, looping stories accompany the reporting, invoice, finance chatbot, and Spotify projects. They use the existing palette, typography, and local icon sprite.
- Reporting connects source records to one report before revealing the time saving. Invoice steps advance from CSV/Excel through Python to PDF. The chatbot shows a clearly labeled fictional Q3 question, thinking indicator, answer, and source.
- Spotify gently tours the existing authentic dashboard screenshot. This is an image preview, not a recording of filtering or live chart updates. The public Tableau dashboard remains available through its existing link.
- Each 3–4 second story repeats while visible, holding the complete frame for 1.2 seconds between cycles. A keyboard-accessible Pause/Resume control lets visitors stop the animation on its readable final frame. The visitor's pause choice survives scrolling, tab changes, language changes, and preference changes.
- Offscreen previews, background tabs, printing, and reduced motion settle to the complete still frame and cancel their pending cycle. Eligible visible previews resume automatically. No JavaScript or animation API also yields that still frame with controls hidden.
- Text and playback labels support English and German. Invoice steps stack when enlarged text leaves insufficient width. Preview animation uses only transforms and opacity, with one cancellable timer between cycles; no GIF downloads, external players, or per-frame JavaScript loops are added.

## Consistency checks

- English and German dates, source amounts, informative image descriptions, and accessible navigation labels switch together. German visitor-facing forms use informal address consistently.
- Repeated savings use `₹200k`; the industries fact lists sectors, and product names use their established spelling (`n8n`).
- All four experience entries share the same header and content alignment. Native project and role disclosures both open for direct links and use the same motion and keyboard behavior.
- Static skills never imitate clickable controls. The demo close button shares the 44px target size used by the other controls.
- Long headings and labels wrap within their columns. Project, impact, and skill layouts adapt to larger text; comparison values stack when their panel has insufficient space. Test the actual content bounds because the outer sheet clips horizontal overflow.
- Cookie choices wrap and the banner scrolls within short viewports. Reopening settings moves focus to the choices and returns it to the opener on dismissal.
- Form and clipboard feedback stay in the selected language throughout pending, success, and reset states. Successful submissions clear only the submitted draft; edits made while waiting remain intact.
- Legal pages share guarded theme initialization and browser-chrome tinting. Their headings, URLs, and 44px Back links remain usable at 320px and with enlarged text.
- Company and school marks use one monochrome source each, explicit dimensions, and consistent theme filters. They never change color during scrolling or hover. The S.M. placeholder is a theme-aware monogram, not an asserted official company logo.
- Tool icons use 20px slots; diagram and copy icons use a 16px minimum. SVG artwork stays inside its viewBox, and decorative icons are hidden from assistive technology while their controls retain meaningful labels.
