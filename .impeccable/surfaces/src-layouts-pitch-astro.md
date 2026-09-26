---
version: 1
slug: "src-layouts-pitch-astro"
primary_target: "src/layouts/Pitch.astro"
related_targets: ["src/styles/pitch.css","src/components/pitch/Apply.astro"]
---

# Pitch pages (/ and /recruiting)

Mode: Persuade. Light only. Both pitch pages share Pitch.astro and pitch.css.

## Direction contract

THESIS: The pitch set like a firm's annual report: a strict 12-column grid, hairline rules, one family of type, one rust color that only ever marks where to act. It refuses the SaaS landing page: no floating pill nav, no glow, no dashboard mock, no cards, no eyebrows.

OWN-WORLD: White offset stock #FFFFFF, second stock #EDEDEA, ink #111111, grey #5E5E59 for secondary text and #8A8A85 for the headline setup, rules in ink at low alpha. Rust #C24E1C marks where to act and what wakes: the application panel, the closing and phone float buttons, the woken contacts, the steps rule and small offer tags. The nav and form buttons are ink. Archivo only, tight display tracking, tabular figures. Sections join on rules into one continuous sheet.

STORY: An owner of a midsize recruiting firm sees who it's for, the pain (past clients gone quiet, BD hanging on one or two people), what Wren does and the free pilot, then answers question 1 without scrolling. Everything below is evidence for the doubtful.

FIRST VIEWPORT: Desktop: top rule with bird mark and Apply. Cols 1-7: the two-tone headline (grey setup, ink punch) near 5.5rem, the ICP-plus-pain lede, what Wren does, William's portrait and name. Cols 8-12: a full-height solid rust panel: the offer in one line, then question 1 with its choices. Phone: headline, lede, then the rust panel starting inside the first screen with question 1 visible.

FORM: Code-led landing page, assigned direction "The Annual Report" (position 1 of the ordered list), seed key 91fda531. Signature interaction: the dormant list, outlined grey contacts that fill rust as you scroll; the steps rule fills rust the same way.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
