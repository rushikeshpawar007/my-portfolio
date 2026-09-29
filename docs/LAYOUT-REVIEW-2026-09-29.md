# Portfolio layout review — 29 September 2026

Implemented a shared editorial design system across the portfolio, project case
studies, privacy page and imprint. The existing light/dark palette, fonts, logo
treatment and useful animated previews are preserved.

## Main changes

- Added `styles/foundations.css` to both CSS bundles as the shared source for
  palette, type roles, spacing, page gutters and reading widths. The page grid
  uses a 76rem maximum with a 65ch prose measure.
- Gave page identity, section headings, project/role/degree titles, subsections,
  supported outcomes and metadata distinct, reusable roles. All eight project
  titles now share one scale: 28–32px at the default text size. Titles wrap
  naturally, including longer German copy.
- Replaced repeated project chapter headings with compact category navigation
  beneath Selected work. Existing category and case-study bookmarks still work.
- Standardized project order: category, title, supported outcome, description,
  documented tools and disclosure. Omitted tools where no implementation stack
  was documented. Shortened repeated copy without adding claims or metrics.
- Made the reporting result prominent once in its overview, with the explicit
  label “Manual preparation per monthly report.” Removed the competing visual
  number display while retaining the animated workflow.
- Balanced the featured project and dbt split layouts; aligned paired card
  actions. Expanded cases use the full grid width for readable explanations and
  interactive tables. The activated control remains visible after the layout
  changes; actual visitor scroll/navigation input cancels position correction.
- Unified disclosure labels as Show/Hide project details. Preserved native
  keyboard semantics, visible focus, deep links and readable fallbacks without
  JavaScript or the animation API.
- Applied shared alignment and spacing to the hero, navigation, experience,
  skills, about, education, contact and legal pages. Contact copy and fields use
  balanced columns; phone navigation has shorter labels with unchanged targets.
- Retained reduced-motion and print behavior. Added no animation library,
  production dependency, gradient, shadow or decorative badge.

## Verification

Final commands completed successfully:

| Check | Result |
| --- | --- |
| `npm run build:css` | Both bundles generated successfully |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test:server` | 6 tests passed |
| `playwright test --workers=3` | 301 tests passed in 2.8 minutes |
| `git diff --check` | No whitespace errors |

The final browser suite includes 19 new design-system regressions covering
shared title roles, content order, heading structure, category destinations,
aligned actions, disclosure position, keyboard focus, fallback behavior, user
scroll intent, EN/DE responsive bounds and light/dark text contrast. Existing
tests continue to cover navigation, theme/language controls, preview playback,
interactive samples, form behavior, consent, print and resource loading.

Visual inspection covered the hero, projects, open cases, about, experience,
skills, education and contact at 1440px, 768px and 390px, including German phone
copy. Final captures recorded no page overflow or JavaScript errors. All eight
project titles retain the same role; one H1 and a sequential heading structure
are verified. Text contrast was checked against the applicable 3:1/4.5:1
thresholds in both themes.

Both legal pages were checked at 1440px, 768px, 390px and 320px in light and dark,
plus 320px with doubled text. No page overflow or runtime errors were found;
links remained keyboard reachable with visible focus. Sampled legal text
contrast ranged from 5.73:1 to 15.34:1.

A separate 72-scenario interaction probe covered six paired project cards at
desktop, tablet and phone widths, using mouse and keyboard under normal and
reduced motion. Their controls remained visible and usable after opening and
closing. Tablet contact fields were also checked through native Tab navigation
and text entry in both languages, without sending messages.

Final CSS sizes: portfolio 128,805 bytes; legal 4,962 bytes, within the existing
130,000/5,000-byte regression budgets. These are uncompressed file sizes.

Local screenshots and diagnostic results are retained in the ignored
`.portfolio-review/layout-after/`, `.portfolio-review/layout-legal-results/`
and `.portfolio-review/layout-final-results/` directories.

## Limits

- Automated and visual checks used local Chromium. Physical iOS/Safari and
  Firefox were not verified in this pass; this is not a comprehensive
  accessibility certification.
- At 320px with doubled text, long legal title words wrap over several lines.
  The content remains available without horizontal page scrolling.
- Contact success/error behavior is tested with intercepted responses. No live
  message was sent and external service delivery was not revalidated.
- No new frame-rate measurement was made for this layout pass, and no fixed
  FPS is promised. Earlier profiling is documented separately in
  `PERFORMANCE.md`.
- Changes are local and have not been published.

Design decisions follow [W3C heading guidance](https://www.w3.org/WAI/tutorials/page-structure/headings/),
[W3C reflow guidance](https://www.w3.org/WAI/WCAG21/Understanding/reflow), and
[web.dev responsive typography](https://web.dev/learn/design/typography).
See `DESIGN.md` for the reusable system and editing rules.
