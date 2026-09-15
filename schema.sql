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
  ua text
);

-- one anonymous row per page view (src/scripts/hit.ts). depth = % scrolled, secs = visible time,
-- cta = clicked through to the form, touched = focused a form field, w = viewport width (mobile < 840)
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
  ua text
);

-- name and questions were added 2026-09-15. A database created before then: npm run db:alter
