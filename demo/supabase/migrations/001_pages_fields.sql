-- CMS: templates, pages, fields

create table templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  field_schema jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  template_id uuid not null references templates (id) on delete restrict,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fields (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages (id) on delete cascade,
  parent_id uuid references fields (id) on delete cascade,
  name text not null,
  type text not null check (type in ('section', 'plain_text')),
  value text,
  sort_order int not null default 0,
  unique (page_id, parent_id, name)
);

create index fields_page_id_idx on fields (page_id);
create index fields_parent_id_idx on fields (parent_id);

-- Seed default template (matches DefaultPage.vue)
insert into templates (key, label, field_schema)
values (
  'default',
  'Default',
  '[
    { "name": "title", "type": "plain_text", "default": "" },
    {
      "name": "main",
      "type": "section",
      "children": [{ "name": "body", "type": "plain_text", "default": "" }]
    }
  ]'::jsonb
);

-- Seed home page
insert into pages (slug, template_id, title)
select '/', id, 'Home'
from templates
where key = 'default';

-- RLS
alter table templates enable row level security;
alter table pages enable row level security;
alter table fields enable row level security;

create policy "templates_select_anon"
  on templates for select
  to anon, authenticated
  using (true);

create policy "pages_select_anon"
  on pages for select
  to anon, authenticated
  using (true);

create policy "pages_insert_authenticated"
  on pages for insert
  to authenticated
  with check (true);

create policy "pages_update_authenticated"
  on pages for update
  to authenticated
  using (true)
  with check (true);

create policy "fields_select_anon"
  on fields for select
  to anon, authenticated
  using (true);

create policy "fields_insert_authenticated"
  on fields for insert
  to authenticated
  with check (true);

create policy "fields_update_authenticated"
  on fields for update
  to authenticated
  using (true)
  with check (true);

create policy "fields_delete_authenticated"
  on fields for delete
  to authenticated
  using (true);
