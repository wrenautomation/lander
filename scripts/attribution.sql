-- One-off: bring a database made before 2026-09-29 up to the attribution columns in schema.sql.
alter table hits add column view text;
alter table hits add column visitor text;
alter table hits add column r text;
create unique index if not exists ix_hits_view on hits (view);
create index if not exists ix_hits_visitor on hits (visitor);
alter table applications add column visitor text;
alter table applications add column first_touch text;
alter table applications add column last_touch text;
alter table applications add column r text;
alter table leads add column visitor text;
alter table leads add column first_touch text;
alter table leads add column last_touch text;
alter table leads add column r text;
