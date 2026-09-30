# DESIGN.md — "The Closing Ledger" Design System

The portfolio is typeset as a **printed, audited annual report** — the object a
Big-4 partner keeps on the desk. Warm rag paper in light mode, deep warm ink in
dark mode, hairline rules instead of cards, and restrained red-ink data accents
like ledger line items. The analyst's craft *is* the aesthetic:
the page reads as a beautifully typeset financial statement of a career.

**Signature move:** the accountant's closing double rule (1px hairline + 4px
double rule). Six rules at exactly four ledger moments — under the hero name,
under each of the three impact numerals (one ledger), under the contact form,
and above the footer colophon — and nowhere else. Scarcity is what makes it a
signature. Utility class: `.closing-rule` (+ `.closing-rule--red` for metrics).

---

## Typography

Three self-hosted families (`assets/fonts/*.woff2`, no CDNs, CSP `font-src 'self'`):

| Family | Source / license | Weights | Role |
|---|---|---|---|
| **Zodiak** | Fontshare, ITF free license | 400, 700 | Display serif: hero name (700), page/section headings, project/role/degree titles, email link |
| **Switzer** | Fontshare, ITF free license | 400, 500, 600 | Running text, labels, buttons and nav. Sentence case for semantic headings and controls; metadata stays readable at 13–15px. |
| **Fragment Mono** | Google Fonts, OFL | 400 (latin + latin-ext subsets) | Tabular values, dates, section indices, and compact diagram metadata |

Mono distinguishes tabular data and dates from prose. Outcome sentences use the
body family so the result and its context read together; tables and animated
metric displays retain tabular numerals.

The shared roles and palette live in `styles/foundations.css`, included in both
the portfolio and legal bundles. `styles/typography.css` maps portfolio components
to those roles; `styles/legal.css` applies them to the standalone documents.

| Role | Default fluid range | Treatment |
| --- | --- | --- |
| Page identity/title | 44–72px | Display serif; hero name retains its bold weight |
| Major section | 32–48px | Regular display serif with a quiet numbered label |
| Project, role, degree title | 28–32px | One shared regular display-serif role |
| Subsection/category heading | 20–24px | Semibold body face |
| Supported outcome | 20–24px | Semibold body face, with a smaller measurement/context label |
| Description/body | 17px | 1.65–1.7 line height, comfortable reading measure |
| Lead | 19px | Introductory or emphasized prose |
| Expanded role labels | 19px | Semibold body face in neutral heading ink |
| Metadata/caption | 13–15px | Secondary colour, sentence case |

Sizes use rem-based limits and natural wrapping. Mini dashboards keep their
own data hierarchy without overriding the project-title role.

## Shared layout and project structure

- The page measure is 76rem, with fluid gutters and a 65ch reading measure.
  A quarter-rem spacing scale supplies related-content gaps; section spacing
  ranges from 3rem to 6rem. Header, main sections and footer share the page grid.
- Projects follow category → title → supported outcome → description → actual
  tools → case-study action. Preview scenes illustrate the work. The featured
  card uses the same type roles with a deliberate split surface.
- Reporting automation, reconciliation and sales pipeline history lead. The
  dbt material is a technical chapter inside the sales-history case, retaining
  both legacy fragment IDs. Each of the seven projects owns a full-width row,
  with its primary animation visible before the project details are opened.
- Budget analysis, data cleaning and the current-pipeline calculation sit in
  optional native disclosures. Historical stage analysis is the sales case's
  primary example. The current-pipeline sample uses an explicit five-stage
  allowlist and excludes both Closed Won and Closed Lost.
- Compact category navigation replaces repeated chapter headings. Legacy
  category fragment IDs remain on visible metadata, so bookmarks still work.
- Desktop project rows top-align the overview beside the primary animation.
  Details expand underneath across the reading width without rearranging the
  overview. Tablet and mobile stack copy, animation and disclosure control.
  Opening facts sit close to the summary without a second top divider or added
  margin. This layout also works without JavaScript.
