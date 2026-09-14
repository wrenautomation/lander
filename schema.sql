create table if not exists leads (
  id integer primary key autoincrement,
  ts text not null,
  email text not null,
  phone text,
  note text,
  niche text,
  page text,
  ip text,
  ua text
);
