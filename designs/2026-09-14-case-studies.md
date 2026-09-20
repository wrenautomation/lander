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

## Revised the same day (William)

Business facts only. Azure, AI Search, accuracy percentages, Selenium,
SQL Server, Folium all out; they were résumé lines for software hiring,
not for an RIA. 6 to 7 hrs a week (heaviest users) confirmed real and
now leads. Both say "still in use today". Paper lookups and the file
consolidation folded into one story; no time claim on the files.
"Government of Canada" stays; "a federal department" in the story.

## Where to attack

1. The email's UAlberta line still mixes the two jobs ("200+ hours of
   lookups across 7,000+ records of fuel cell data"). The page now
   says lookups on papers plus files in one place. Align the template.
2. The offer is document and workflow automation; the proof is a Q&A
   tool and a lookup pipeline. The bridge ("same shape") is honest but
   a third, closer build would do more than any copy.
3. "6 to 7 hrs a week back for the people who used to do the looking
   up": the email says "each". If asked on a call, the answer should
   be the same sentence as the page.
