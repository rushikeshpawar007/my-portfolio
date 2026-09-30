# Final code review — 30 September 2026

The final review retained the existing static architecture, colours and project
visuals. No browser framework or animation dependency was needed. Earlier
measurements below are historical; the checks here describe the current code.

## Corrections and maintenance

- Handle a skipped View Transition's rejected `ready` promise so changing theme
  still completes without an unhandled browser error.
- Let modified internal-link clicks open another tab without expanding content
  or moving focus on the original page. Normal navigation and legacy deep links
  still reveal their target disclosures.
- Disable transitions entirely with reduced motion. Firefox exposed tiny pending
  transitions on hidden content despite the previous 0.01 ms duration.
- Keep localized deal close dates paired with valid machine-readable `datetime`
  attributes, including the authored fallback without JavaScript.
- Align initial theme/language accessible names with the action each button will
  perform. Remove obsolete layout selectors without changing the visual system.
- Keep the existing 130,000-byte portfolio CSS budget: the current bundle is
  **129,923 bytes**, down from 131,203 before this review. The legal bundle is
  4,965 bytes. These are file sizes, not compressed transfer measurements.
- Fail linting on warnings, add the dependency audit to CI, and share the Node
  24 LTS recommendation through `.nvmrc` and CI's `node-version-file` setting.
- Retain the full Chromium suite and add focused Firefox/WebKit coverage for
  navigation, language/theme controls, dashboard viewing, analyst examples and
  legal pages. Tests now use keyboard activation when asserting retained
  keyboard focus; pointer-click behaviour remains covered separately.

## Dependencies and guidance

`npm outdated` returned no outdated packages and `npm audit` reported **zero
known vulnerabilities** on this review date. The installed direct development
dependencies were already current: Playwright 1.63.0, Tailwind/CLI 4.3.3,
ESLint 10.11.0, `@eslint/js` 10.0.1, globals 17.12.0, Lightning CSS 1.33.0 and
TypeScript 7.0.2. No dependency upgrade was necessary. Immutable CI action
revisions also matched their current release tags.

Official references used in this review:

