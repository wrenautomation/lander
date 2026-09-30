# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro, static output, GSAP + ScrollTrigger for motion, Cloudflare Pages Functions + D1 for the forms. Confirmed by William 2026-09-14.

## Users

Owners, CEOs and managing directors of midsize service firms. First: recruiting and staffing firms (5+ recruiters, years of past clients in the ATS). They got a cold email from wren and clicked, or found the site. They care about two things: more business (job orders, a pipeline that doesn't hang on one rainmaker) and less busywork for their team. Skeptical, often on a phone, deciding in under a minute.

## Product Purpose

Wren Automation is William's one-engineer firm. It builds both halves: systems that bring a firm new business (dead lead reactivation, speed to lead, outbound) and automations that handle the admin that business creates. The site makes the email believable, states the offer plainly, and turns interest into an application and a booked call.

## Positioning

An engineer, not an agency. Every pitch page sells one named offer from wren's registry (`wren/packages/offers`). Recruiting: lead reactivation, 3 firms at a time, paid per meeting booked after a setup fee. After it, the AI integration build in four stages (figure out, fix, connect, put AI to work), shown with its weeks, never priced on the page. ICP: owner-led firms of 10-50 people that can pay $10-15k upfront and $5-10k/mo.

## Operating Context

wren's recruiting campaign links to `/recruiting/lead-reactivation`. `/` tells the general story and routes recruiting firms to `/recruiting/lead-reactivation`. `/agencies` stays on the older niche design. The form is an application: offer questions one at a time, then contact details. A fit applicant books a call on Cal.com in the page once the offer has a booking link; until then they get a reply within one business day.

## Capabilities and Constraints

- Pitch sections in order: hero (copy, facts, byline, and the form beside it behind a black rule), the problem (questions, fix line, goal and button, pain, fix), the two halves, industries, the build (four stages on a week chart), proof, about, FAQ (all answers open, no clicks), closing call, footer. Any optional section can be left out.
- Hub (/) sections in order, on the B2B template: hero (proof pill, headline, three checks, a line pointing at the form, the form beside it opening on the main bottleneck), the pain (margin only: why it shrinks with team size, a line chart, then a one-line fix), what makes it stick (six cards, each opening on a small animated scene), the five levels, which is how it works (a row each: a bar one step longer per level, what the level is, why it hurts, and a speech bubble with how I fix it; an AI-ready line after level 3; the animation shows level 4 appearing alone, falling, then the levels built in order), two builds (each with the levels it climbed), every service (a numbered list by who it is for, a small diagram per row, the recruiting group linking to its page), about (two lines, then the two internships as in-and-out cards with their real numbers), a comparison table (each mark with why), FAQ, the recap (start now vs wait, margins that hold), sources (every `[^n]` in the copy), footer. One button per section.
- Terms, slots, days, questions, fit rule and booking link come from the offer snapshot, never the yaml. The build fails on a mismatch.
- All copy lives in yaml. William edits prose himself.
- Pitch pages are light only, set as a partner's letter (white screen, black text, General Sans only, no italics, rounded cards, diagrams in light gray windows, the pfp's rust in set places only: the stamp, buttons, the rust back cover). See DESIGN.md. Readers skim headings and pictures, so pictures carry the story: faces, an example thread, image slots, a code-drawn diagram per step. Photos are generated from each slot's prompt (Higgsfield), never stock.
- Motion is presentation-grade and never hijacks scroll. `?static` and reduced motion turn it off. Pages read fully with JS off.
- No invented numbers, testimonials, logos or results. Illustrations are labelled as illustrations.

## Brand Commitments

- Name: Wren Automation. Short, subtle. No surname in the brand.
- Voice: William's cold-email voice. Extremely concise, plain sentences a person would say out loud. No jargon, no filler, no hype verbs.

## Evidence on Hand

- Government of Canada policy search (17,000 staff, 220+ directives). University of Alberta lab (200+ hours of lookups cut across 7,000+ records).
- No client case studies, testimonials, logos or press yet. The first reactivation clients make the first ones.
- Headshot at `public/headshot.png`.

## Product Principles

- One offer per page, stated plainly: what you get, what you put in, what I get.
- Real scarcity only: the slot count is the offer's, and the reason is on the page.
- Match the email. Same voice, same offer.
- Copy is data, terms are the registry's.
