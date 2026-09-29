# Skill icons

Locally bundled vector artwork for the portfolio's skills section. The HTML skill sprite is assembled from these files; no icon CDN or remote request is needed at runtime.

## Brand artwork

All files below come from the [Simple Icons project](https://github.com/simple-icons/simple-icons), pinned to the release shown in the source link. The artwork is distributed under [CC0 1.0 Universal](LICENSE-SIMPLE-ICONS.md). Brand names and logos remain trademarks of their respective owners; use here identifies tools used by the portfolio owner and does not imply endorsement.

The original path geometry and 24-by-24 viewBox are preserved. Only the root fill was set to `currentColor`, an accessible title was updated to match the displayed product name, and a provenance comment was added. Historical release 11.15.0 is retained for artwork no longer present in the newer pinned release.

| File | Display label | Exact upstream source |
| --- | --- | --- |
| `power-bi.svg` | Power BI | [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/blob/11.15.0/icons/powerbi.svg) |
| `tableau.svg` | Tableau | [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/blob/11.15.0/icons/tableau.svg) |
| `qlik-sense.svg` | Qlik Sense | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/qlik.svg) |
| `excel.svg` | Excel | [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/blob/11.15.0/icons/microsoftexcel.svg) |
| `python.svg` | Python | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/python.svg) |
| `bigquery.svg` | BigQuery | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/googlebigquery.svg) |
| `dbt.svg` | dbt | [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/blob/11.15.0/icons/dbt.svg) |
| `pandas.svg` | pandas | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/pandas.svg) |
| `airflow.svg` | Airflow | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/apacheairflow.svg) |
| `n8n.svg` | n8n | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/n8n.svg) |
| `claude-code.svg` | Claude Code | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/claude.svg) |
| `salesforce.svg` | Salesforce | [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/blob/11.15.0/icons/salesforce.svg) |
| `aws.svg` | AWS | [Simple Icons 11.15.0](https://github.com/simple-icons/simple-icons/blob/11.15.0/icons/amazonaws.svg) |
| `github-pages.svg` | GitHub Pages | [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/icons/github.svg) |

Claude Code uses the shared Claude brand mark. GitHub Pages uses the shared GitHub brand mark so it stays recognizable at icon size. Qlik Sense uses the shared Qlik brand mark. These are brand identifiers alongside visible text, rather than claims of a separate product-specific logo.

## Original concept icons

The portfolio-authored `dax.svg`, `sql.svg`, `power-query.svg`, `aws-athena.svg`, `ai-agents.svg`, `rag-pipelines.svg`, `llms.svg`, and `prompt-engineering.svg` are semantic illustrations. They are not official brand logos. In particular, the Athena icon illustrates querying a data store.

## Maintenance

Keep skill graphics theme-colored at rest via `currentColor`, keep their visible tool-name labels, and mark repeated inline SVG uses decorative (`aria-hidden="true"`, `focusable="false"`). Pointer hover and keyboard focus reveal the primary brand color; original concept icons use the portfolio accent. A tight neutral backing supports colors that need extra contrast. If updating artwork, preserve its source and licensing information here.

Hover colors in `styles/skill-icons.css` come from the matching pinned metadata: [16.0.0](https://github.com/simple-icons/simple-icons/blob/16.0.0/data/simple-icons.json) and [11.15.0](https://github.com/simple-icons/simple-icons/blob/11.15.0/_data/simple-icons.json). These are primary brand colors applied to the existing monochrome shapes, rather than full multicolor logo variants.

The corresponding `skill-*` symbols in `index.html` mirror these source files. Update both when replacing artwork. All marks sit in consistent 52px square containers. Their display sizes vary from 36px to 44px to balance dense and sparse shapes without changing the source geometry. The Airflow mark gets a small matching stroke in the display CSS to make its fine outlines legible.
