# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro, static output, GSAP + ScrollTrigger for motion, Cloudflare Pages with one Pages Function for the lead form. Confirmed by William 2026-09-14.

## Users

Owners and principals of small registered investment advisers (RIAs), and soon insurance agencies. Age skews 45 to 65. They received a hyper-personalised cold email from William (it quotes their own Form ADV), and they either clicked "More at <link>" or googled him. They read on a phone, skeptical, deciding in under a minute whether the email was real and whether replying is safe.

## Product Purpose

Wren Automation is William's one-person automation agency. It builds document and workflow automations for small financial firms: the handoffs between people, manual spreadsheets, brittle edits, the same AUM figure typed into five documents. The site exists to make the cold email believable and to make replying feel low-risk. Success: the visitor believes the case studies and replies to the email, or submits the form.

## Positioning

A stranger read your filing and built things like this before. Proof is specific and personal: named work, before and after numbers, a real person. No agency gloss, no team page, no pricing, no calendar link. The first step is a free consultation and an audit, scheduled by replying with times.

## Operating Context

Visitors arrive from the cold-email campaign run by emails_gen (the sibling repo). Email CTA is organic scheduling: "send me some times, I'll book it". The site must not contradict that: no Calendly, no "15 minutes". Niche pages (`/ria`, `/insurance`) match the email's niche; the root is generic. Niche pages never link to each other.

## Capabilities and Constraints

- Sections in order: hero, the pain (family then one example), case studies, how it works, about, the ask, footer.
- Form: email, phone (optional), "what eats your week". Hidden niche and source fields. Posts to a Pages Function; Turnstile; D1 row; email to William.
- All copy lives in content files (markdown/yaml), never in components. William edits prose himself.
- Light default, toggleable dark. System preference honoured on first visit.
- Motion is presentation-grade: builds, counters, pinned case studies with scrub. Never scroll hijack. `prefers-reduced-motion` honoured. Page reads fully with JS off.
- No price, scope, stack claims, guarantees, testimonials that do not exist.
- Undecided: `?f=<firm>` hero personalisation (later pass). Scroll VSL (later).

## Brand Commitments

- Name: Wren Automation. Short, subtle. No surname in the brand.
- Voice: William's cold-email voice. Extremely concise, plain sentences a person would say out loud, lowercase subjects, honest student bio, a jab that lands. No jargon, no filler, no hype verbs.
- The site signs off the way the emails do: thanks for reading this far.

## Evidence on Hand

- Two case studies referenced in the live email templates (`emails_gen/src/emailsgen/niches/sec_ria/templates/`): a document automation for the Government of Canada, and a fuel cell related build. William will supply full details (client, before, built, after numbers, stack, quote). Do not invent numbers; placeholders are labelled.
- No testimonials, logos, or press yet. Do not fabricate.
- No photo of William in the repo yet. Placeholder slot, labelled.

## Product Principles

- Prove, don't claim. Every section is a case study or a removed objection.
- One door. One ask, phrased like the email.
- Match the email. Same voice, same niche, same offer, same scheduling rule.
- Editable by William. Copy is data.
- Presentation-grade motion for people who sit through decks; never in the way of reading.
