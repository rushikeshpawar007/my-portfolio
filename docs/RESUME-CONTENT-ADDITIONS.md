# Resume-backed portfolio additions

Follow-up to the initial CV-only review on 29 September 2026. The owner authorized reading the sibling `16_resume_enhanced` folder and using supported career information in the portfolio. This resolves several implementation gaps recorded in `CONTENT-EVIDENCE-REVIEW.md`.

## Source selection

Used `../16_resume_enhanced/data/achievements.json` as the primary record, especially entries marked verified with user-confirmed provenance. Cross-checked `configs/_default.json` and the master `Rushikesh_Pawar_Skill.md`. The bank distinguishes factual scope, metric meaning and unanswered questions; repeated application wording does not provide independent verification.

Interview notes were checked for context, but contained retired claims and hypothetical implementation suggestions. Those were excluded. Private application records, contact details and unrelated personal information were not copied to the website. The source folder was read only.

## Implemented content

| Area | Addition | Evidence in the sibling repository |
| --- | --- | --- |
| Monthly reporting | Explained the wider shared Power BI finance model, DAX/Power Query and Python/n8n data pulls. Kept the existing 10 hours → 5 minutes measurement scoped to manual preparation of one report. | `data/achievements.json`, `lecturio.month_end_close`, lines 394–491 |
| Reconciliation | Replaced generic contribution wording with the mapping from accounting memo references to Salesforce records and the recurring bookings-to-receivables control. | `data/achievements.json`, `lecturio.revenue_gap`, lines 561–637 |
| Sales history / dbt | Added AppFlow → S3 → Athena, daily dbt runs, Type 2 snapshots and validity periods. Explained historical conversion rates as inputs to a stage-weighted operating-income forecast. | `data/achievements.json`, `lecturio.dbt_athena`, lines 863–936; `Rushikesh_Pawar_Skill.md`, line 355 |
| Sales delivery | Added monthly overdue-opportunity reviews and the relationship between reporting and business follow-up. | `data/achievements.json`, `lecturio.pipeline_hygiene_review`, lines 1477–1533 |
| Quarterly royalties | Added SQL queries inside R, watch-time inputs, R calculations, accounting reconciliation and automated statement delivery. Explained the move from a slow all-SQL calculation to R scripts that load partial datasets. | `data/achievements.json`, `lecturio.royalty_distribution`, lines 697–791 |
| Royalty scope | Added approximately €1M distributed per year, with quarterly payouts to 300+ authors. This is payout volume, not savings or revenue generated. No timing or accuracy improvements were invented. | Same royalty entry, including `metric_semantics` |
| About / Experience | Made recurring business reviews more concrete; added monthly operating-income-versus-budget analysis for 10 representatives and historical performance input to leaders' annual quota and hiring decisions. Kept decision ownership with the sales leaders. | `data/achievements.json`, `lecturio.sales_rep_performance`, `lecturio.quota_setting_analysis`, lines 1397–1620 |
| Skills | Added R with a project link and source-backed tool context. Retained the existing 52px icon container, brand hover behavior and responsive grid. | Royalty entry; logo provenance in `assets/skill-icons/README.md` |

All new content is present in English and German. The seven full-width project sections and their visible primary animations are preserved. The royalty animation now labels its input as watch-time data and its calculation as R. The optional current-pipeline demonstration remains distinct from historical stage analysis and forecasting.

## Remaining limits

- Reconciliation mapping is documented, but exact key precedence, cut-offs and tolerances are not. Type 2 snapshotting is documented, but project-specific change-detection configuration, current-record predicates and concrete dbt tests remain unverified.
- Royalty accounting reconciliation and statement delivery are documented; approval ownership, exception rules, runtime improvements and error-rate improvements remain open.
- The bank flags the chatbot's delivery status, audience and usage for confirmation even though the existing website calls it production. That existing claim was not strengthened. Production citation/refusal behavior and evaluation remain unverified. Invoice idempotency and failure handling are also undocumented.
- The bank records promotion to Senior Business Analyst in September 2025, while the CV groups the entire September 2023–present employment under the current title. No title/date split was silently introduced.
- Current employment, availability, language levels, the response-time promise, precise award category/rank and concrete BigQuery/Airflow examples still need owner confirmation if they are to be changed or expanded.
- The broader monthly-close figures in the bank were not added to the report-preparation outcome. They describe a different measurement scope.

## Verification

- CSS build, ESLint and whitespace checks passed. Site stylesheet: 127,038 bytes; no new runtime dependency.
- All 80 focused Chromium checks passed, covering translated content, project hierarchy, icon geometry/hover, skills links, responsive layout, keyboard/fallback behavior, contrast and doubled-text reflow.
- Rendered the updated projects, About, experience, skills and expanded dbt content at 1440px, 768px and 390px, including German and dark-theme views. No horizontal overflow or page errors were observed. Case disclosure keyboard focus remained visible after closing.
- Verified source accuracy separately against the bank and master profile. No source-folder files or CV PDFs were edited; no messages were submitted and nothing was committed, pushed or deployed.
