# Rendering performance — 24 September 2026

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
opacity only, repeating while visible with a 1.2-second still interval. An
IntersectionObserver controls eligibility; each preview has at most one timer
between cycles. Animations and timers are cancelled when offscreen, in a hidden
tab, during printing, or with reduced motion. A Pause/Resume control preserves
the visitor's choice across visibility and preference changes. The Spotify preview
reuses the existing approximately 100 KB WebP after decoding; no new media
download or animation library is required. `tests/portfolio-previews.spec.js`
covers looping, pause/resume, cancellation, timing/property limits, delayed image decoding,
and static fallbacks. These checks preserve the rendering approach; they do
not certify 120 FPS on other hardware.

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
