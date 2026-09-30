# Rushikesh Pawar — Portfolio

A static data analyst portfolio with English and German content, light and dark themes, project case studies, and interactive demonstrations using fictional sample data. Built with HTML, CSS, and vanilla JavaScript; GitHub Pages serves the repository root.

## Local setup

Use Node.js 24 LTS (recommended and recorded in `.nvmrc`, matching CI). The supported engine range is `^22.13.0 || >=24.0.0`.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:css
npm run preview
```

Open [the local portfolio](http://127.0.0.1:4173). Stop the server with `Ctrl+C`.

## Checks

```sh
npm run lint
npm run typecheck
npm run audit:deps
npm run test:server
npm test
```

Playwright starts the local server automatically when needed. Type checking validates JavaScript through JSDoc without generating application files. Lint warnings fail the check. The dependency audit fails on reported high or critical advisories and requires access to the npm registry.

The full browser suite runs in Chromium. Firefox and WebKit also cover navigation,
language/theme controls, dashboard viewing, analyst examples and legal pages.
Use `npm test -- --project=chromium` to run only the full Chromium suite, or select
`--project=firefox` / `--project=webkit` for the focused engine checks. WebKit
testing does not replace checking Safari on real Apple devices.

CI rejects focused `test.only` cases so an accidentally narrowed test run cannot pass unnoticed. Failed browser tests retain screenshots, and CI also retains traces in `test-results/` for inspection with `npx playwright show-trace <trace.zip>`.

## Folder map

| Location | Contents |
| --- | --- |
| `index.html` | Portfolio markup and English/German translations |
| `impressum.html`, `privacy.html` | Legal pages |
| `src/` | Application JavaScript and Tailwind input |
| `styles/` | Editable CSS and generated browser bundles |
| `assets/images/` | Images grouped into `profile/`, `companies/`, `education/`, `projects/`, and `tools/` |
| `assets/fonts/` | Self-hosted fonts |
| `assets/brand/` | Favicons, share card, and social preview markup |
| `assets/documents/` | Downloadable CV |
| `assets/skill-icons/` | Technology and tool icons |
| `docs/` | Design guidance and performance audit |
| `scripts/` | Build, preview server, and asset export scripts |
| `tests/` | Browser tests and isolated preview-server tests |
| `types/` | Shared type declarations |
| `commands/`, `skills/`, `hooks/` | Local assistant plugin instructions and tooling |
| `.github/` | Continuous integration configuration |

Other hidden tooling directories contain editor, assistant, or local verification files.
The shared preview server in `scripts/serve.cjs` binds only to `127.0.0.1`, serves the public page and asset directories, and disables caching to keep local edits visible. `tests/server.js` remains a compatibility entry point. The server is development tooling; GitHub Pages serves the published site.
Current skill icons and their licenses live in `assets/skill-icons/`; older raster tool images are retained in `assets/images/tools/`. The reorganization preserves the original media files.

Interactive samples live in `src/analysis-comparisons.js`, `src/analyst-workbench.js`,
`src/lineage-explorer.js` and `src/data-cleaning.js`. They use small, explicitly
fictional datasets and retain readable HTML fallbacks. `src/skill-projects.js`
connects documented tools to case studies; native links work without JavaScript.
Skill icons reveal brand colors through brief CSS transitions;
`src/career-trail.js` moves focus from employer links to the selected experience.

## Editing and publishing

Edit `src/input.css` or the source stylesheets in `styles/`, then run `npm run build:css`. The build compiles Tailwind and minifies the ordered source styles into the portfolio and legal-page bundles. Do not edit these generated files directly:

- `styles/tailwind.css`
- `styles/site.min.css`
- `styles/legal.min.css`

Shared palette, typography, spacing and content-width tokens live in
`styles/foundations.css`, which both page bundles include. Change those roles
before adding individual component overrides; see [Design](docs/DESIGN.md).

Commit all three generated files with source changes. CI rebuilds the styles and checks that the committed output is current.

Keep `index.html`, `impressum.html`, and `privacy.html` at the repository root: their locations preserve the site's GitHub Pages routes. Asset paths must work relative to the site, including when hosted under a repository subpath.

Inline scripts are protected by CSP hashes. When changing an inline script, update its page's matching hash; see [repository guidance](CLAUDE.md).

## Documentation

- [Design](docs/DESIGN.md)
- [Content evidence, CV consistency and open questions](docs/CONTENT-EVIDENCE-REVIEW.md)
- [Resume-backed project details and source notes](docs/RESUME-CONTENT-ADDITIONS.md)
- [Layout system and verification — September 2026](docs/LAYOUT-REVIEW-2026-09-29.md)
- [Performance review and measurements](docs/PERFORMANCE.md)
- [Quality and interaction audit — September 2026](docs/AUDIT-2026-09-29.md)
- [Repository guidance](CLAUDE.md)