- A disclosure says **Show project details** / **Hide project details**.
  Navigation links say **View case study** or describe their destination.
  The plus/collapse indicator, visible focus outline and native keyboard
  semantics remain consistent.
- The reporting result is prominent once in its overview and explicitly names
  monthly manual preparation. Detailed evidence stays in the expanded case.
  No new results or project stacks are inferred to fill empty fields.
- Contact uses the shared gutter and gap scale with balanced copy/form columns;
  skills use equal icon containers with optically balanced marks and individual
  brand-colour interactions.

Implementation guidance: [W3C heading structure](https://www.w3.org/WAI/tutorials/page-structure/headings/),
[W3C reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), and
[web.dev responsive typography](https://web.dev/learn/design/typography).

The design rationale is to make project titles and outcomes easy to scan, keep
related copy and controls close together, and separate sections with a consistent
spacing scale. This follows NN/g's research on [heading-led scanning](https://www.nngroup.com/articles/layer-cake-pattern-scanning/)
and [proximity](https://www.nngroup.com/articles/gestalt-proximity/), alongside
[GOV.UK's spacing guidance](https://design-system.service.gov.uk/styles/spacing/).
Preserve comfortable control areas as spacing changes; [WCAG 2.2 target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
sets a 24 × 24 CSS-pixel minimum subject to its exceptions, while this system uses a 44px
control token. These principles guide refinements rather than certify usability
or accessibility conformance.

## Color — ivory, charcoal, sage, and terracotta

The page keeps its printed-report identity with a more neutral ivory sheet,
charcoal ink, and terracotta for results, indices, and focus. Muted sage is
reserved for the featured before/after comparison. Warm off-white panels soften
the light surface contrast; slightly lighter dark surfaces and hairlines make
grouping easier to see without gradients or shadows. The page, ink, sage and
terracotta tokens remain unchanged.

| Role | Light | Dark |
|---|---|---|
| Page | #F8F7F4 | #181C19 |
| Surface | #FDFCF9 | #252D27 |
| Heading ink | #242824 | #F3F2EA |
| Body ink | #454B45 | #CCD1C7 |
| Caption ink | #596059 | #B1BAAF |
| Hairline | #D8DDD5 | #49544B |
| Accent text / data | #A4432E | #EF987E |
| Accent hover | #843323 | #FFB69D |
| Featured surface | #EDF1E9 | #2B352D |
| Featured ink | #354A39 | #D4E1CF |

Calculated text contrast from the palette tokens: body on page 8.36:1 light / 11.09:1 dark;
captions on surface 6.31:1 / 7.09:1; body on surface 8.73:1 / 9.11:1;
accent on the featured surface
5.37:1 / 5.74:1; featured ink on featured surface 8.38:1 / 9.38:1.
Semantic color pairs have browser regression coverage at a 4.5:1 minimum.
Legacy aliases resolve to these tokens. The default root palette is light,
so the no-JavaScript page retains intentional styling.

## Atmosphere

- The paper surface uses its solid theme color. Avoid full-viewport grain
  overlays and blend layers: profiling showed a substantial scrolling cost.
- The ledger margin line: a single fixed 1px red vertical rule at the left
  edge of the content grid, ≥1200px only (`.content-wrapper::before`).
- **No** gradients, radial washes, backdrop blur or decorative glow/shadows.
  Hierarchy comes exclusively from hairlines and the two-step surface color.
- Radii: 0 on rules/tables/mats; 2px max on buttons/tags/nodes.

## Component grammar

- **Masthead**: solid paper, hairline bottom rule, RP mark and compact name.
  Hover or keyboard focus reveals a small terracotta corner signature beside
  the RP mark; the monogram stays consistent with browser and touch icons.
  Desktop active section uses a 2px overline; the tablet overlay uses an inline
  rule and leaves page geometry unchanged. Navigation and toggle targets are at
  least 44px high. Toggles are square hairline-bordered typographic buttons.
  Their accessible names and tooltips describe the next theme or language,
  updating together after either setting changes.
- **Controls**: primary and secondary actions use sentence case, shared body
  typography and visible focus states.
- **Hero**: asymmetric spread — stable body-font role line, Zodiak name,
  closing rule, prominent value proposition, quieter role context, one primary case-study action, and quieter CV/LinkedIn
  links. Employer logos sit in a ruled row, with portrait/location alongside.
  The complete circular source photograph sits inside one hairline frame,
  without additional zoom or cropping. Its centered location caption sits
  closely below. Mobile places a compact portrait beside the caption so the
  primary action stays in view.
- **Impact ledger**: three-column hairline table, no cards; red mono numerals
  with red closing rules; labels in sentence case. Mobile: journal rows —
  numeral left, label right-aligned.
- **Experience**: four single-column ruled rows share the same logo, role,
  company, date, and lead layout. The first three have optional native details
  with context, contribution and outcome labels in neutral 19px semibold sans
  serif. Dates use muted mono text; rows
  remain at full opacity, with stable monochrome logos in both themes.
- **Projects**: one Selected work section, with compact category links for
  Reporting, Data quality and Automation. Each card reads category, title,
  supported outcome, description, technologies and details, with an illustration
  subordinate to that message. Real delivered outcomes lead fictional sample numbers. Sales
  pipeline reporting links to its dbt technical chapter; both describe the same
  project. Short reasoning notes explain the documented approach without adding
  unsupported impact claims. Type roles live in `styles/typography.css`;
  category navigation and career styles live in `styles/storytelling.css`.
  The title and meaning precede the animated sample. Each animated story ends
  in a readable still frame, held for two seconds before the next visible loop.
  Matched records, review exceptions, retained deal versions and distributed
  statements make the business mechanism visible using transforms and opacity.
  Bot demo is a full-width rectangular ticket expanding into a report-appendix
  transcript: bot lines carry an ink left rule, user lines a red right rule,
  no bubbles. Dashboard screenshot is plate-mounted (`.plate-mount`: raised
  mat + ink border). Architecture diagrams are ruled flows: hairline node
  boxes, mono uppercase labels, red arrows.
- **Skills**: neutral hairline category dividers and quiet, borderless tool tiles
  on the existing surface colour. Normal-flow, sentence-case headings allow
  room for long German labels; 12px gaps separate tiles. Centered 17px tool names
  sit below equal 52px icon containers. Marks use 36–44px optical sizing, with
  smaller solid symbols and larger sparse or horizontal artwork. Product marks and distinct
  concept symbols use the theme's heading color at rest. On pointer hover, icons
  reveal their primary brand color with a brief fade; concept icons use
  the portfolio accent. Tight neutral backings keep dark or yellow marks visible
  where needed, with 6px corners and no shadow; other marks have no backing.
  Documented tools link to relevant project or experience evidence. Linked
  cells show a compact, underlined destination with an inline right arrow and
  color only the hovered or keyboard-focused icon. Destination labels stay visible
  on every device. Tiles use natural content height with an 8.75rem minimum;
  all categories use the same responsive grid with a 10rem preferred minimum
  tile width. Partial rows retain equal widths. Phones use two columns, with
  one column for enlarged text. Category spacing is 1.5rem. Stack
  captions occupy the same reserved space as group notes, avoiding layout jumps.
  Tool names retain their appearance on hover. All four categories share the
  same neutral divider; Automation & AI has no extra accent rule.
- **Education**: hairline ledger rows, dates right-aligned mono red.
  Certifications are hairline stub buttons with a red `↗`.
- **Contact**: two-column filing form. Visible small-caps labels; inputs are
  underline-only (1px ink → 2px red on focus, label turns red). Email is a
  Zodiak link with red underline. Facts carry 6px red square bullets.
- **Footer**: colophon — final closing rule, name mark, social links, typeset
  credit line, mono metadata. Mobile tab bar: solid paper, hairline top rule,
  mono labels, active tab = 2px red overline. Phones hide the floating top
  button and provide a 44px in-flow footer return link to `#main`.
- **Toasts / cookie banner**: raised surface, ink border, mono text, square.

## Motion — print-restrained

The case studies contain optional, explicitly fictional analyst exercises:
`lineage-explorer` traces one current-deal metric through source, SQL/model and
reporting, with retained history shown as a separate branch; `data-cleaning`
shows original values, date normalization, exact duplicate removal and unresolved
missing amounts. Both retain complete readable examples without JavaScript.
Their finite response effects animate only opacity and transforms and respect
reduced motion. The budget chart can highlight the actual-versus-plan gap on its
shared scale. These exercises stay inside native case-study disclosures.

Rules lead, content follows: each section's top hairline draws in
(`scaleX 0→1`) on reveal, then project items settle by 8px with a short row stagger
(existing IntersectionObserver classes `section-reveal/revealed`,
`stagger-item/visible`). Hero staggers in at 60ms steps, capped at 300ms. Hover uses
fill inversion, underline movement, a 2px button lift, and gentle preview motion —
nothing scales past 1.05; only skill icons glow on pointer hover. No parallax.
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
- Project previews use a thin border and a warm off-white / raised dark surface. Elsewhere prefer rules to cards; no shadows, backdrop blur, or pills.
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
- Rhythm: sections share the fluid 3–6rem spacing token; hero–impact uses
  tighter spacing; colophon gets last-page weight; the fluid page gutter
  starts at 20px and is shared by masthead, sections, and colophon; footer
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

## Full-width project presentation — September 2026

- Content measure: 76rem, with fluid gutters. The hero and impact strip retain a tighter relationship than separate content sections.
- The reporting project leads with a clearly scoped outcome, sage workflow illustration and terracotta top rule. The manual-preparation measurement is labeled in the overview; detailed evidence remains in the case study.
- Three primary cases lead, followed by royalty automation, the finance chatbot, invoice automation and Spotify. All seven projects have their own full-width row and visible primary animation. The dbt technical chapter belongs to sales pipeline history. Native details disclose supporting evidence and work without JavaScript.
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
- A small RP masthead mark, sentence-case headings, and readable impact captions carry the editorial identity. Main sections share fluid spacing; the hero and impact strip retain a tighter gap.
- The About section pairs the professional approach with business context, data and delivery examples; employment chronology stays in Experience. Its introduction has no isolated first-letter accent. It stacks on phones. At 320px, impact values are smaller to give German labels adequate room.
- Contact fields sit on a distinct surface, with native name/email autocomplete, a vertically resizable message field, and a privacy link. Cookie, theme, language, and copy controls meet a 44px minimum target. The copy control is bilingual.
- Tablet navigation dismisses on Escape, outside interaction, focus leaving, and breakpoint changes. Navigation announces the active section with `aria-current`; section jumps and Back to top preserve a useful keyboard focus destination.

## Subtle motion refinement

- Motion uses the shared palette, one gentle ease and short distances. Section reveals remain one-shot; project previews loop while visible with a pause control.
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

- Eight short, looping project previews accompany the reporting, reconciliation, deal history, dbt modeling, royalty, invoice, finance chatbot, and Spotify projects. A ninth animation traces the chatbot architecture inside its expanded case study. They use the existing palette and typography, with local SVG artwork.
- The dbt implementation is a technical subsection inside the sales-history case. Both legacy case anchors remain reachable and open their ancestor disclosures. A quiet Salesforce → dbt / Athena source strip sits above fictional D-201 history: each stage becomes current, then remains available with a closed validity period when the next version appears. The complete frame retains three versions and one current row at the fixed snapshot date. Temporary current labels are decorative; the accessible markup, reduced-motion and print views describe the complete history. No production schema, code, employer data or new business metric is implied.
- Reconciliation pairs a prominent net difference with two source totals on a shared scale and one specific exception. Deal history pairs elapsed days with three dated stages and a proportional duration bar. Both use the expanded examples' fictional figures and label their sample scope. Analyst previews share a 24rem baseline height and 1rem (16px at default text size) content gaps; stage tiles stack when their container is 26rem or narrower. Their animation uses the same visibility and Pause controls as the other previews.
- Reporting labels source data and the Power BI model, then reveals a prepared monthly report ready to download. This is an illustrative status, not a download control; the actual manual-preparation result stays stationary beside the preview. Invoice steps advance from CSV/Excel through Python to PDF. The chatbot shows a clearly labeled fictional Q3 question, thinking indicator, answer, and source.
- Report artwork assembles a miniature dashboard, royalty records arrive as layered author cards, and the invoice's lower paper panel unfolds into place. These are schematic illustrations, not additional business data. Hairlines and existing theme tokens supply depth without shadows or new colors. Supporting desktop preview panels share a minimum height.
- The royalty preview moves from watch-time data through R calculation, the documented accounting check, and author statements, then shows the existing 300+ authors result. Four steps share the same visual size, with more compact paper artwork in the mobile list. The chatbot architecture walkthrough traces report extraction, orchestration, retrieval, response, and the user interface with a small signal and brief outlines; its text stays visible throughout.
- Spotify presents a readable crop of the authentic artist-ranking panel with restrained motion. A clearly labelled link opens the full screenshot in a native dialog, with optional original-size detail, keyboard scrolling, Escape/Close, and focus returned to its opener. Without JavaScript the link opens the image directly. This is an image preview, not a recording of filtering or live chart updates; the public Tableau dashboard remains linked. Background stories settle while the dialog is open and resume according to the visitor's existing pause choices.
- Each approximately 3–4 second story repeats while visible. Simple stories hold the complete frame for two seconds; reconciliation and dbt hold for five, and deal history and the chatbot for four. The optional `data-preview-hold` value is bounded to 1–8 seconds, with invalid values falling back to two. A keyboard-accessible Pause/Resume control lets visitors stop the animation on its readable final frame. The visitor's pause choice survives scrolling, tab changes, language changes, preference changes, and case-study closure.
- Offscreen previews, closed or closing case studies, background tabs, printing, and reduced motion settle to the complete still frame and cancel their pending cycle. Eligible visible previews resume automatically. No JavaScript or animation API also yields that still frame with controls hidden.
- Text and playback labels support English and German. Invoice steps stack when enlarged text leaves insufficient width. Preview animation uses only transforms and opacity, with one cancellable timer between cycles; no GIF downloads, external players, or per-frame JavaScript loops are added.

## Consistency checks

- Reporting, revenue reconciliation and Salesforce deal history lead the project
  section. Real contributions and outcomes are kept
  separate from explicitly fictional interactive samples. Reconciliation uses
  five records and a stated matching rule; stage history uses a fixed snapshot
  date and elapsed calendar days. Closed and due-today deals are not overdue.
- Reporting details include a revenue budget-versus-actual example with a shared
  chart scale and a stated variance formula. CARIAD details compare regional
  incentives and vehicle sales with separate units and no causal claim.
- Examples retain complete static content without JavaScript and reveal controls
  only after initialization. English/German changes preserve current selections.
  Narrow tables become labeled record lists; native selects use short options
  with full descriptions below to remain legible at enlarged text sizes.
- Skills include dbt, Power Query, Excel and pandas. About lists language levels;
  Lecturio details include weekly AI training. The CV button downloads a general
  two-page English PDF from `assets/documents/Rushikesh_Pawar_CV.pdf`. Its report-preparation
  metric retains the site's narrow scope; unconfirmed monthly-close figures from
  the application-specific source CV are not merged into that claim.

- English and German dates, source amounts, informative image descriptions, and accessible navigation labels switch together. German visitor-facing forms use informal address consistently.
- Repeated savings use `₹200k` (now only in the S.M. Auto entry); the industries fact lists sectors, and product names use their established spelling (`n8n`).
- All four experience entries share the same header and content alignment. Native project and role disclosures both open for direct links and use the same motion and keyboard behavior.
- Tools with documented project examples use native links and permanently visible project captions. Other tools remain static labels. Their icons reveal color on pointer hover without shifting the layout; reduced motion makes the change immediate. The demo close button shares the 44px target size used by the other controls.
- Long headings and labels wrap within their columns. Project, impact, and skill layouts adapt to larger text; outcomes wrap naturally with their measurement context. Test the actual content bounds because the outer sheet clips horizontal overflow.
- Cookie choices wrap and the banner scrolls within short viewports. Reopening settings moves focus to the choices and returns it to the opener on dismissal.
- Mobile document scroll padding reserves space for the fixed navigation. Textarea focus reveals its full box; narrow mastheads wrap whole groups at enlarged text sizes instead of squeezing the name into a column.
- Form and clipboard feedback stay in the selected language throughout pending, success, and reset states. Successful submissions clear only the submitted draft; edits made while waiting remain intact.
- Legal pages share guarded theme initialization and browser-chrome tinting. Their headings, URLs, and 44px Back links remain usable at 320px and with enlarged text.
- Company and school marks use one monochrome source each, explicit dimensions, and consistent theme filters. They never change color during scrolling or hover. The S.M. placeholder is a theme-aware monogram, not an asserted official company logo.
- Tool icons use equal 52px slots above their labels, with optically balanced 36–44px artwork; diagram and copy icons use a 16px minimum. Skill marks are embedded as a local SVG sprite, with sources documented in `assets/skill-icons/README.md`. SVG artwork stays inside its viewBox, and decorative icons are hidden from assistive technology while their controls retain meaningful labels.

## Purposeful logo motion

- All skill marks share a restrained 160ms color reveal and 180ms backing fade on hover or keyboard focus. Optically balanced marks, names and project captions stay centered and stationary. Power BI and dark-theme low-contrast marks use a tight 48px neutral backing for readability. There are no extra charts or nodes beside the logos, enlarged circles, shadows or looping logo effects.
- The employer strip links KPMG, CARIAD and Lecturio to their experience headings. Always-visible captions describe the progression from audit analytics through sales reporting to finance automation. The marks retain their monochrome treatment; a short accent rule responds on hover or focus. Phones use compact responsive tracks with each icon above its employer name and caption; tracks wrap as available space requires.
- Touch navigation remains one tap and keyboard activation follows the native link. The skill color reveal works without JavaScript; reduced motion makes the change immediate. Employer links also work without JavaScript; enhancement places keyboard focus at the selected role.
- Interaction guidance: [W3C reduced-motion technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39), [W3C keyboard criterion](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) and [web.dev animation performance](https://web.dev/articles/animations-guide). These guide the implementation; they are not a claim of comprehensive accessibility conformance.

## Review fixes — September 2026

- Hero metrics are 99%, 300+ and 4+ years in analytics, using the CV's "finance, automotive and audit" phrasing. `₹200k` stays in the S.M. Auto entry: converted, it undersold the headline row.
- The Lecturio location describes the person ("based in Hamburg" / "wohnhaft in Hamburg"); the company itself is not placed in Hamburg.
- Navigation consistently uses Experience/Skills in English and Erfahrung/Tools in German across desktop and phone layouts; destinations are unchanged.
- German headings keep `hyphens: manual`: long compounds get a soft hyphen (`Monats­berichte`, `zusammen­arbeiten`) or shorter phrasing (`Automatisierte Rechnungspipeline`). A test checks that no heading word splits without a hyphen at 320–768px.
- A saved German preference sets `.lang-pending` before first paint, hiding the English markup until main.js translates it. `lang` stays `en` until then, so it always describes the visible text; the 3s failsafe still reveals the page if main.js fails.
- Controls that wait (demo questions, copy, contact submit) use `aria-disabled` rather than `disabled`, so keyboard focus and Escape stay in place. The copy result is announced through a status region.
- Analytics events are sent only with consent. Withdrawing consent disables the loaded tag and removes its `_ga` cookies. The cookie banner links the privacy policy.
