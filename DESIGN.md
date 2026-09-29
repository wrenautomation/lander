---
name: Wren Automation
description: Pitch pages set like a partner's letter, told in pictures. White paper, black ink, General Sans, faces and diagrams, the brand's rust in a few set places.
colors:
  paper: "#FFFFFF"
  paper-2: "#F4F1EC"
  ink: "#0E0E0E"
  ink-2: "#56564F"
  ink-3: "#9C9C96"
  rule: "rgba(14,14,14,.13)"
  line: "rgba(14,14,14,.38)"
  rust: "#A83B12"
  cream: "#FAF7F2"
  cream-2: "#EFDDD3"
typography:
  display:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.2rem + 4.4vw, 5.4rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.2vw, 3.4rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(20px, 1.15rem + .35vw, 24px)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(18px, .95rem + .5vw, 23px)"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    letterSpacing: "0.09em"
  figure:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.9rem, 1.8rem + 3.2vw, 4.9rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
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
    backgroundColor: "{colors.rust}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "1.15em 1.6em"
  button-hover:
    backgroundColor: "{colors.ink}"
  button-on-rust:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
  seal:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
  back-cover:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.cream}"
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

**Creative North Star: "The Partner's Letter, told in pictures"**

The pitch pages (/ and /recruiting) read like a letter from a partner at a serious firm. A strict 12-column grid, hairline rules, plain white paper, black ink. One sans, General Sans, does everything. No italics. Sections join on 1px ink rules into one continuous sheet.

Most readers only look at headings and pictures, so the pictures carry the story: faces for trust, an example thread in the first screen, a photo per half, and a small diagram under every step. Diagrams are drawn in code and always shown whole. Motion brings things in as you scroll; it never hides anything behind a click.

White screen, black text. The brand's rust, the one on the pfp and banners, fills only a few set places so it reads as a signature, not a theme: the stamp, the buttons and the back cover. Everywhere else it is a small mark. No black blocks. Light only.

It rejects the SaaS landing page: no floating pill nav, no glow, no dashboard mock, no eyebrows above headings, no stock photos.

**Key Characteristics:**
- General Sans throughout, medium-weight headings with tight tracking. No italics.
- Square corners everywhere. Circles only for faces, dots and nodes.
- The form sits in the first screen, set off by one black rule.
- Pictures before paragraphs: faces, image slots, step diagrams.
- Motion as a slideshow: things arrive as they're reached; sections dim as they leave.
- All photos greyscale.
- The pfp in the corner of every screen: a cream bird on a rust square.
- The page ends on a rust back cover, like the banners.

Scope: this records `src/styles/pitch.css`. The privacy and 404 pages still use `global.css`, the previous system.

## Colors

Black on white, with the brand's rust in set places. The rust and cream are sampled from the pfp (`public/brand/wren-pfp.png`).

