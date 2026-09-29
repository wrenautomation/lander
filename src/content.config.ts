// Schemas for the content files. William edits the files, never this.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';

const one = (base: string) =>
  glob({ pattern: '**/*.yaml', base: `./src/content/${base}` });

const targets = z.array(z.strictObject({ what: z.string(), how: z.string() }));

const niches = defineCollection({
  loader: one('niches'),
  schema: z.strictObject({
    hue: z.enum(['rust', 'green', 'red']),
    title: z.string(),            // <title> and the email subject line
    h1: z.string(),               // **bold** allowed: the accent colour
    lede: z.string(),             // **bold** allowed
    who: z.string(),              // one line under the hero button, next to the photo. **bold** allowed
    demo: z.strictObject({        // the hero card: one value typed once, the documents that fill from it. An example, and labelled as one.
      label: z.string(),          // "Entered once"
      note: z.string(),           // "example figure"
      field: z.string(),          // where the value comes from
      value: z.string(),          // the value that gets typed
      docs: z.array(z.string()).min(2).max(4), // the documents that fill, 2 to 4
      foot: z.string(),           // one line under the documents
    }),
    cases: z.array(z.string()),   // case-study file names, in order
    sides_h2: z.string(),         // pick a side: by hand vs runs itself
    sides_intro: z.string(),
    sides_pick: z.string(),       // one line in ink above the table: pick the rows that happen at your firm
    sides_hand: z.string(),       // column headings
    sides_auto: z.string(),
    sides: z.array(z.strictObject({ hand: z.string(), auto: z.string() })),
    proves_h2: z.string(),
    proves_intro: z.string(),
    proves: z.array(z.strictObject({ point: z.string(), detail: z.string() })),
    targets_h2: z.string(),
    targets_intro: z.string(),
    targets,
    form_value: z.string(),       // what the lead row says this page was
  }),
});

const cases = defineCollection({
  loader: one('case-studies'),
  schema: z.strictObject({
    client: z.string(),
    kind: z.string(),             // "Document pipeline · 2025"
    result: z.string(),           // the title: the number, in a sentence
    story: z.string(),            // what the team does and where the hours went
    now: z.string(),              // the same week today
    pipe_lead: z.string(),
    steps: z.array(z.strictObject({ name: z.string(), text: z.string(), you: z.boolean().default(false) })),
    impact: z.array(z.strictObject({
      fig: z.string(),            // what is shown, e.g. "6–7 hrs"
      count: z.number().optional(), // if set, the figure counts up to this
      suffix: z.string().default(''),
      label: z.string(),
    })),
    stack: z.string(),
  }),
});

const site = defineCollection({
  loader: one('site'),
  schema: z.strictObject({
    name: z.string(),
    email: z.string(),
    city: z.string(),
    nav: z.strictObject({ work: z.string(), offer: z.string(), about: z.string(), contact: z.string() }),
    theme: z.strictObject({ to_dark: z.string(), to_light: z.string() }),
    cta: z.string(),
    mid_cta: z.string(), // the link to the form after the case studies and after the offer
    offer: z.strictObject({ eyebrow: z.string(), promise: z.string(), safe: z.string(), more: z.string() }), // promise: **bold** allowed
    work_h2: z.string(),
    work_intro: z.string(),
    case_labels: z.strictObject({ story: z.string(), now: z.string(), built: z.string(), person: z.string(), auto: z.string() }),
    offer_h2: z.string(),
    offer_intro: z.string(),
    how: z.array(z.strictObject({ name: z.string(), text: z.string() })),
    principles_h3: z.string(),
    principles: z.array(z.strictObject({ name: z.string(), text: z.string() })),
    alt_h2: z.string(),           // why not an agency, a consultant, a hire
    alt_intro: z.string(),
    alt: z.array(z.strictObject({ who: z.string(), text: z.string() })),
    questions_h2: z.string(),
    questions_intro: z.string(),
    questions: z.array(z.strictObject({ q: z.string(), a: z.string() })),
    about_h2: z.string(),
    photo: z.string().optional(), // path under public/, e.g. /william.jpg
    about: z.array(z.string()),
    why_h3: z.string(),
    why: z.array(z.string()),
    ask_pre: z.string(),          // one line above the form heading
    ask_intro: z.string(),        // **bold** allowed
    ask_fields: z.array(z.strictObject({
      key: z.enum(['name', 'email', 'phone', 'note', 'questions']), // the column it lands in; email is always checked server side
      label: z.string(),
      placeholder: z.string().default(''),
      required: z.boolean().default(false),
      error: z.string().optional(), // shown under the field when a required one is empty or the email is malformed
    })),
    ask_required: z.string(),
    ask_submit: z.string(),
    ask_error: z.string(),        // the mailto follows it
    thanks_h: z.string(),
    thanks: z.string(),
    fine: z.string(),
    fine_turnstile: z.string(),
    fine_turnstile_link: z.string(),
    fine_privacy: z.string(),
    notfound_title: z.string(),
    notfound_h: z.string(),
    notfound: z.string(),
    notfound_link: z.string(),
  }),
});

