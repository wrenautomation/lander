---
name: Wren Automation
description: Pitch pages set like a firm's annual report. White stock, ink, hairline rules, one rust.
colors:
  paper: "#FFFFFF"
  paper-2: "#EDEDEA"
  ink: "#111111"
  ink-2: "#5E5E59"
  ink-3: "#8A8A85"
  rule: "rgba(17,17,17,.14)"
  rust: "#C24E1C"
  rust-press: "#A54014"
  on-rust-rule: "rgba(255,255,255,.38)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1rem + 4.4vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 86"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 2.4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 86"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(19px, 1.1rem + .3vw, 23px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  lede:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(17px, .9rem + .45vw, 21px)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.45
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 1.6rem + 3vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "'tnum'"
rounded:
  none: "0"
spacing:
  gutter: "clamp(16px, 4vw, 48px)"
  column-gap: "clamp(16px, 2vw, 24px)"
  section: "clamp(64px, 9vw, 136px)"
  bar: "60px"
  max: "1320px"
components:
  button-rust:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "1em 1.35em"
  button-rust-hover:
    backgroundColor: "{colors.rust-press}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "1em 1.35em"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "13px 14px"
  panel:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
---

# Design System: Wren Automation

## Overview

**Creative North Star: "The Annual Report"**

The pitch pages (/ and /recruiting) read like a well-run firm's annual report. A strict 12-column grid, one family of type, hairline rules, white stock. Sections join on 1px ink rules into one continuous sheet. The page sells by being plain, exact and confident, not by decoration.

Rust is the only color. It marks where to act and what wakes up. Everything else is ink on paper. The page is light only.

It rejects the SaaS landing page: no floating pill nav, no glow, no dashboard mock, no cards, no eyebrows above headings.

**Key Characteristics:**
- Two-tone headlines: a grey setup, the punch in ink.
- Square corners everywhere.
- The form lives in a solid rust panel in the first screen.
- One authored motion: things fill rust as you scroll.

Scope: this records `src/styles/pitch.css`. The privacy and 404 pages still use `global.css`, the previous system.

## Colors

Ink on white, with one rust.

### Primary
- **Report Rust** (rust): the application panel, the closing and phone float buttons, contacts that wake in the dots field, the steps rule, small offer tags. Pressed state is rust-press.

### Neutral
- **White Stock** (paper): the page.
- **Second Stock** (paper-2): the closing band and the booking state. Never a card.
- **Ink** (ink): text, nav and form buttons, section rules.
- **Grey** (ink-2): secondary text. 6.6:1 on white.
- **Setup Grey** (ink-3): the headline setup and marks only. 3.5:1, so large text only.
- **Hairline** (rule): rules between rows inside a section.

### Named Rules
**The One Rust Rule.** Rust means act or awake. Never use it for decoration, and never add a second hue.

## Typography

**Display Font:** Archivo (variable width and weight), with the system sans as fallback.
**Body Font:** Archivo.

**Character:** One grotesque at 86% width for headings, full width for text. Compressed, heavy headings against quiet grey text.

### Hierarchy
- **Display** (600, clamp 2.25–5.5rem, 0.98): the hero headline only.
- **Headline** (600, clamp 2–3.5rem, 0.98): section heads.
- **Title** (600, 19–23px, 1.2): items, steps, terms.
- **Lede** (400, 17–21px, 1.5): the hero paragraph, max 32em.
- **Body** (400, 17px, 1.55): text, max about 36em.
- **Label** (600, 15px): fact keys, nav, field labels.
- **Figure** (600, clamp 2.6–4.5rem, tabular): proof figures and calculator results.

### Named Rules
**The Two-Tone Rule.** A heading with emphasis sets its setup in Setup Grey and its `*punch*` in ink. The period goes inside the punch.
**The Tabular Rule.** Every number that changes or lines up uses tabular figures.

## Layout

A 12-column grid, max 1320px, gutter 16–48px. Sections: text head in columns 1–5, body in 7–12 from 900px, heads sticky where the body is long. Section padding 64–136px, joined by a 1px ink rule.

Hero from 1024px: copy in columns 1–7, the rust panel in 8–12 bleeding to the right edge, full first-screen height. Below 1024px it stacks: headline, lede, then the panel bleeding to both gutters, so question 1 shows in the first phone screen. The float button appears on phones once the hero leaves view.

## Elevation & Depth

Flat. Depth comes from stock changes (white, second stock, rust) and rules. The only shadow is under the phone float button, so it reads above text.

### Named Rules
**The Flat Sheet Rule.** No shadows on anything that sits in the page.

## Shapes

Square corners throughout (0). Radio buttons are the one circle. Boxes come from rules, not borders on all four sides.

## Components

### Buttons
- **Shape:** square (0).
- **Rust:** the main call to act on paper. Hover goes to rust-press, press moves down 1px.
- **Ink:** nav, next and submit, and any button on the rust panel.
- **Arrow:** a thin arrow follows the label.

### Application panel
- **Style:** solid rust, white text, rules at 38% white.
- **Choices:** full-width rows split by rules. A checked row turns white with ink text.
- **Progress:** "Question 1 of 5" plus segments that fill white.
- **Fields:** white, square, no border. Invalid gets a 2px ink inset.
- **After sending:** the header and form hide. A fit with a calendar turns the panel to second stock and takes the whole first screen.

### Navigation
- Sticky white bar, 60px, ink rule below. Bird mark left, text links, ink Apply button right. Links hide under 820px.

### Dots field (signature)
- A grid of grey outlined dots, the dormant past clients. As you scroll, some fill rust and grow. Reduced motion shows them filled.

### Steps timeline
- A hairline rail that fills rust as you scroll. Square nodes turn rust as the fill passes.

## Do's and Don'ts

### Do:
- **Do** keep rust to the panel, the main button and things that wake.
- **Do** set headings two-tone, punch in ink.
- **Do** separate with 1px rules, not boxes.
- **Do** keep question 1 in the first phone screen.

### Don't:
- **Don't** add eyebrows or kickers above headings.
- **Don't** use cards, rounded corners, glow, gradients or glass.
- **Don't** use a pill nav or a dashboard mock.
- **Don't** add a dark theme.
