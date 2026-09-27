---
name: Wren Automation
description: Pitch pages set like a partner's letter. White paper, black ink, one clean sans, small rust marks.
colors:
  paper: "#FFFFFF"
  paper-2: "#F4F4F2"
  ink: "#0E0E0E"
  ink-2: "#56564F"
  ink-3: "#9C9C96"
  rule: "rgba(14,14,14,.13)"
  line: "rgba(14,14,14,.38)"
  rust: "#C24E1C"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 1.2rem + 4.8vw, 5.9rem)"
    fontWeight: 360
    lineHeight: 1.02
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 1.4rem + 2.4vw, 3.6rem)"
    fontWeight: 380
    lineHeight: 1.02
    letterSpacing: "-0.022em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(21px, 1.2rem + .4vw, 26px)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(18px, .95rem + .5vw, 23px)"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    letterSpacing: "0.09em"
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.9rem, 1.8rem + 3.2vw, 4.9rem)"
    fontWeight: 320
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "'lnum', 'tnum'"
rounded:
  none: "0"
spacing:
  gutter: "clamp(16px, 4vw, 48px)"
  column-gap: "clamp(16px, 2vw, 24px)"
  section: "clamp(72px, 10vw, 148px)"
  bar: "64px"
  max: "1320px"
components:
  button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "1.15em 1.6em"
  button-hover:
    backgroundColor: "{colors.rust}"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 0"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

# Design System: Wren Automation

## Overview

**Creative North Star: "The Partner's Letter"**

The pitch pages (/ and /recruiting) read like a letter from a partner at a serious firm. A strict 12-column grid, hairline rules, plain white paper, black ink. One clean sans, Geist, does everything. No italics. Sections join on 1px ink rules into one continuous sheet.

White screen, black text, everywhere. No dark blocks: the form panel is set off by a single black rule, and the closing screen by another. Rust appears only as small marks. The page is light only.

It rejects the SaaS landing page: no floating pill nav, no glow, no dashboard mock, no cards, no eyebrows above headings.

**Key Characteristics:**
- Geist throughout, medium-weight headings with tight tracking. No italics.
- Square corners everywhere.
- The form sits in the first screen, set off by one black rule.
- One authored motion: contacts and the steps rule fill rust as you scroll.
- Portraits in greyscale.

Scope: this records `src/styles/pitch.css`. The privacy and 404 pages still use `global.css`, the previous system.

## Colors

Black on white, with small rust marks.

### Primary
- **Rust** (rust): marks only. Woken contacts in the dots field, the steps rule and nodes, the selected-answer dot, slot dots, small tags, error text, focus rings, button hover. Never a fill for a block or a button at rest.

### Neutral
- **Paper** (paper): the page and the form panel. Pure white.
- **Second Stock** (paper-2): row hover. Never a card.
- **Ink** (ink): text, buttons, section rules, the checked answer row.
- **Grey** (ink-2): secondary text. 7.4:1 on white.
- **Mark Grey** (ink-3): dormant dots and scrollbar only.
- **Hairline** (rule): rules inside a section.
- **Field Line** (line): field underlines; ink on focus.

### Named Rules
**The Small Mark Rule.** Rust never fills anything bigger than a dot, a line or a tag. If it covers an area, it is wrong.
**The White Page Rule.** No dark sections. Separation comes from black rules, never from a black block.

## Typography

**Font:** Geist, one family for everything, with the system sans as fallback.

**Character:** Clean and plain. Hierarchy comes from size and weight, not style.

### Hierarchy
- **Display** (500, clamp 2.5–5.4rem, 1.04, −0.035em): the hero headline only.
- **Headline** (500, clamp 2–3.4rem, 1.04, −0.035em): section heads and the closing screen.
- **Title** (500, 20–24px, 1.2): items, steps, terms, form questions, FAQ questions.
- **Lede** (400, 18–23px, 1.45): the hero paragraph, max 31em. Its bold opener is ink, weight 500.
- **Body** (400, 17px, 1.6): text, max about 36em.
- **Label** (600, 11.5–13.5px, +0.09em, uppercase): table keys, step timing, tags, buttons. Never above a heading.
- **Figure** (500, −0.04em, tabular): proof figures and calculator results.

### Named Rules
**The Plain Punch Rule.** A heading's `*punch*` renders plain: same ink, same style. No italic, no grey, no color.
**The Tabular Rule.** Every number that changes or lines up uses lining tabular figures.

## Layout

A 12-column grid, max 1320px, gutter 16–48px. Sections: text head in columns 1–5, body in 7–12 from 900px, heads sticky where the body is long. Section padding 72–148px, joined by a 1px ink rule.

Hero from 1024px: copy in columns 1–7, the form panel in 8–12 behind a full-height black rule. Below 1024px it stacks: headline, lede, then the panel under a full-width black rule. Under 720px the bar, headline, lede and panel tighten so question 1 and its first answer show in the first iPhone 13 screen. The float button appears on phones once the hero leaves view.

## Elevation & Depth

Flat. Depth comes from rules alone. The only shadow is under the phone float button.

### Named Rules
**The Flat Sheet Rule.** No shadows on anything that sits in the page.

## Shapes

Square corners throughout (0). Circles only for radio buttons, dots, step nodes, slider thumbs and slot marks. Boxes come from rules, not four-sided borders.

## Components

### Buttons
- **Shape:** square (0). Small uppercase label, arrow after it.
- Ink, white text. Hover turns rust. One style everywhere.

### Application panel
- **Style:** white, black text, set off by a 1px black rule (left on desktop, top on phone).
- **Choices:** full-width rows split by rules. A checked row turns ink with white text and a rust dot.
- **Progress:** "Question 1 of 5" label plus thin segments that fill ink.
- **Fields:** underline only, ink on focus. Invalid turns the line rust with a rust note.
- **After sending:** the header and form hide. A fit with a calendar takes the whole first screen.

### Navigation
- Sticky white bar, 64px (56px on phones), ink rule below. Bird mark and serif name left, text links, ink button right. Links hide under 820px.

### Dots field (signature)
- Grey outlined dots, the dormant past clients. As you scroll, some fill rust and grow. Reduced motion shows them filled.

### Steps timeline
- A hairline rail that fills rust as you scroll. Round nodes turn rust as the fill passes. Step timing sits beside the step name as a label.

## Do's and Don'ts

### Do:
- **Do** set everything in Geist; headings 500 with tight tracking.
- **Don't** use italics or a serif.
- **Do** keep rust to dots, lines and tags.
- **Do** separate with 1px rules, not boxes.
- **Do** keep question 1 in the first phone screen.

### Don't:
- **Don't** add eyebrows or kickers above headings.
- **Don't** use cards, rounded corners, glow, gradients or glass.
- **Don't** fill a block or a resting button with rust.
- **Don't** add a dark theme or a dark section.