// The offer registry, exported from wren (packages/offers) by `pnpm offers:export`. Never edited here.
// This schema is the reader's half of the contract: a snapshot of another version fails the build.
const choice = z.strictObject({ id: z.string(), label: z.string() });
const question = z.discriminatedUnion('kind', [
  z.strictObject({ id: z.string(), ask: z.string(), kind: z.enum(['one', 'many']), choices: z.array(choice), required: z.boolean() }),
  z.strictObject({ id: z.string(), ask: z.string(), kind: z.literal('text'), placeholder: z.string(), required: z.boolean() }),
]);
const range = z.strictObject({ min: z.number(), max: z.number() }).nullable();
const offers = defineCollection({
  loader: file('src/data/offers.json', {
    parser: (text) => {
      const snap = JSON.parse(text);
      if (snap.version !== 1) throw new Error(`offers.json is snapshot version ${snap.version}; this site reads version 1`);
      return snap.offers;
    },
  }),
  schema: z.strictObject({
    id: z.string(),
    name: z.string(),
    status: z.enum(['draft', 'live', 'paused', 'retired']),
    audience: z.string(),
    promise: z.string(),
    price: z.discriminatedUnion('kind', [
      z.strictObject({ kind: z.literal('free') }),
      z.strictObject({ kind: z.literal('quoted') }),
      z.strictObject({ kind: z.literal('fixed'), upfront: range, monthly: range }),
    ]),
    slots: z.number().nullable(),
    days: z.number().nullable(),
    youGet: z.array(z.string()),
    youGive: z.array(z.string()),
    weGet: z.array(z.string()),
    guarantee: z.string().nullable(),
    measures: z.array(z.strictObject({ key: z.string(), label: z.string(), unit: z.enum(['count', 'usd', 'hours']) })),
    next: z.array(z.string()),
    page: z.string().nullable(),
    booking: z.string().nullable(),
    application: z.strictObject({
      questions: z.array(question),
      fit: z.array(z.strictObject({ question: z.string(), anyOf: z.array(z.string()) })),
    }).nullable(),
  }),
});

