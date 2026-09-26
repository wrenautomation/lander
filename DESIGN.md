---
name: Wren Automation
description: Pitch pages set like a partner's letter. Bond paper, warm ink, a book serif, one oxide mark.
colors:
  paper: "#FAF9F6"
  paper-2: "#F1EEE7"
  ink: "#17150F"
  ink-2: "#5B574E"
  ink-3: "#9A958A"
  rule: "rgba(23,21,15,.13)"
  oxide: "#A63D17"
  night: "#17150F"
  on-night: "#F4F1EA"
  on-night-2: "rgba(244,241,234,.7)"
  night-rule: "rgba(244,241,234,.18)"
typography:
  display:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(2.6rem, 1.2rem + 4.8vw, 5.9rem)"
    fontWeight: 360
    lineHeight: 1.02
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(2.1rem, 1.4rem + 2.4vw, 3.6rem)"
    fontWeight: 380
    lineHeight: 1.02
    letterSpacing: "-0.022em"
  title:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(21px, 1.2rem + .4vw, 26px)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(18px, .95rem + .5vw, 23px)"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    letterSpacing: "0.09em"
  figure:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
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
    textColor: "{colors.on-night}"
    rounded: "{rounded.none}"
    padding: "1.15em 1.6em"
  button-hover:
    backgroundColor: "{colors.oxide}"
  button-on-night:
    backgroundColor: "{colors.on-night}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "1.15em 1.6em"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 15px"
  panel:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    rounded: "{rounded.none}"
---

# Design System: Wren Automation

## Overview

**Creative North Star: "The Partner's Letter"**

The pitch pages (/ and /recruiting) read like a letter from a partner at a serious firm. A strict 12-column grid, hairline rules, bond paper. A book serif speaks; a quiet grotesque does the work. Sections join on 1px ink rules into one continuous sheet.

Two blocks of ink carry the calls to act: the form panel in the first screen and the closing screen. Color is almost absent. Oxide appears only as small marks. The page is light only.

It rejects the SaaS landing page: no floating pill nav, no glow, no dashboard mock, no cards, no eyebrows above headings.

**Key Characteristics:**
- Serif headings; the turn of the sentence in italic.
- Square corners everywhere.
- The form lives in an ink panel in the first screen.
- One authored motion: contacts and the steps rule fill oxide as you scroll.
- Portraits in greyscale.

Scope: this records `src/styles/pitch.css`. The privacy and 404 pages still use `global.css`, the previous system.

## Colors

Warm ink on bond paper, with one small mark.

### Primary
- **Oxide** (oxide): marks only. Woken contacts in the dots field, the steps rule and nodes, the selected-answer dot, small tags, focus rings, button hover. Never a fill for a block or a button at rest.

### Neutral
- **Bond** (paper): the page.
- **Second Stock** (paper-2): row hover and the booking state. Never a card.
- **Warm Ink** (ink / night): text, buttons on paper, section rules, and the two ink blocks.
- **Grey** (ink-2): secondary text. 6.9:1 on bond.
- **Mark Grey** (ink-3): dormant dots and scrollbar only.
- **Hairline** (rule): rules inside a section.
- **On Night** (on-night, on-night-2, night-rule): text, secondary text and rules inside the ink blocks.

### Named Rules
**The Small Mark Rule.** Oxide never fills anything bigger than a dot, a line or a tag. If it covers an area, it is wrong.

## Typography

**Display Font:** Newsreader (variable, optical sizes), with Georgia as fallback.
**Body Font:** Hanken Grotesk, with the system sans as fallback.

**Character:** A literary serif at light weights for anything that speaks; a plain grotesque for anything that works.

### Hierarchy
- **Display** (360, clamp 2.6–5.9rem, 1.02): the hero headline only.
- **Headline** (380, clamp 2.1–3.6rem, 1.02): section heads and the closing screen.
- **Title** (400, 21–26px, 1.18): items, steps, terms, form questions, FAQ questions.
- **Lede** (serif 400, 18–23px, 1.45): the hero paragraph, max 31em. Its bold opener is italic ink.
- **Body** (sans 400, 17px, 1.6): text, max about 36em.
- **Label** (sans 600, 11.5–13.5px, +0.09em, uppercase): table keys, step timing, tags, buttons. Never above a heading.
- **Figure** (serif 320, lining tabular): proof figures and calculator results.

### Named Rules
**The Italic Turn Rule.** A heading's `*punch*` is set in italic, same ink. No grey setup, no color.
**The Tabular Rule.** Every number that changes or lines up uses lining tabular figures.

## Layout

A 12-column grid, max 1320px, gutter 16–48px. Sections: text head in columns 1–5, body in 7–12 from 900px, heads sticky where the body is long. Section padding 72–148px, joined by a 1px ink rule.

Hero from 1024px: copy in columns 1–7, the ink panel in 8–12 bleeding to the right edge, full first-screen height. Below 1024px it stacks: headline, lede, then the panel bleeding to both gutters. Under 720px the bar, headline, lede and panel tighten so question 1 and its first answer show in the first iPhone 13 screen. The float button appears on phones once the hero leaves view.

## Elevation & Depth

Flat. Depth comes from stock (bond, second stock, ink) and rules. The only shadow is under the phone float button.

### Named Rules
**The Flat Sheet Rule.** No shadows on anything that sits in the page.

## Shapes

Square corners throughout (0). Circles only for radio buttons, dots, step nodes, slider thumbs and slot marks. Boxes come from rules, not four-sided borders.

## Components

### Buttons
- **Shape:** square (0). Small uppercase label, arrow after it.
- **On paper:** ink, bond text. Hover turns oxide.
- **On ink:** bond, ink text. Hover goes white.

### Application panel
- **Style:** warm ink block, bond text, rules at 18% bond.
- **Choices:** full-width rows split by rules. A checked row turns bond with ink text and an oxide dot.
- **Progress:** "Question 1 of 5" label plus thin segments that fill bond.
- **Fields:** bond, square, no border. Invalid gets a 2px oxide inset.
- **After sending:** the header and form hide. A fit with a calendar turns the panel to second stock and takes the whole first screen.

### Navigation
- Sticky bond bar, 64px (56px on phones), ink rule below. Bird mark and serif name left, text links, ink button right. Links hide under 820px.

### Dots field (signature)
- Grey outlined dots, the dormant past clients. As you scroll, some fill oxide and grow. Reduced motion shows them filled.

### Steps timeline
- A hairline rail that fills oxide as you scroll. Round nodes turn oxide as the fill passes. Step timing sits beside the step name as a label.

## Do's and Don'ts

### Do:
- **Do** set headings in Newsreader with the punch in italic.
- **Do** keep oxide to dots, lines and tags.
- **Do** separate with 1px rules, not boxes.
- **Do** keep question 1 in the first phone screen.

### Don't:
- **Don't** add eyebrows or kickers above headings.
- **Don't** use cards, rounded corners, glow, gradients or glass.
- **Don't** fill a block or a resting button with oxide.
- **Don't** add a dark theme.
