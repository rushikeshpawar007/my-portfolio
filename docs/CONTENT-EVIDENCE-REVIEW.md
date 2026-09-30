# Portfolio content evidence review

Reviewed on 29 September 2026. This is a record of the content evidence available for the current portfolio revision, not a verification of employment or qualifications with an issuer. No biographical facts or PDF files were changed by this review.

The later authorized review of `16_resume_enhanced` resolved several implementation gaps below. See [resume-backed additions](RESUME-CONTENT-ADDITIONS.md) for the new royalty, reconciliation, dbt and sales-review evidence and the remaining questions. This document retains the initial CV-only assessment for comparison.

## Sources inspected

- The served download, `assets/documents/Rushikesh_Pawar_CV.pdf`, both pages and embedded link destinations.
- The earlier application CV, `../16_resume_enhanced/applications/311_CEPRES/Rushikesh_Pawar_CV_CEPRES.pdf`, both pages and embedded link destinations.
- Existing portfolio copy and English/German translation keys in `index.html`; demonstration behavior in `src/main.js`, `src/analyst-workbench.js`, `src/analysis-comparisons.js`, `src/lineage-explorer.js`, and `src/data-cleaning.js`.
- The four certificate images already linked by the portfolio. Each opened in the public Google Drive viewer without sign-in. The web extraction tool could not read those links; their rendered certificate images were inspected instead. No external files were modified.

The application CV is an earlier source with different positioning and a different reporting metric. Its wording should not automatically supersede the served CV or the user's later instructions.

## Biographical consistency

| Item | Evidence and assessment |
| --- | --- |
| Actual role title | Both CV experience sections and the portfolio say **Senior Business Analyst** at Lecturio. The earlier CV's introductory “(Senior) BI Specialist” is application positioning, not a replacement job title. Finance analytics, BI, data modelling and automation describe the work performed. |
| Current employment | Both CVs say **Sep 2023–Present** at Lecturio GmbH. “At Lecturio,” the About copy, role dates and structured `worksFor` metadata agree. Whether this is still current needs the owner's confirmation, not an inferred replacement. |
| CARIAD | Both CVs say **Sep 2022–Aug 2023**, Working Student Data Analytics / Data Science, CARIAD SE (Volkswagen Group). The portfolio shortens the role to Working Student Data Analytics. |
| KPMG | Both CVs say **Mar 2022–Aug 2022**, Working Student Data Analytics. The portfolio's KPMG Deutschland display name is a shorter presentation of the CV's KPMG AG Wirtschaftsprüfungsgesellschaft. |
| S.M. Auto Engineering | Both CVs and the portfolio say **Nov 2019–May 2021**, Inventory Controller. Both CVs support **INR 200,000** in spare-parts cost savings. |
| Education | Both CVs and the portfolio agree: MBA&E, HTW Berlin, **Oct 2021–Oct 2023**; Bachelor of Mechanical Engineering, Savitribai Phule Pune University, **Aug 2015–Aug 2019**. No contradictory dates were found. |
| Languages | Both CVs and the portfolio agree: **German B1, English C1, Hindi and Marathi native**. Confirm that the levels are still current; do not upgrade them from inference. |
| Location and availability | Both CVs give Hamburg. The website additionally says open to Berlin and remote, and open to opportunities. These are owner-maintained preferences; the CVs do not establish current availability. |
| Experience duration | The served CV says **4+ years**; the earlier application CV says **4.5 years**. These are compatible at different precision, not proof that all listed tools have been used daily for that duration. The earlier CV explicitly lists daily work as Power BI, DAX, Power Query, Excel and SQL. |
| Contact promise | The existing site says **“Response within 24h” / “Antwort innerhalb von 24h.”** Neither CV establishes a service promise. Leave its factual status for confirmation. |
| CV links | The served PDF's LinkedIn, portfolio and Tableau Public destinations agree with the site's corresponding destinations. The CV is English and the site labels the download accordingly. |

## Certificates: verified names and providers

These are supported by the linked certificate images, not inferred from filenames. Preserve official course names when presenting them in either language.