// Pitch pages (/ and /recruiting): one yaml each, the copy for a page that sells one offer.
// Sections render in a fixed order; leave an optional one out and it doesn't render. *words* in a heading
// are the punch (rendered plain); **word** in body text turns it ink. No labels above headings.
const qa = z.array(z.strictObject({ q: z.string(), a: z.string() }));
const head = { h2: z.string(), intro: z.string() };
// running copy: a string is a paragraph, a list is a checklist, { bad: [...] } is a list crossed out
const prose = z.array(z.union([z.string(), z.array(z.string()).min(2), z.strictObject({ bad: z.array(z.string()).min(2) })])).min(1);
// An image slot: src/assets/img/<file> once it's generated, and the prompt that makes it. Until the file exists the
// page draws a plain tile (a face: initials). `npm run images` lists the missing ones with their prompts.
const shot = z.strictObject({ file: z.string(), alt: z.string(), prompt: z.string(), ratio: z.string().default('4/3') });
const face = z.strictObject({ file: z.string(), prompt: z.string() });
const msg = z.strictObject({ name: z.string(), role: z.string(), when: z.string(), text: z.string(), face: face.optional() });
// A step's diagram, drawn in code. Always shown whole; motion only brings the parts in.
const art = z.discriminatedUnion('kind', [
  // a list being worked: ok = checked, hot = worth a call, moved = changed, out = removed
  z.strictObject({ kind: z.literal('rows'), rows: z.array(z.strictObject({ text: z.string(), note: z.string(), mark: z.enum(['ok', 'hot', 'moved', 'out']) })).min(2).max(5) }),
  // relative sizes, no numbers: w is 1-100
  z.strictObject({ kind: z.literal('bars'), bars: z.array(z.strictObject({ label: z.string(), w: z.number().min(1).max(100), hot: z.boolean().optional() })).min(2).max(5) }),
  // scattered sources wired into one place
  z.strictObject({ kind: z.literal('merge'), sources: z.array(z.string()).min(2).max(5), into: z.string() }),
]);
const step = z.strictObject({ when: z.string(), name: z.string(), text: z.string(), art: art.optional() });
const pitches = defineCollection({
  loader: one('pitches'),
  schema: z.strictObject({
    title: z.string(),
    description: z.string(),
    path: z.string(),                   // the URL: '/' or '/recruiting'. Must equal the offer's page.
    offer: z.string(),                  // an id in offers.json, live, whose `page` is this path
    form_value: z.string(),             // what the D1 row says this page was
    nav: z.array(z.strictObject({ label: z.string(), to: z.string() })),
    nav_cta: z.string(),
    // The first screen: who it's for and the pain (lede), what Wren does, then the form beside it (ask).
    hero: z.strictObject({
      h1: z.string(),
      lede: z.string(),                 // blank line = paragraph. Open with the reader: **For owners of ...**
      second: z.string().optional(), second_to: z.string(),  // the quiet link under the lede; with no text, a bare arrow down that invites the scroll
      by: z.string(),                   // one line beside William's photo
      // a short signed promise under the lede: a heading and a few lines, each a thing he stands behind
      promise: z.strictObject({ h: z.string(), items: z.array(z.string()).min(2).max(4) }).optional(),
      // what the work looks like, in one picture: a message and the reply it gets. An example, labelled as one.
      scene: z.strictObject({ label: z.string(), a: msg, b: msg, tag: z.string() }).optional(),
    }),
    // The problem, top down: three pains as questions, then the fix in one line at the same size, then the goal.
    // Then the pain in depth, ending on a button back to the form.
    problem: z.strictObject({
      id: z.string(),
      questions: z.array(z.string()).length(3),
      answer: z.string(),
      target: z.string(),
      cta: z.string(),
      pain: prose,
    }).optional(),
    halves: z.strictObject({
      ...head,
      sides: z.array(z.strictObject({
        tag: z.string(), h3: z.string(), text: z.string(), image: shot.optional(),
        items: z.array(z.strictObject({ name: z.string(), text: z.string(), badge: z.string().optional() })),
      })).length(2),
      bridge: z.string(),
    }).optional(),
    industries: z.strictObject({
      h2: z.string(),
      items: z.array(z.strictObject({ name: z.string(), text: z.string(), to: z.string(), go: z.string(), badge: z.string().optional(), offer: z.string().optional() })),
    }).optional(),
    // The four stages of the build: figure out, fix, connect, put AI to work. Each has weeks [from, to] on a
    // chart drawn above the list; to = null runs on past the chart (the retainer). `when` is the label beside it.
    build: z.strictObject({
      ...head,
      id: z.string(),                   // the anchor: how on /, build on /recruiting
      week: z.string(),                 // the chart's axis label
      weeks: z.number().int().min(4).max(16),
      ongoing: z.string(),              // on the bar that runs past the chart
      stages: z.array(step.extend({ from: z.number().int().min(1), to: z.number().int().min(1).nullable() })).min(3).max(5),
    }).optional(),
    proof: z.strictObject({
      ...head,
      items: z.array(z.strictObject({ fig: z.string(), label: z.string(), text: z.string() })).min(2).max(4),
    }).optional(),
    about: z.strictObject({ h2: z.string(), paras: z.array(z.string()), photo: z.string(), sign: z.string() }),
    faq: z.strictObject({ h2: z.string(), items: qa }),
    // The form, in the first screen beside the hero: the offer's application when it has one (steps, nofit),
    // else a short contact form. After a fit: book_h/book with the calendar when the offer has a booking
    // link, thanks_h/thanks without. The build refuses a page missing the copy its offer needs.
    ask: z.strictObject({
      h2: z.string(), intro: z.string().optional(),
      assure: z.string().optional(),    // one line under the form's button, on every step
      submit: z.string(), sending: z.string(),
      cta: z.string().optional(),       // the first step's button (contact details), when the form steps
      name: z.string(), email: z.string(), phone: z.string(), firm: z.string().optional(), note: z.string().optional(),
      required: z.string(), bad_email: z.string(), error: z.string(),
      thanks_h: z.string(), thanks: z.string(),
      book_h: z.string().optional(), book: z.string().optional(),
      steps: z.strictObject({ next: z.string(), back: z.string(), pick_one: z.string(), contact_h: z.string().optional() }).optional(),
      nofit_h: z.string().optional(), nofit: z.string().optional(),
    }),
    // The last screen: one line and a button back up to the form.
    close: z.strictObject({ h2: z.string(), text: z.string(), cta: z.string() }),
  }),
});

export const collections = { niches, cases, site, offers, pitches };