### Primary
- **Rust** (rust, #A83B12, 6.4:1 on white): fills the stamp, buttons and the back cover (closing screen and footer); text selection. Elsewhere marks only: the steps rule and nodes, the selected-answer dot, the reply rule in the example thread, the hot row and hot bar in a diagram, tags, errors, focus rings.
- **Cream** (cream, #FAF7F2): the pfp's bird. Text, marks and buttons on rust only (5.9:1).
- **Cream Grey** (cream-2): secondary text on rust (4.8:1).

### Neutral
- **Paper** (paper): the page and the form panel. Pure white.
- **Second Stock** (paper-2): image tiles, call tiles, face backgrounds, row hover. Slightly warm, toward the cream.
- **Ink** (ink): text, button hover, section rules, diagram lines and bars, the checked answer row, the file chip.
- **Grey** (ink-2): secondary text. 7.4:1 on white.
- **Mark Grey** (ink-3): chart axis and scrollbar only.
- **Hairline** (rule): rules inside a section.
- **Field Line** (line): field underlines; ink on focus.

### Named Rules
**The Set Places Rule.** Rust fills exactly three things: the stamp, buttons and the back cover. Anything else rust is a dot, a line, a thin bar or a tag. A new rust area needs a reason as strong as those.
**The White Page Rule.** No black blocks. Separation comes from black rules. The only colored blocks are the seal and the back cover.

## Typography

**Font:** General Sans (Fontshare, 400/500/600), one family for everything, with the system sans as fallback.

**Character:** Clean with a little warmth. Hierarchy comes from size and weight, not style.

### Hierarchy
- **Display** (500, clamp 2.5–5.4rem, 1.04, −0.035em): the hero headline only. Rises in word by word.
- **Headline** (500, clamp 2–3.4rem, 1.04, −0.035em): section heads and the closing screen. Rise in word by word.
- **Title** (500, 20–24px, 1.2): items, steps, terms, form questions, FAQ questions.
- **Lede** (400, 18–23px, 1.45): the hero paragraph, max 31em. Its bold opener is ink, weight 500.
- **Body** (400, 17px, 1.6): text, max about 36em.
- **Small** (400–500, 12.5–15px): the example thread, diagram text, captions.
- **Label** (600, 11.5–13.5px, +0.09em, uppercase): step timing, tags, buttons, the thread's label. Never above a heading.
- **Figure** (500, −0.04em, tabular): proof figures (count up).

### Named Rules
**The Plain Punch Rule.** A heading's `*punch*` renders plain: same ink, same style. No italic, no grey, no color.
**The Tabular Rule.** Every number that changes or lines up uses lining tabular figures.

## Layout

A 12-column grid, max 1320px, gutter 16–48px. Sections: text head in columns 1–5, body in 7–12 from 900px, heads sticky where the body is long. Section padding 72–148px, joined by a 1px ink rule.

Hero from 1024px: copy in columns 1–7 with the example thread under it, the form panel in 8–12 behind a full-height black rule. Below 1024px it stacks: headline, lede, the panel under a full-width black rule, then the thread under another. Under 720px the bar, headline, lede and panel tighten so question 1 and its first answer show in the first iPhone 13 screen. The float button appears on phones once the hero leaves view.

## Imagery

Pictures carry the page. Three kinds, all greyscale:

- **Real photo:** William's headshot (hero byline, about, closing screen, the call diagram).
- **The mark:** the bird, drawn with a CSS mask (`public/brand/wren-mark-512.png`) so it takes the text color: cream in the stamp, seal and sign-off.
- **Image slots:** each has a `file` and the `prompt` that makes it, in the pitch yaml. The picture lives at `src/assets/img/<file>` and Astro resizes it. Until it exists the slot draws a hatched paper-2 tile with a faint bird mark (a face: initials). `?prompts` on the URL prints each prompt on its tile; `npm run images` lists what's missing. Pictures are generated (Higgsfield), never stock.
- **Diagrams:** drawn in code (Art.astro), one per step: `call` (two video tiles, a file chip), `rows` (a cleaned list with marks: ok, moved, out, hot), `flow` (nodes on a wire, a rust runner), `bars` (thin bars, one rust). Always whole on the page.

Prompt style: black-and-white editorial photography, natural light, fine grain, no text or logos. Faces: head and shoulders, light grey backdrop, 85mm, square. Scenes: candid, 4:3.

## Motion

GSAP + ScrollTrigger (`src/scripts/pitch.ts`), on only with `html.js` (off for `?static` and reduced motion; everything then renders whole and still).

- **First screen:** the headline rises word by word; lede and byline follow. The form panel never waits.
- **Example thread:** a message, the other side typing, the reply, the tag.
- **Headings:** rise word by word as they enter.
- **Blocks:** rise in, a few at a time, in reading order.
- **Pictures:** wipe open from alternate sides, settle from a zoom, then drift slightly against the scroll.
- **Diagrams:** assemble once on entry (tiles, then the chip; rows with marks popping; the wire draws, then a dot runs; bars grow).
- **Proof figures:** count up.
- **Leaving:** a section dims and lifts as its bottom passes, so the next reads as a new slide.
- **Signature:** the steps rule filling as you read.
- **Ticker:** the ATS list scrolls slowly; pauses on hover.

Easing: expo out for entrances. No pinning, no click-through.

## Elevation & Depth

Flat. Depth comes from rules alone. The only shadow is under the phone float button.

### Named Rules
**The Flat Sheet Rule.** No shadows on anything that sits in the page.

## Shapes

Square corners throughout (0). Circles for faces, radio buttons, dots, step and flow nodes, slider thumbs and slot marks. Boxes come from rules or paper-2 tiles, not four-sided borders.

## Components

### Buttons
- **Shape:** square (0). Small uppercase label, arrow after it.
- Rust, cream text. Hover turns ink. On rust (the back cover) the button is cream with ink text.

### Application panel
- **Style:** white, black text, set off by a 1px black rule (left on desktop, top on phone).
- **Choices:** full-width rows split by rules. A checked row turns ink with white text and a rust dot.
- **Progress:** "Question 1 of 5" label plus thin segments that fill ink.
- **Fields:** underline only, ink on focus. Invalid turns the line rust with a rust note.
- **After sending:** the header and form hide. A fit with a calendar takes the whole first screen.

### Example thread (hero)
- A label, then two messages between hairlines: face, name, role, time, text. The reply is indented behind a rust rule. A rust-dot tag says what it means.

### Navigation
- Sticky white bar, 64px (56px on phones), ink rule below. The stamp (the pfp: a cream bird on a 32px rust square, 28px on phones) and the name left, text links, the rust button right. Links hide under 820px.

### Problem (problem, agitate, solve)
- One column, top down. Three checkmarked questions and the fix line at one size, then the goal and the button, then the pain in depth (the bad things crossed out with rust X marks), then what they don't need and what they do. Marks are rust lines, not fills. Short paragraphs, lots of air.

### Steps timeline
- A hairline rail that fills rust as you scroll. Round nodes turn rust as the fill passes. Step timing beside the step name. A diagram under each step's text.
- The build uses the same timeline, with a week chart in the sticky heading: one bar per stage, overlapping; a bar lights ink as you reach its stage; the ongoing stage runs off the chart in rust.
- Diagrams: call, rows, flow, bars, merge (source boxes wired by curves into one ink block).

### Back cover (closing screen and footer)
- One rust block, cream text, like the pfp and the banners.
- The ask alone, a cream button. No portrait: William's face shows once, large, in About (D15).
- Footer under a faint cream rule: email, fine print, then the sign-off: the bird and "Wren Automation" set as wide as the page.
- The phone float button hides here; the cover has its own.

## Do's and Don'ts

### Do:
- **Do** set everything in General Sans; headings 500 with tight tracking.
- **Do** lead with a picture, a face or a diagram where a paragraph would go.
- **Do** keep diagrams whole; motion only brings them in.
- **Do** keep rust fills to the stamp, buttons, the seal and the back cover; marks elsewhere.
- **Do** keep question 1 in the first phone screen.

### Don't:
- **Don't** use stock photos. Generate them from the slot's prompt.
- **Don't** pin sections or hide content behind clicks.
- **Don't** add eyebrows or kickers above headings.
- **Don't** use italics, a serif, rounded corners, glow, gradients or glass.
- **Don't** add a dark theme, a black section, or a rust section beyond the seal and the back cover.
