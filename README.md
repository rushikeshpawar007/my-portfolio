# Rushikesh Pawar — Portfolio

A static data analyst portfolio with English and German content, light and dark themes, project case studies, and interactive demonstrations using fictional sample data. Built with HTML, CSS, and vanilla JavaScript; GitHub Pages serves the repository root.

## Local setup

Use Node.js 24 LTS (recommended). The supported engine range is `^22.13.0 || >=24.0.0`.

```sh
npm ci
npx playwright install chromium
npm run build:css
node tests/server.js
```

Open [the local portfolio](http://127.0.0.1:4173). Stop the server with `Ctrl+C`.

## Checks

```sh
npm run lint
npm run typecheck
npm test
```

Playwright starts the local server automatically when needed. Type checking validates JavaScript through JSDoc without generating application files.

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
| `scripts/` | Build and maintenance scripts |
| `tests/` | Browser tests and local HTTP server |
| `types/` | Shared type declarations |
| `commands/`, `skills/`, `hooks/` | Local assistant plugin instructions and tooling |
| `.github/` | Continuous integration configuration |

Other hidden tooling directories contain editor, assistant, or local verification files.
Current skill icons and their licenses live in `assets/skill-icons/`; older raster tool images are retained in `assets/images/tools/`. The reorganization preserves the original media files.

## Editing and publishing

Edit `src/input.css` or the source stylesheets in `styles/`, then run `npm run build:css`. The build compiles Tailwind and minifies the ordered source styles into the portfolio and legal-page bundles. Do not edit these generated files directly:

- `styles/tailwind.css`
- `styles/site.min.css`
- `styles/legal.min.css`

Commit all three generated files with source changes. CI rebuilds the styles and checks that the committed output is current.

Keep `index.html`, `impressum.html`, and `privacy.html` at the repository root: their locations preserve the site's GitHub Pages routes. Asset paths must work relative to the site, including when hosted under a repository subpath.

Inline scripts are protected by CSP hashes. When changing an inline script, update its page's matching hash; see [repository guidance](CLAUDE.md).

## Documentation

- [Design](docs/DESIGN.md)
- [Performance review and measurements](docs/PERFORMANCE.md)
- [Repository guidance](CLAUDE.md)