| Existing label | Supported name and provider | Completion shown | Existing source |
| --- | --- | --- | --- |
| Google Data Analytics | **Google Data Analytics Professional Certificate — Google, via Coursera** | 10 October 2021 | [Certificate image](https://drive.google.com/file/d/1zWBZDnMuiKehHhP_uWX7pVWObOEtuwBC/view) |
| SQL | **Introduction to SQL — DataCamp** | 16 June 2021 | [Statement of accomplishment](https://drive.google.com/file/d/1WKw3hjShdDCC-Sho-uJq_jn-V8kqP3wq/view) |
| Tableau | **Tableau 2020 A–Z: Hands-On Tableau Training for Data Science — Udemy** | 10 February 2021 | [Certificate of completion](https://drive.google.com/file/d/1yTXY2LCsGzr7CBaqN_oQID57LLtw11sP/view) |
| Python | **Exploratory Data Analysis in Python — DataCamp** | 19 June 2021 | [Statement of accomplishment](https://drive.google.com/file/d/12IPlolJ5brzkTGLlm7W3einKu6XDloe0/view) |

The Tableau course certificate credits Kirill Eremenko and the SuperDataScience Team and states nine hours. The SQL, Python and Tableau documents are course completion evidence; they should not be presented as vendor professional certification. Both CVs also list **Master Snowflake & Cloud Data Warehouse from the Ground Up — Udemy**; no additional certificate link was found for it.

## Project evidence and limits

### Month-end reporting

The served CV and existing site support manual preparation of **one monthly report, approximately 10 hours → 5 minutes**. The site further identifies the remaining step as downloading the prepared Power BI report. The served CV documents Power BI with DAX/Power Query, Python and n8n. The earlier CV specifically documents rebuilding the shared finance model and automating data pulls with Python and n8n.

The earlier CV separately claims **monthly close from one week to three days** and **about 70% less manual effort**. Those measure a different scope from preparation of one report. They should not be combined into a single outcome or silently substituted for the website metric. Neither source provides a detailed list of reconciliations, refresh checks, schedules or failure handling for report preparation.

### Revenue reconciliation

Both CVs support a recurring control comparing **Salesforce bookings with accounting records**, surfacing **six-figure differences** for Finance and audit. That does not establish confirmed accounting errors, recovered revenue or losses prevented.

The repository's **fictional sample** joins by record ID, compares exact amounts, treats absence as zero for difference arithmetic, and shows all-five-record totals irrespective of the review filter. The sample contains EUR 30,000 bookings and EUR 27,500 accounting, with a EUR 2,500 net difference. This is sample methodology, not evidence of production matching keys or tolerances. Existing copy recognizes timing and accounting treatment as possible explanations and explicitly scopes the example away from production control logic. Production matching rules, cut-offs, exception ownership and sign-off are not documented here.

### Sales pipeline and dbt history

Both CVs support **dbt history tables on Athena that version Salesforce stage changes**, expose time in stage and conversion patterns, and feed revenue forecasting for the CFO and CEO. Both also document Power BI opportunity tracking and overdue close-date flags. These describe one coherent business story with a technical implementation.

The repository's public history sample calculates elapsed calendar days at **31 March 2026** and flags overdue deals only if still open and their expected close date is earlier than the snapshot. Its current-pipeline example explicitly begins with **one current row per deal**. These two examples illustrate different calculations: historical time in stage versus the aggregate value of current open opportunities.

No production dbt project, snapshot configuration, SQL model or test configuration was found in this repository. Therefore `unique_key`, timestamp/check strategy, validity columns, late-arriving update handling, current-row selection logic and test coverage cannot be stated as production facts. The CV's skills list mentions models, tests and snapshots, but does not prove which mechanism this particular project used.

### Quarterly royalties

The existing portfolio supports **end-to-end quarterly royalty distribution for 300+ content authors**. Its visual identifies a quarterly workflow, calculation and distribution. Neither inspected CV provides further royalty implementation detail. No royalty source program, input schema, formula, approval workflow or exception handling evidence was found here. Do not turn the illustrative flow into an undocumented production implementation description.

### Finance chatbot

Existing portfolio content supports a production architecture of **Power BI report/PDF extraction with an LLM → n8n orchestration → Pinecone embeddings/vector storage → LLM responses → Google Apps Script interface**. This is existing owner-provided case-study content; neither inspected CV independently describes this complete architecture.

`src/main.js` implements a **predefined public demo**, with three preset questions and answers, a link to fictional source data for each answer, and an explicit unavailable forecast response. The source table and `demo_method` explain the arithmetic and explicitly say the example does not evaluate the production model. The public demo neither sends prompts to an LLM nor connects to company systems. Production citation behavior, refusal rules, retrieval evaluation, access controls or model evaluation are not documented in this repository.

### Invoice automation

Existing portfolio content documents **CSV/Excel exports from Power BI → Python parsing → invoice template rendering → generated PDFs → pingen.de API → physical mail**. It credits the owner with developing the Python application and discloses AI-assisted development. No production invoice application is present here. Validation rules, duplicate prevention/idempotency, retry behavior and failure escalation must not be invented.

### Spotify dashboard

Both CVs support **“Runner-up, Onyx Data Challenge — Spotify Data Visualization.”** Existing portfolio content describes custom Tableau tooltips and interactive filters; the stored preview shows sorted artist rankings and track-attribute comparisons. Keep this as visualisation/design evidence. The more specific “for dashboard design and aesthetics” is existing site wording; no separate award citation beyond the linked owner announcement was independently verified in this review. The German “Zweiter Platz” is stronger than a generic English “runner-up”; confirm the precise category/rank before making award wording more specific.

### Skills

The five SQL platforms named in both CVs are **PostgreSQL, MySQL, SQL Server, Athena and BigQuery**. A count does not establish equal depth. BigQuery has CV support but no visible case study; Airflow is an existing portfolio skill without specific evidence in the inspected CVs or project content. Preserve listed skills and ask for examples rather than invent ratings or remove them. “Enterprise integrations & cloud infrastructure” is broader than the visible Salesforce/Athena/GitHub Pages project evidence.

## Focused questions for the owner

1. Are Lecturio **Sep 2023–present**, Hamburg, openness to Berlin/remote opportunities, and German B1 / English C1 still current? Is **“Response within 24h”** a promise you want to keep?
2. Do the **10 hours → 5 minutes report-preparation result** and the earlier CV's **one week → three days monthly-close result / ~70% manual reduction** refer to separate scopes? Which report preparation steps were automated, and which checks remain manual?
3. For reconciliation, what production keys, timing cut-offs/tolerances and exception-review or sign-off process can be disclosed? For dbt history, which change-detection strategy, current-record rule and validation tests did you implement?
4. For royalty automation, what inputs, calculation rules, review/approval stages, distribution steps and exception handling can be described? For invoice automation, what validation, duplicate prevention and failure handling are documented?
5. Does the production chatbot cite sources, handle missing evidence and undergo evaluation in the same way as the public demonstration suggests? Which production behaviors and evaluation evidence may be shared?
6. What was the precise Onyx award category/rank, and can you provide a project example for BigQuery and Airflow?

These questions should stay in the review report rather than appear as unfinished placeholders in the public portfolio. They do not block improvements supported by the existing evidence.

## Implemented revision

- Kept the actual Senior Business Analyst title and added Finance Analytics & Automation as the specialism. Aligned the hero, metadata and primary project CTA without altering employment, education, availability, language levels or the downloadable CV.
- Prioritized monthly report preparation, reconciliation and sales history. Merged the dbt implementation into sales history while preserving both case anchors and the technical demonstration. Following the owner's layout feedback, all seven projects now have separate full-width rows with primary animations outside their detail disclosures.
- Kept the approximately 10 hours → 5 minutes result explicitly scoped to manual preparation of a monthly report. Production reconciliation differences remain separate from fictional sample amounts and are not described as confirmed errors or recovered revenue.
- Moved budget variance, data cleaning and current-pipeline aggregation into optional analyses. The current-pipeline SQL and JavaScript both use an explicit five-stage open-status rule; the sample includes Closed Won and Closed Lost rows that are excluded from the total.
- Separated the public chatbot's predefined fictional answers from the described production architecture. Its sample and source table remain reachable from direct links, with the explanation stacked above the demo on narrow screens.
- Replaced the duplicate About timeline with an approach narrative. Experience retains achievements and Finance AI-adoption evidence. Clarified skill descriptions without proficiency ratings, kept every listed tool, and applied one responsive grid with equal icon containers and neutral category dividers.
- Published the verified names and providers of the four linked courses/certificates. Updated English and German content together, kept project controls and focus states consistent, and retained reduced-motion and no-JavaScript fallbacks.

## Verification and limits

The initial content revision passed `npm run build:css`, `npm run lint`, `npm run typecheck`, all six preview-server tests, and all 307 Chromium browser tests (`npm test`, 2.8 minutes). The subsequent full-width project layout passed the CSS build, lint and 80 focused browser checks covering layout, motion, previews, reflow and contrast. Desktop/mobile checks explicitly require all seven primary previews to be visible with project details closed; royalty playback and pause work in that state. The generated site stylesheet is now 126,975 bytes; the legal stylesheet is unchanged at 4,962 bytes. No runtime JavaScript changed during this layout follow-up.

Rendered inspections covered 1440px desktop, 768px tablet and 390px phone layouts, with additional 320px and doubled-text checks. Reviewed both themes and languages, including skills, expanded technical content, supporting projects, certificate wrapping and the chatbot. No horizontal overflow or browser errors were observed in those inspections.

The CV download returned a valid PDF, and all four existing certificate links were inspected in their rendered viewers. Automated external access could not fully verify LinkedIn or Tableau's destination rendering; their existing URLs were preserved. Internal links, legacy anchors, nested disclosures, keyboard focus, source tables, animation pause/resume and print restoration were checked. Contact tests intercept requests; no real contact message was submitted.

Browser automation uses Chromium. Physical-device testing, Safari/Firefox coverage, a formal accessibility audit and a 120 Hz hardware frame-rate measurement were not performed. No dependencies were added, no biography/PDF replacements were guessed, and nothing was committed, pushed or deployed.
