# Copy voice pass (2026-09-14, Opus)

Humanizer pass over `src/content/`, matched to William's opener emails
(`emails_gen/src/emailsgen/niches/*/templates/*/opener.email`, DRAFT 8,
and `sops/cold-email-copy.md`). Wording only; no keys, no facts added.

## What changed

- Six "X, not Y" tails in the `how` lines and the footer, rewritten as
  plain statements ("pulled in, not pasted" → "already in it").
- Pillar 2 no longer says "I'm a software engineer". The emails say
  student; the site now says it once, in About, and nowhere else.
- "real problems for real firms", "usual suspects", "ready to go",
  "nothing stops working", "genuinely" cut.
- Form placeholder: three fragments → one sentence.
- Impact figure `6–7 hrs` → `6 to 7 hrs`, the way the email writes it.

## Where to attack

1. **The two case studies on the site are not the two builds in the
   email.** Email: a policy chatbot for 17,000 Government of Canada
   staff (220+ directives, 6 to 7 hrs a week each) and a University of
   Alberta lab tool (200+ hours, 7,000+ records of fuel cell data).
   Site: a five-document pipeline for a four-person federal team, and
   a weekly report for a fuel cell group. Same clients, different
   stories and numbers. The page exists so a reader can "check the
   work"; a reader who compares will see a mismatch. Both yaml files
   are still marked PLACEHOLDER. This is the copy task, before any
   design pass.
2. The site says "30-minute call" and "Request an audit"; the email
   says "free consultation and a proper audit" with no length. Fine on
   a page, but decide on purpose.
3. `agencies.yaml` is still sample copy (its header says so).
4. `questions_intro` ("Short answers. Ask me the long ones on the
   call.") and `notfound` ("The front page does.") are one-line
   closers I kept because they read as his. Cut if they grate.
