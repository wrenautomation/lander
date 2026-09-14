// Schemas for the content files. William edits the files, never this.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const one = (base: string) =>
  glob({ pattern: '**/*.yaml', base: `./src/content/${base}` });

const targets = z.array(z.strictObject({ what: z.string(), how: z.string() }));

const niches = defineCollection({
  loader: one('niches'),
  schema: z.strictObject({
    hue: z.enum(['rust', 'green', 'red']),
    title: z.string(),            // <title> and the email subject line
    h1: z.string(),
    lede: z.string(),             // **bold** allowed
    cases: z.array(z.string()),   // case-study file names, in order
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
    from_note: z.string(),
    offer: z.strictObject({ eyebrow: z.string(), promise: z.string(), safe: z.string(), more: z.string() }), // promise: **bold** allowed
    work_h2: z.string(),
    work_intro: z.string(),
    case_labels: z.strictObject({ story: z.string(), now: z.string(), built: z.string(), person: z.string(), auto: z.string() }),
    offer_h2: z.string(),
    offer_intro: z.string(),
    how: z.array(z.strictObject({ name: z.string(), text: z.string() })),
    pillars_h3: z.string(),
    pillars: z.array(z.strictObject({ name: z.string(), text: z.string() })),
    questions_h2: z.string(),
    questions_intro: z.string(),
    questions: z.array(z.strictObject({ q: z.string(), a: z.string() })),
    about_h2: z.string(),
    photo: z.string().optional(), // path under public/, e.g. /william.jpg
    photo_placeholder: z.string(),
    about: z.array(z.string()),
    why_h3: z.string(),
    why: z.array(z.string()),
    ask_intro: z.string(),        // **bold** allowed
    ask_fields: z.array(z.strictObject({
      key: z.enum(['email', 'phone', 'note']), // the column it lands in; email is always checked server side
      label: z.string(),
      placeholder: z.string().default(''),
      required: z.boolean().default(false),
      error: z.string().optional(), // shown under the field when a required one is empty or the email is malformed
    })),
    ask_required: z.string(),
    ask_submit: z.string(),
    ask_small: z.string(),
    ask_error: z.string(),        // the mailto follows it
    thanks_h: z.string(),
    thanks: z.string(),
    footer_line: z.string(),
    fine: z.string(),
    notfound_title: z.string(),
    notfound_h: z.string(),
    notfound: z.string(),
    notfound_link: z.string(),
  }),
});

export const collections = { niches, cases, site };
