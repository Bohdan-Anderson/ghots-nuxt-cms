-- CMS v2: page meta, slice instances, globals, extended fields

-- Page meta (SEO / OG)
alter table pages
  add column meta_title text,
  add column meta_description text,
  add column og_image text,
  add column noindex boolean not null default false;

-- Ordered slice instances on a page (type key → code registry)
create table page_slices (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages (id) on delete cascade,
  slice_type_key text not null,
  sort_order int not null default 0
);

create index page_slices_page_id_idx on page_slices (page_id);

-- Shared content regions (nav, footer, …)
create table globals (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

-- Extend fields: page-level, slice-owned, or global-owned
alter table fields
  alter column page_id drop not null,
  add column slice_id uuid references page_slices (id) on delete cascade,
  add column global_id uuid references globals (id) on delete cascade;

alter table fields drop constraint fields_page_id_parent_id_name_key;

create unique index fields_page_scope_unique
  on fields (page_id, slice_id, parent_id, name)
  where page_id is not null;

create unique index fields_global_scope_unique
  on fields (global_id, parent_id, name)
  where global_id is not null;

alter table fields add constraint fields_owner_check check (
  (page_id is not null and global_id is null)
  or (page_id is null and global_id is not null)
);

alter table fields add constraint fields_slice_requires_page check (
  slice_id is null or page_id is not null
);

create index fields_slice_id_idx on fields (slice_id);
create index fields_global_id_idx on fields (global_id);

-- RLS for new tables
alter table page_slices enable row level security;
alter table globals enable row level security;

create policy "page_slices_select_anon"
  on page_slices for select
  to anon, authenticated
  using (true);

create policy "page_slices_insert_authenticated"
  on page_slices for insert
  to authenticated
  with check (true);

create policy "page_slices_update_authenticated"
  on page_slices for update
  to authenticated
  using (true)
  with check (true);

create policy "page_slices_delete_authenticated"
  on page_slices for delete
  to authenticated
  using (true);

create policy "globals_select_anon"
  on globals for select
  to anon, authenticated
  using (true);

create policy "globals_insert_authenticated"
  on globals for insert
  to authenticated
  with check (true);

create policy "globals_update_authenticated"
  on globals for update
  to authenticated
  using (true)
  with check (true);

-- Seed global: site nav label
insert into globals (key, label)
values ('site', 'Site settings');

insert into fields (global_id, name, type, value, sort_order)
select id, 'nav_label', 'plain_text', 'My Site', 0
from globals
where key = 'site';

-- Demo template + page with two hero slices (validates v2 model)
insert into templates (key, label, field_schema)
values (
  'slice-demo',
  'Slice demo',
  '[{ "name": "title", "type": "plain_text", "default": "Slice demo" }]'::jsonb
);

insert into pages (slug, template_id, title, meta_title, meta_description)
select
  '/demo',
  id,
  'Slice demo',
  'Slice demo — ghots-cms',
  'Demonstrates page-level fields, slices, and globals.'
from templates
where key = 'slice-demo';

with demo as (
  select id as page_id from pages where slug = '/demo'
),
title_field as (
  insert into fields (page_id, name, type, value, sort_order)
  select page_id, 'title', 'plain_text', 'Slice demo page', 0
  from demo
),
slice_one as (
  insert into page_slices (page_id, slice_type_key, sort_order)
  select page_id, 'hero', 0 from demo
  returning id, page_id
),
slice_two as (
  insert into page_slices (page_id, slice_type_key, sort_order)
  select page_id, 'hero', 1 from demo
  returning id, page_id
)
insert into fields (page_id, slice_id, name, type, value, sort_order)
select page_id, id, 'headline', 'plain_text', headline, 0
from (
  select page_id, id, 'First hero headline' as headline from slice_one
  union all
  select page_id, id, 'Second hero headline' from slice_two
) seeded;
