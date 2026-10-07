-- Run once: npm run db:migrate (remote) or npx wrangler d1 execute wren-leads --local --file schema.sql

-- one row per form submit
create table if not exists leads (
  id integer primary key autoincrement,
  ts text not null,
  name text,
  email text not null,
  phone text,
  note text,
  questions text,
  niche text,
  page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ref text,
  country text,
  ip text,
  ua text,
  visitor text,
  first_touch text,
  last_touch text,
  r text
);

-- one row per page view (src/scripts/hit.ts). depth = % scrolled, secs = visible time,
-- cta = clicked through to the form, touched = focused a form field, w = viewport width (mobile < 840).
-- view = the page's own id for this view (arrival and exit posts land on one row); visitor = the wv cookie
-- (functions/_shared/visitor.ts); r = the code on an email link. r, utm_* and ref are set only on the view a
-- visitor arrived on, so a row with any of them is a touch.
create table if not exists hits (
  id integer primary key autoincrement,
  ts text not null,
  page text,
  niche text,
  depth integer,
  secs integer,
  cta integer,
  touched integer,
  w integer,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ref text,
  country text,
  ua text,
  view text,
  visitor text,
  r text
);
create unique index if not exists ix_hits_view on hits (view);
create index if not exists ix_hits_visitor on hits (visitor);

-- name and questions were added 2026-09-15. A database created before then: npm run db:alter

-- one row per application from a pitch page (functions/api/apply.ts). offer = an id in the offer registry
-- (wren packages/offers). answers = JSON {question id: choice id | [choice ids] | text}; fit = 1 when every
-- fit gate passed. Offers without an application (the / contact form) store {} and fit 1. Added 2026-09-25;
-- phone added 2026-09-27 (an older database: alter table applications add column phone text).
-- sms_consent added 2026-09-29: 1 = ticked the unticked-by-default texts box with a phone (an older database:
-- alter table applications add column sms_consent integer not null default 0).
create table if not exists applications (
  id integer primary key autoincrement,
  ts text not null,
  offer text not null,
  name text,
  email text not null,
  phone text,
  sms_consent integer not null default 0,
  firm text,
  note text,
  answers text not null,
  fit integer not null,
  page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ref text,
  country text,
  ip text,
  ua text,
  visitor text,
  first_touch text,
  last_touch text,
  r text
);
create index if not exists ix_applications_ts on applications (ts);

-- 2026-09-29 attribution: visitor cookie, first/last touch (JSON, from hits), email link code r. A database made
-- before then: npm run db:attribution (once).

-- 2026-10-06 signals (wren designs/2026-10-06-signals.md). One row per thing a visitor did on a page
-- (src/scripts/hit.ts): cta, form.start, form.submit, book.click, video.play, video.progress, or any
-- [data-signal] name. view = the hits row's view; props = JSON, 1 KB max.
create table if not exists events (
  id integer primary key autoincrement,
  ts text not null,
  view text not null,
  visitor text,
  page text not null,
  name text not null,
  props text not null default '{}'
);
create index if not exists ix_events_visitor on events (visitor);
create index if not exists ix_events_ts on events (ts);

-- one row per recorded page view (src/scripts/replay.ts → functions/api/replay.ts). The chunks themselves are in
-- S3 at site/replays/<view>/<seq>.json (gzip). bytes = gzip bytes stored; capped = hit REPLAY_MAX_BYTES.
-- first_touch = the visitor's first touch when the view started (JSON, as applications.first_touch), null if none.
create table if not exists replays (
  id integer primary key autoincrement,
  view text not null unique,
  visitor text,
  page text not null,
  started text not null,
  last text not null,
  chunks integer not null default 0,
  bytes integer not null default 0,
  w integer,
  country text,
  capped integer not null default 0,
  first_touch text
);

-- what wren pushes to the edge (functions/api/edge.ts): flags, experiment shares, surveys, as one JSON body. One row.
create table if not exists edge (
  id integer primary key check (id = 1),
  body text not null,
  at text not null
);