- [Node release policy](https://nodejs.org/en/about/previous-releases): recommend
  the supported LTS line for development/CI, rather than adopting Current solely
  because its major version is higher.
- [ViewTransition.ready](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/ready):
  skipped transitions can reject `ready` independently of completing the update.
- [Playwright best practices](https://playwright.dev/docs/best-practices): test
  visible behaviour, isolate browser state and use retrying assertions.
- [Native button focus](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#clicking_and_focus):
  Safari does not focus pointer-clicked buttons by default.
- [Tailwind browser requirements](https://tailwindcss.com/docs/upgrade-guide#browser-requirements):
  retain the existing explicit modern-browser build targets.
- [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/): check published
  advisories in addition to version freshness. The CI audit fails on reported
  high or critical findings; a clean audit is not proof of absence of defects.

## Verification scope and limits

The full Chromium run passed all **331 browser tests**, and all **60 focused
cross-engine checks** passed (30 Firefox, 30 WebKit), without retries. The final
reduced-motion change was also checked against the dashboard viewer and animated previews.
CSS generation, ESLint, JavaScript type checking and all **six preview-server
tests** passed. The four shipped HTML documents have one H1 each; the structural
audit found no duplicate IDs, missing local assets, broken label/ARIA references
or nested interactive controls. Inline executable scripts matched their CSP
hashes, and CSS output remained deterministic across LF/CRLF inputs.

Cross-engine checks use Playwright engines on Windows, not physical Apple or
Android devices. WebKit's default keyboard traversal on this platform skips
implicit links; legal-page tests therefore check explicit focus, visible focus
styling and Enter activation there while preserving real Tab traversal in
Chromium and Firefox. Local commands ran on Node 22.16.0; hosted CI on the
configured Node 24 line was not executed from this workspace. No real contact
message was sent. These functional checks do not certify 120 FPS or replace
field performance measurements.

# Code and performance review — 25 September 2026

The measurements below were captured before the subsequent asset-folder
reorganization. See the [folder guide](../README.md#folder-map) for current paths.

Reviewed the shipped HTML, all application JavaScript, authored styles, local
assets, build tools, preview server and CI. The static HTML/CSS/JavaScript
architecture remains appropriate: readable content does not depend on a
framework, and the browser downloads no animation library. Existing colors,
typography, icon hover effects and preview playback are preserved.

## Loading and maintenance

- Compile only the Tailwind utilities used in shipped HTML and application JS.
  Tests, documentation and scratch files no longer add accidental utility CSS.
- Minify the ordered portfolio styles with Lightning CSS and serve one bundle.
  Keep authored styles separate so they remain easy to maintain. Explicit
  browser targets retain the separate animation-timeline declarations needed
  for working native scroll indicators.
- Give the legal pages their own small stylesheet. The extraction was checked
  against 324 elements across eight page/theme/viewport/print configurations,
  with no geometry or typography differences. Subsequent factual copy updates
  intentionally change the corresponding text lengths.
- Preload the active theme's hero portrait at high priority; defer the hidden
  theme's image until needed. Both images retain explicit dimensions. The
  active image is fetched by its preload before lazy-image layout discovery.
- Discover deferred application scripts in the document head while retaining
  execution order and waiting for parsed HTML.
- Build all three generated stylesheets with `npm run build:css`; CI rejects
  stale output. LF and CRLF inputs produce identical minified bundle bytes.

## Runtime and correctness

- Release replaced metric elements from their observer when changing language,
  and stop animation callbacks from updating detached elements.
- Give overlapping theme transitions explicit cleanup ownership and handle
  their rejected completion promises.
- Reuse locale formatters in analytical examples and share already-parsed
  translations with the chatbot.
- Preserve a contact draft when handing it to a mail application; that handoff
  cannot confirm delivery. Confirmed successful HTTP submissions still reset
  the submitted draft.
- Restore the collapsed chatbot's explanation when printing, while preserving
  its hidden, noninteractive state on screen.
- Remove the discontinued EU ODR-platform link and obsolete TMG/RStV labels;
  update the privacy policy's statute name from TTDSG to TDDDG. This is a
  correction of verified outdated references, not a full legal-policy review.

## Tooling

The development dependency audit changed from five findings (four high, one
moderate) to zero. These were development tools, not browser dependencies.
Updated Playwright to 1.63.0, Tailwind/CLI to 4.3.3, ESLint to 10.11.0 and
globals to 17.12.0. Declared `@eslint/js` explicitly and added Lightning CSS
1.33.0 for the build. TypeScript remains 7.0.2. `npm outdated` returned no
outdated packages at the time of review.

CI uses maintained Node 24, immutable GitHub Action revisions, read-only
repository permissions and cancellation of superseded runs. Build scripts now
receive the same lint checks as application code. Hosted CI is not run locally.

## Validation

- Production CSS builds successfully and is byte-identical when rebuilt from
  LF or CRLF source files.
- ESLint, JavaScript type checking and whitespace checks pass; `npm audit`
  reports zero vulnerabilities.
- All 214 Playwright tests pass on Chromium 153, including native/fallback
  scroll indicators, reduced motion, printing, mobile reflow and both languages.
- Compared 6,936 portfolio element states between the authored CSS and final
  minified bundle at 375/1440px, in both themes and languages, with disclosures
  open/closed. Typography, geometry, resolved colors and native scroll timelines
  were identical. Visual checks also confirmed the hero and skill hover glow.
- Added regression coverage for active-theme portrait downloads, CSS budgets,
  observer cleanup, overlapping/failed theme transitions, formatter reuse,
  mail-app draft preservation and collapsed-chatbot printing.

## Current loading measurements

Cold browser contexts on local Windows, fixed Chromium 145.0.7632.6 for both
measurements, consent declined, normal motion. Desktop: 1440 × 1000. Mobile:
375 × 812, 4× CPU slowdown, 150 ms latency, 200,000 bytes/s download. The local
server does not compress responses; these byte counts are response-body bytes,
not expected compressed CDN transfer sizes. Timing samples are diagnostic,
not field measurements or an FPS certification.

| Measure | Before review | After review |
| --- | ---: | ---: |
| Portfolio CSS requests | 9 | 1 |
| Portfolio CSS bytes | 165,320 | 125,622 |
| Legal-page external CSS bytes | 88,543 | 3,509 |
| Hero portraits downloaded initially | 2 | 1 |
| Initial page and resource bytes, light theme | 691,377 | 617,179 |
| Initial page and resource bytes, dark theme | 691,377 | 617,159 |
| Mobile LCP, light theme | 5.70 s | 5.42 s |
| Mobile LCP, dark theme | 5.37 s | 5.29 s |
| Cumulative layout shift, all four configurations | 0 | 0 |

CSS is approximately 24% smaller; the legal CSS is approximately 96% smaller.
The loading comparison saves approximately 74 KB overall. Mobile script
discovery moves from roughly 5.7–6.1 seconds to 0.3 seconds. Throttled mobile
LCP still needs improvement; these results do not imply it meets the 2.5-second
field target. Desktop LCP varied from 1.15–1.88 seconds before to 0.52–0.98
seconds after, but a small local timing sample is not a reliable percentage
speed claim.

A separate five-run experiment disabled pretty/balanced text wrapping at the
same CPU slowdown. Layout time stayed around 2.5–2.7 seconds, so there was no
evidence to justify changing the typography for performance.
A startup trace located most of the remaining mobile CPU cost in the first
full-page layout and text shaping. Avoiding identical translation writes or
skipping the collapsed chatbot's layout did not produce a consistent gain, so
those speculative changes were not adopted.

## Research applied

- [web.dev: optimize LCP](https://web.dev/articles/optimize-lcp): measure resource
  discovery, CSS blocking and rendering delay separately; distinguish lab and
  field results.
- [Tailwind: explicit source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)
  and [Lightning CSS: minification](https://lightningcss.dev/minification.html):
  keep utility generation scoped and preserve the authored cascade.
- [Tailwind browser requirements](https://tailwindcss.com/docs/upgrade-guide#browser-requirements)
  and [Lightning CSS browser targets](https://lightningcss.dev/transpilation.html#browser-targets):
  set explicit Chrome 111, Safari 16.4 and Firefox 128 build baselines. Existing
  feature detection and JavaScript fallbacks still control progressive effects.
- [web.dev: browser image loading](https://web.dev/articles/browser-level-image-lazy-loading)
  and [animation performance](https://web.dev/articles/animations-guide): avoid
  unnecessary hidden-image downloads and retain transform/opacity animation.
- [MDN: internationalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Internationalization),
  [transition completion](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/finished)
  and [W3C: observer lifetime](https://www.w3.org/TR/intersection-observer/#lifetime)
  informed the formatter reuse and lifecycle fixes.
- [Node release support](https://github.com/nodejs/Release#release-schedule),
  [ESLint version support](https://eslint.org/version-support/),
  [Playwright releases](https://playwright.dev/docs/release-notes#version-163)
  and [GitHub Action security](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions)
  informed tooling updates and CI pins.
- Official factual corrections: [EU ODR closure](https://consumer-redress.ec.europa.eu/site-relocation_en),
  [DDG § 5](https://www.gesetze-im-internet.de/ddg/__5.html),
  [current MStV](https://www.die-medienanstalten.de/fileadmin/user_upload/Rechtsgrundlagen/Gesetze_Staatsvertraege/Medienstaatsvertrag_MStV.pdf#page=26)
  and [TDDDG § 25](https://www.gesetze-im-internet.de/ttdsg/__25.html).

# Previous rendering audit — 24 September 2026

The portfolio targets smooth scrolling on high-refresh displays. The light and
dark color palettes are unchanged. Actual 120 FPS needs verification on a 120 Hz
display; a site cannot override a browser or screen's refresh rate.

## Changes

- Reading indicators use browser-managed scroll timelines and transforms. The
  older-browser fallback updates only the indicator elements and caches the
  document's scroll range until its size changes.
- Removed per-scroll changes to an inherited root style variable and progress
  bar width. Header and Back to top writes occur only when their state changes.
- Kept the header's height stable during scrolling.
- Removed the full-screen blended grain texture after an isolated comparison
  showed it was limiting frame cadence. All color values remain the same.
- Metric counters skip duplicate text updates. Project cards contain their
  internal layout work while retaining smooth, accessible native disclosures.

## Measurements

Local Windows, headless Chromium 145.0.7632.6, 1440 × 1000 viewport, consent
declined. Fonts, lazy images, and one-time reveals were warmed first. Each trace
scrolls down and back for six seconds. Values below average two runs; timing
includes profiling overhead and is not a universal hardware benchmark.

| Measure | Before | After progress/texture changes |
| --- | ---: | ---: |
| Median animation-frame interval | 33.3 ms (~30 FPS) | 16.7 ms (~60 FPS) |
| 95th-percentile frame interval | 50.1 ms | 16.7 ms |
| Main-thread task time during the scroll | 4,356 ms | 764 ms |
| Style recalculation time | 3,272 ms | 151 ms |
| Layout passes | 360 | 4 |

That is about 82% less main-thread work and 95% less style-recalculation time,
while delivering almost twice as many frames. The observed browser cadence
tops out at 60 Hz in this environment; this does **not** certify 120 FPS.

A separate six-second test repeatedly opened and closed a supporting case
study. Layout/style containment reduced its 95th-percentile main-thread task
duration from 6.99 ms to 5.57 ms and task time from 1,095 ms to 931 ms. Frame
cadence remained 16.7 ms. An individual task is not an entire rendered frame:
paint and compositing also share the 8.33 ms budget for 120 Hz.

## Regression coverage and device verification

Project previews use finite Web Animations API sequences with transforms and
opacity only, repeating while visible with a two-second still interval. An
IntersectionObserver controls eligibility; each preview has at most one timer
between cycles. Animations and timers are cancelled when offscreen, in a hidden
tab, during printing, or with reduced motion. Architecture playback also requires
its containing case study to be open; a scoped observer watches only that
disclosure's open/closing state. A Pause/Resume control preserves the visitor's
choice across visibility and preference changes. The Spotify preview
reuses the existing approximately 100 KB WebP after decoding; no new media
download or animation library is required. `tests/portfolio-previews.spec.js`
covers looping, pause/resume, cancellation, timing/property limits, delayed image decoding,
and static fallbacks. These checks preserve the rendering approach; they do
not certify 120 FPS on other hardware.

The richer project scenes add only local HTML/CSS and a small decorative SVG.
Author-card entrances and the invoice fold animate transforms and opacity through
the same finite, visibility-controlled sequences. The portrait displays the
complete existing photos; no new image download or pointer tracking is needed.
Reconciliation and deal-history scenes reuse that controller for brief card
entrances and bar reveals. Their figures remain static; bar fills animate with
scale transforms instead of changing layout widths.
The dbt case also reuses the controller: two small signals, a model outline,
retained-row entrances and schematic output bars complete within 4.3 seconds.
It adds no media asset, animation dependency or per-frame JavaScript work.

Analyst examples calculate locally from small fictional datasets. Reconciliation
filters, deal selection, period selection and region selection perform work only
on initialization, interaction or a language change. They add no polling or
continuous animation loop. Optional 180ms response transitions use transforms
and opacity and respect reduced motion. The downloadable CV is not prefetched.

The lineage and data-cleaning exercises also run only on initialization, explicit
interaction or language change. Lineage signals cancel when offscreen, the case
closes, the tab hides, printing starts or reduced motion changes. Cleaning uses
one finite response animation, with cancellation for closure, hidden tabs,
printing and reduced motion. Skill project captions respond to pointer/focus events;
the RP signature uses a small CSS pseudo-element. These additions require no
animation library, GIF download, polling or per-frame JavaScript loop.

Skill marks use brief CSS color and backing-opacity transitions on hover or
keyboard focus. Color interpolation repaints only the small icon during the
160ms transition; there is no geometry animation, shadow animation or idle loop.
Reduced motion disables the transition. Removing the added Power BI/dbt
illustrations also removes their JavaScript controller and observer entirely.
Employer trail rules use brief CSS transform/opacity transitions; native links
remain usable without their optional focus-management script. Both features
reuse the existing palette and assets and add no animation library.

Removing four superseded decoration families saved 1,355 minified CSS bytes.
Frozen before/after comparisons found no visible geometry or computed-style
changes in eight mobile/desktop, English/German, light/dark and print combinations.
The resulting bundle including the new logo interactions remains below the
existing 130,000-byte stylesheet budget.

`tests/portfolio-performance.spec.js` checks native and fallback progress,
reduced motion, initial deep links, content/viewport changes, stable header
dimensions, and absence of repeated root/indicator style writes. Existing
motion tests retain disclosure keyboard, reversal, printing, and fallback checks.

To verify 120 FPS, open the portfolio on a 120 Hz-capable display configured to
120 Hz, use the browser's performance panel/frame statistics, and record normal
scrolling and case-study expansion. Check dropped frames and frame work against
8.33 ms; average FPS alone can hide occasional stalls. Do not leave an FPS loop
running in the production page.

Implementation references: [Chrome's scroll-driven animation guide](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
and [web.dev's animation performance guide](https://web.dev/articles/animations-guide).

## Follow-up quality audit — 29 September 2026

Startup translation now leaves matching text and attributes intact. Language
changes read all metric rectangles before applying metric state, avoiding mixed
layout reads and writes. Theme snapshots suppress colour transitions only on
the components that own them, instead of every element and pseudo-element.

The comparison used local headless Chromium on a Ryzen 7 5700U Windows machine,
fresh contexts, disabled cache, 40 ms emulated latency, 1.25 MiB/s download and
0.625 MiB/s upload. Each CPU4× series contains three samples at 1440×900 and
three at 390×844. Other audit browser work was stopped during measurement.
Initial observations end after page load, font readiness and a further 1.5 seconds;
the long-task measure covers that window and is not Lighthouse TBT.

| Local lab measurement | Desktop before → after | Mobile viewport before → after |
| --- | ---: | ---: |
| Theme click, median Event Timing | 1,424 → 928 ms | 1,352 → 696 ms |
| Language click, median Event Timing | 2,312 → 1,696 ms | 2,008 → 1,136 ms |
| Project disclosure click, median Event Timing | 632 → 592 ms | 544 → 320 ms |
| Initial long-task time above 50 ms per task, median | 2,927 → 1,698 ms | 2,401 → 1,035 ms |
| Initial LCP, median | 2,004 → 2,640 ms | 2,980 → 2,100 ms |

Click latency and initial main-thread work improved in these samples. LCP was
variable and mixed, so this does not establish a general loading-speed gain.
All after-change samples recorded initial CLS of zero. One unthrottled control
per viewport recorded LCP of 832/800 ms and observed click durations of 48–144 ms.
These controls are small samples, not a device-independent guarantee.

The CPU4× results still show substantial theme/language rendering costs. They
remain a limitation on slower devices; physical-device checks and production
visitor metrics are required before promising consistently fast interactions.
Event Timing samples are not field INP, and viewport emulation does not recreate
a physical phone or verify 120 FPS.

Initial loading requests one CSS bundle, eight deferred scripts, seven used
self-hosted font subsets and four WebP images. It makes no external request
with analytics consent denied. Hidden portrait variants, legacy images and
unused page styles are not fetched. No animation framework or telemetry was added.

Detailed observations and scripts are retained in the ignored
`.portfolio-review/audit-performance-*.json` files. See the
[quality audit](AUDIT-2026-09-29.md) for functional coverage and remaining
verification limits. Final narrow-screen form-padding refinements do not affect
the measured 390px/1440px layouts.
