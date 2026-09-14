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
    before: z.string(),
    now: z.string(),
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
    cta: z.string(),
    from_note: z.string(),
    proof: z.array(z.strictObject({ fig: z.string(), count: z.number().optional(), suffix: z.string().default(''), label: z.string() })),
    work_intro: z.string(),
    how_intro: z.string(),
    how: z.array(z.strictObject({ name: z.string(), text: z.string() })),
    questions_intro: z.string(),
    questions: z.array(z.strictObject({ q: z.string(), a: z.string() })),
    about: z.array(z.string()),
    photo: z.string().optional(), // path under public/, e.g. /william.jpg
    facts: z.array(z.strictObject({ fact: z.string(), note: z.string() })),
    ask_intro: z.string(),        // **bold** allowed
    ask_fields: z.strictObject({ email: z.string(), phone: z.string(), note: z.string(), note_placeholder: z.string() }),
    ask_small: z.string(),
    thanks_h: z.string(),
    thanks: z.string(),
    footer_line: z.string(),
    fine: z.string(),
  }),
});

export const collections = { niches, cases, site };
