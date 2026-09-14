# Case studies rewritten to the true builds (2026-09-14, Opus)

Source: `personal_portfolio/src/resume/data/entries.ts` (CSC and UAlberta
entries, with the reviewer notes on where each number came from). The
placeholder document-pipeline stories are gone. Both niches' "What this
proves" points and `work_intro` / `why` were rewritten so nothing on
the page claims more than the résumé does.

## What the page now says

Government of Canada, policy chatbot, 2026: 220+ directives as PDFs,
17,000+ officers and staff, Azure OpenAI + AI Search, PDFs re-parsed to
HTML (+15% search accuracy, +10% grounding on 300 prompts), citation
panel and rating log.

University of Alberta, research data, 2025: citation lookups for
7,000+ papers across 2,000+ journal sites, ~2 min each so 200+ hrs,
Selenium → SQL Server → Folium choropleth used in lab talks; 5,000+
fuel cell experiment files into a database, replacing folder search.

`motion.ts`: counters now format thousands (17,000+ instead of 17000+).

## Assumed, not in the portfolio (confirm or cut)

1. "in use before I left" (both). CSC: 17,000+ is the deployment scope,
   but the résumé does not say it launched to them. UAlberta: the map
   was used in talks; the database "deployed" in an earlier bullet.
2. "Built in the agency's own Azure" and "left with the lab".
3. `kind` years: CSC Jan to May 2026, UAlberta Jul to Sep 2025.

## Where to attack

1. The email says "saving about 6 to 7 hours a week each" for the CSC
   chatbot. Nothing in the portfolio supports it. It is the strongest
   number in the email and it is not on the page. Either it has a
   source (then it leads the impact row) or it comes out of the email.
2. The email's UAlberta line mixes the two jobs: "200+ hours of manual
   lookups across 7,000+ records of messy fuel cell data". The 200 hrs
   were author lookups on papers; the fuel cell files were 5,000+ and a
   separate database job. The template in emails_gen should say what
   the page says.
3. Client name. Email and page say "Government of Canada"; the résumé
   says Correctional Service of Canada. Naming the agency is more
   checkable. His call.
4. The offer is document and workflow automation; the proof is a RAG
   chatbot and a scraper. The bridge is honest ("same shape") but a
   reader in an RIA may not feel it. A third, closer build (even the
   emails_gen pipeline itself) would do more than any copy.
5. `why` used to say "still running, handed over with documentation".
   It no longer claims either. If both are true, put them back; they
   were the stronger line.
