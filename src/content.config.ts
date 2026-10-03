// Schemas for the content files. William edits the files, never this.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import { ICONS } from './lib/icons';

const one = (base: string) =>
  glob({ pattern: '**/*.yaml', base: `./src/content/${base}` });

const targets = z.array(z.strictObject({ what: z.string(), how: z.string() }));

const niches = defineCollection({
  loader: one('niches'),
  schema: z.strictObject({
    hue: z.enum(['rust', 'green', 'red']),
    title: z.string(),            // <title> and the email subject line
    description: z.string().optional(), // the search result snippet, ~155 characters; the lede when left out
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
    profiles: z.array(z.url()),   // Wren's own live profiles elsewhere; search engines read them as the same company
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
    fine_terms: z.string(),
    fine_cookies: z.string(),
    cookies: z.strictObject({ text: z.string(), policy: z.string(), yes: z.string(), no: z.string() }),
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
      z.strictObject({ kind: z.literal('performance'), upfront: z.number(), perUnit: z.number(), unit: z.string(), cap: z.number().nullable(), monthly: z.number().nullable(), flat: z.number().nullable(), until: z.number().nullable(), refundIfNone: z.strictObject({ minContacts: z.number() }).nullable() }),
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

// Pitch pages (/recruiting/lead-reactivation, more to come): one yaml each, the copy for a page that sells one offer.
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
// The parts / and the pitch pages share: nav, the build, proof, about, the FAQ and the form.
// an item with a `menu` opens a small list of links (the hub's services: every service, and each niche's page)
// a menu item's `what` is one line on what the service is, opened on hover or focus
const nav = z.array(z.strictObject({ label: z.string(), to: z.string(), menu: z.array(z.strictObject({ label: z.string(), note: z.string().optional(), what: z.string().optional(), to: z.string() })).min(1).optional() }));
// A card that links to a page: when it names an offer, that offer must be live and its page must be `to`,
// and {slots} and {days} in the card fill from it.
const card = z.strictObject({ name: z.string(), text: z.string(), to: z.string(), go: z.string(), badge: z.string().optional(), offer: z.string().optional() });
const industries = z.strictObject({ h2: z.string(), items: z.array(card) });
// The four stages of the build: figure out, fix, connect, put AI to work. Each has weeks [from, to] on a
// chart drawn above the list; to = null runs on past the chart (the retainer). `when` is the label beside it.
const build = z.strictObject({
  ...head,
  id: z.string(),                   // the anchor
  week: z.string(),                 // the chart's axis label
  weeks: z.number().int().min(4).max(16),
  ongoing: z.string(),              // on the bar that runs past the chart
  stages: z.array(step.extend({ from: z.number().int().min(1), to: z.number().int().min(1).nullable() })).min(3).max(5),
});
const proof = z.strictObject({
  ...head,
  items: z.array(z.strictObject({ fig: z.string(), label: z.string(), text: z.string() })).min(2).max(4),
});
// ideal: who we work best with, so the right clients see themselves and the wrong ones don't apply. h: the lead-in
// ("You'll enjoy working with us if you:"); items: one trait each, said as what the client does or wants.
const about = z.strictObject({
  h2: z.string(), paras: z.array(z.string()), photo: z.string(), sign: z.string(), cta: z.string().optional(),
  ideal: z.strictObject({ h: z.string(), items: z.array(z.string()).min(3).max(5) }).optional(),
});
const faq = z.strictObject({ h2: z.string(), items: qa });
// The form: the offer's application when it has one (steps, nofit), else a short contact form. After a fit:
// book_h/book with the calendar when the offer has a booking link, thanks_h/thanks without. The build refuses a
// page missing the copy its offer needs.
const ask = z.strictObject({
  h2: z.string(), intro: z.string().optional(),
  assure: z.string().optional(),    // one line under the form's button, on every step
  submit: z.string(), sending: z.string(),
  cta: z.string().optional(),       // the first step's button, when the form steps
  opens_with: z.string().optional(), // a question (its id in the offer) asked before the contact details
  name: z.string(), email: z.string(), phone: z.string(), sms_consent: z.string(),
  phone_required: z.boolean().optional(), // a page that calls back fast needs the number
  firm: z.string().optional(), firm_required: z.boolean().optional(), // the company website; optional unless set
  note: z.string().optional(),
  required: z.string(), bad_email: z.string(), error: z.string(),
  thanks_h: z.string(), thanks: z.string(),
  book_h: z.string().optional(), book: z.string().optional(),
  steps: z.strictObject({ next: z.string(), back: z.string(), pick_one: z.string(), other: z.string().optional(), contact_h: z.string().optional() }).optional(),
  nofit_h: z.string().optional(), nofit: z.string().optional(),
});
// Every page names its URL and the live offer whose `page` it is; form_value is what the D1 row says the page was.
const page = { title: z.string(), description: z.string(), path: z.string(), offer: z.string(), form_value: z.string(), nav, nav_cta: z.string() };

// How a firm starts: three steps as pictures, then what follows, then why it's low risk. pics name each step's
// picture (Start.astro); the recruiting page keeps the default form, call, file, then meetings.
const pic = z.enum(['form', 'call', 'file', 'plan']);
const start = z.strictObject({
  id: z.string(), h2: z.string(),
  pics: z.array(pic).length(3).default(['form', 'call', 'file']),
  steps: z.array(z.strictObject({ name: z.string(), time: z.string() })).length(3),
  then: z.strictObject({ name: z.string(), time: z.string() }),
  then_pic: z.enum(['meet', 'live']).default('meet'),
  text: z.string(), cta: z.string(),
});
// The last screen: the ask, and optionally one last reason and the benefits as two firms side by side, the one
// that acts and the one that waits. Then a button back up to the form.
// every outside figure on a page carries a [^n] marker to entry n here; the list sits at the foot of the page
const sources = z.strictObject({ h: z.string(), items: z.array(z.strictObject({ text: z.string(), url: z.url() })).min(1) });
const close = z.strictObject({
  h2: z.string(), text: z.string(), cta: z.string(),
  reason: z.string().optional(),
  vs: z.strictObject({ win: z.string(), lose: z.string(), rows: z.array(z.tuple([z.string(), z.string()])).length(3) }).optional(),
});

const pitches = defineCollection({
  loader: one('pitches'),
  schema: z.strictObject({
    ...page,
    // The first screen: who it's for and the pain (lede), what Wren does, then the form beside it (ask).
    hero: z.strictObject({
      proof: z.string().optional(),     // one real line above the headline
      h1: z.string(),
      h1_tail: z.string().optional(),   // the headline's last clause, set a step smaller on its own line
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
      target_cta: z.string().optional(), // a button under the goal
      cta: z.string(),
      pain: prose,
    }).optional(),
    // Three benefits, one row each: a flow diagram beside the headline, sides swapping row to row. The diagrams
    // are one flow (watch, reach, book) drawn in code (components/pitch/Flow.astro), joined by one line down the
    // section. A long scroll gets a button at its start and its end, not one per row: `cta` on the rows that carry one,
    // each worded differently.
    benefits: z.strictObject({
      id: z.string(),
      items: z.array(z.strictObject({ flow: z.enum(['watch', 'reach', 'book']), h2: z.string(), text: z.string(), cta: z.string().optional() })).length(3),
    }).optional(),
    halves: z.strictObject({
      ...head,
      sides: z.array(z.strictObject({
        tag: z.string(), h3: z.string(), text: z.string(), image: shot.optional(),
        items: z.array(z.strictObject({ name: z.string(), text: z.string(), badge: z.string().optional() })),
      })).length(2),
      bridge: z.string(),
    }).optional(),
    industries: industries.optional(),
    build: build.optional(),
    proof: proof.optional(),
    about,
    faq,
    ask,
    // how a firm starts: three steps as panels, then why it's low risk
    start: start.optional(),
    // The last screen: one line and a button back up to the form.
    close,
    sources: sources.optional(),
  }),
});

// The hub (/): Wren as a whole, for anyone who lands without a service link. Laid out on the B2B landing template:
// hero (proof line, dream outcome, checks, a line to the form) with the form beside it, the pain, the levels, case
// studies once real, every service, about, a comparison table, FAQ, the recap, the sources.
// One button per section.
const mark = z.enum(['yes', 'no']);
const svcEnd = z.strictObject({ icon: z.enum(ICONS), label: z.string(), note: z.string() });
const hub = defineCollection({
  loader: one('hub'),
  schema: z.strictObject({
    ...page,
    hero: z.strictObject({
      proof: z.string(),                // one real line above the headline
      h1: z.string(),
      h1_tail: z.string().optional(),   // a step smaller on its own line, in ink
      lede: z.string(),
      checks: z.array(z.string()).length(3),
      to_form: z.string(),              // one line pointing at the form beside it (below it on a phone)
    }),
    // the biggest pain, right under the first screen: a full-width headline, then the words beside a line chart of
    // net margin by team size. pct is sourced and printed (real carries the [^n]); aim is our aim, drawn as a gentler
    // green line and never printed. The two lines start at the same point.
    // punch: the pain in one sentence under the headline. manage: everything growth hands you to run, crossed out.
    // fix: the offer in one line. assure: the risk, answered beside the button
    pain: z.strictObject({
      id: z.string(), h2: z.string(), punch: z.string(), text: z.string(), fix: z.string(), cta: z.string(), assure: z.string(),
      manage: z.strictObject({ h: z.string(), items: z.array(z.string()).min(3).max(6) }),
      chart: z.strictObject({
        h: z.string(),                  // the window's title
        axis: z.string(),               // under the team sizes
        y: z.string(),                  // up the side, beside the % ticks
        real: z.string(),               // the sourced line's key, with its [^n]
        aim: z.string(),                // the green line's key
        points: z.array(z.strictObject({ label: z.string(), pct: z.number().min(0).max(100), aim: z.number().min(0).max(100) })).min(3).max(6),
      }),
    }),
    // what makes it stick: cards of a small animated scene, a name and a few sentences
    values: z.strictObject({
      id: z.string(), h2: z.string(), text: z.string(), cta: z.string(),
      items: z.array(z.strictObject({ art: z.enum(['handled', 'messy', 'charge', 'watched', 'cost', 'first']), name: z.string(), text: z.string() })).min(3).max(6),
    }),
    // the five levels a company builds, block on block (Levels.astro); `most` is the level most companies jump in at,
    // `fall` the words on its block as it falls with nothing under it; `sub`: the line under the heading; `how`: how the
    // call finds your level, under the button
    levels: z.strictObject({
      id: z.string(), h2: z.string(), text: z.string(), cta: z.string(), how: z.string(),
      word: z.string(),                 // "Level", before each number
      most: z.number().int().min(1).max(5), most_note: z.string(), fall: z.string(),
      gate: z.strictObject({ after: z.number().int().min(1).max(4), name: z.string() }), // the line after that level where AI has clean data
      // brick: the block this level adds to the stack, with its icon; fix: my bubble over the stack, what I build here;
      // has: what now exists (checks); lacks: what's still missing (crosses; none at the top). One short sentence each.
      items: z.array(z.strictObject({
        name: z.string(), brick: z.string(), icon: z.enum(ICONS), fix: z.string(),
        has: z.array(z.string()).min(1).max(3), lacks: z.array(z.string()).max(3).default([]),
      })).length(5),
    }),
    // real builds only, each as the level it started on, the level it reached, before and now. Left out until there are some.
    cases: z.strictObject({
      h2: z.string(), cta: z.string(), before: z.string(), after: z.string(),
      items: z.array(z.strictObject({
        client: z.string(), kind: z.string(),
        from: z.number().int().min(1).max(5), to: z.number().int().min(1).max(5),
        before: z.string(), after: z.string(),
      }).refine((c) => c.to > c.from, 'a case climbs: to must be above from')).min(1).max(3),
    }).optional(),
    // every service, grouped by the part of the company it's for, the groups side by side (Catalog.astro). Each service:
    // `scene`, the small scene drawn over it of what it hands you (Catalog.astro draws each one), its name, `text`: the
    // problem, then what it does, verbs first, never "I"; `gets`: the outcome. Two a group, so the section fits one
    // screen. A group's `link` must be a pitch page's path.
    catalog: z.strictObject({
      id: z.string(), h2: z.string(), cta: z.string(),
      groups: z.array(z.strictObject({
        for: z.string(),
        link: z.strictObject({ label: z.string(), to: z.string() }).optional(),
        items: z.array(z.strictObject({
          scene: z.enum(['email', 'inquiry', 'people', 'onboard', 'hours', 'report']),
          name: z.string(), text: z.string(), gets: z.string(),
        })).min(1).max(2),
      })).min(1).max(3),
    }),
    // Wren against the alternatives: each cell a mark and why in a few words; cells[0] is Wren's, then one per `them`
    compare: z.strictObject({
      id: z.string(), h2: z.string(), cta: z.string(), us: z.string(), them: z.array(z.string()).min(2).max(4),
      rows: z.array(z.strictObject({ feature: z.string(), cells: z.array(z.tuple([mark, z.string()])) })).min(3).max(7),
    }),
    faq,
    // about, plus past work drawn like a service: what went in, what came out, the real numbers (count up)
    about: about.extend({
      work: z.array(z.strictObject({
        org: z.string(), title: z.string(), in: svcEnd, out: svcEnd,
        figs: z.array(z.strictObject({ n: z.string(), label: z.string() })).min(1).max(3),
      })).min(1).max(2),
      proves: z.string(),               // one line under the cards: why work that isn't this work still counts
    }),
    close,
    ask,
    // every outside figure on the page carries a [^n] marker to entry n here; the list sits under the recap
    sources,
  }),
});

export const collections = { niches, cases, site, offers, pitches, hub };
