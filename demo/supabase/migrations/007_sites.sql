-- Multi-site support: sites, site_members, site_id scoping, membership-gated writes.
--
-- MANUAL STEP: Apply this migration in Supabase before running the app or E2E tests.
-- Existing CMS data is discarded (truncate + re-seed for the demo site).
-- Optional: clear old cms-media objects via Supabase Dashboard → Storage (direct SQL
-- deletes on storage.objects are blocked by Supabase).

-- ---------------------------------------------------------------------------
-- 1. Clear existing CMS data
-- ---------------------------------------------------------------------------

truncate table fields, page_slices, pages, globals, templates cascade;

-- Do not DELETE from storage.objects — Supabase blocks direct storage table writes.
-- Orphaned bucket files are harmless; remove via Dashboard → Storage if desired.

-- ---------------------------------------------------------------------------
-- 2. Sites and membership
-- ---------------------------------------------------------------------------

create table sites (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table site_members (
  site_id uuid not null references sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (site_id, user_id)
);

create index site_members_user_id_idx on site_members (user_id);

alter table sites enable row level security;
alter table site_members enable row level security;

create policy "sites_select_anon"
  on sites for select
  to anon, authenticated
  using (true);

create policy "site_members_select_authenticated"
  on site_members for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. site_id on site-owned tables
-- ---------------------------------------------------------------------------

alter table templates drop constraint if exists templates_key_key;
alter table pages drop constraint if exists pages_slug_key;
alter table globals drop constraint if exists globals_key_key;

alter table templates
  add column site_id uuid references sites (id) on delete cascade;

alter table pages
  add column site_id uuid references sites (id) on delete cascade;

alter table globals
  add column site_id uuid references sites (id) on delete cascade;

insert into sites (key, label)
values ('demo', 'Demo site');

alter table templates alter column site_id set not null;
alter table pages alter column site_id set not null;
alter table globals alter column site_id set not null;

create unique index templates_site_key_unique on templates (site_id, key);
create unique index pages_site_slug_unique on pages (site_id, slug);
create unique index globals_site_key_unique on globals (site_id, key);

create index templates_site_id_idx on templates (site_id);
create index pages_site_id_idx on pages (site_id);
create index globals_site_id_idx on globals (site_id);

-- ---------------------------------------------------------------------------
-- 4. RLS helpers
-- ---------------------------------------------------------------------------

create or replace function cms_user_can_edit_site(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from site_members
    where site_id = p_site_id
      and user_id = auth.uid()
  );
$$;

create or replace function cms_page_site_id(p_page_id uuid)
returns uuid
language sql
stable
as $$
  select site_id from pages where id = p_page_id;
$$;

create or replace function cms_global_site_id(p_global_id uuid)
returns uuid
language sql
stable
as $$
  select site_id from globals where id = p_global_id;
$$;

-- ---------------------------------------------------------------------------
-- 5. Replace write RLS policies (SELECT policies unchanged)
-- ---------------------------------------------------------------------------

drop policy if exists "pages_insert_authenticated" on pages;
drop policy if exists "pages_update_authenticated" on pages;
drop policy if exists "pages_delete_authenticated" on pages;

create policy "pages_insert_authenticated"
  on pages for insert
  to authenticated
  with check (cms_user_can_edit_site(site_id));

create policy "pages_update_authenticated"
  on pages for update
  to authenticated
  using (cms_user_can_edit_site(site_id))
  with check (cms_user_can_edit_site(site_id));

create policy "pages_delete_authenticated"
  on pages for delete
  to authenticated
  using (cms_user_can_edit_site(site_id));

drop policy if exists "globals_insert_authenticated" on globals;
drop policy if exists "globals_update_authenticated" on globals;
drop policy if exists "globals_delete_authenticated" on globals;

create policy "globals_insert_authenticated"
  on globals for insert
  to authenticated
  with check (cms_user_can_edit_site(site_id));

create policy "globals_update_authenticated"
  on globals for update
  to authenticated
  using (cms_user_can_edit_site(site_id))
  with check (cms_user_can_edit_site(site_id));

create policy "globals_delete_authenticated"
  on globals for delete
  to authenticated
  using (cms_user_can_edit_site(site_id));

drop policy if exists "templates_insert_authenticated" on templates;
drop policy if exists "templates_update_authenticated" on templates;
drop policy if exists "templates_delete_authenticated" on templates;

create policy "templates_insert_authenticated"
  on templates for insert
  to authenticated
  with check (cms_user_can_edit_site(site_id));

create policy "templates_update_authenticated"
  on templates for update
  to authenticated
  using (cms_user_can_edit_site(site_id))
  with check (cms_user_can_edit_site(site_id));

create policy "templates_delete_authenticated"
  on templates for delete
  to authenticated
  using (cms_user_can_edit_site(site_id));

drop policy if exists "fields_insert_authenticated" on fields;
drop policy if exists "fields_update_authenticated" on fields;
drop policy if exists "fields_delete_authenticated" on fields;

create policy "fields_insert_authenticated"
  on fields for insert
  to authenticated
  with check (
    (
      page_id is not null
      and cms_user_can_edit_site(cms_page_site_id(page_id))
    )
    or (
      global_id is not null
      and cms_user_can_edit_site(cms_global_site_id(global_id))
    )
  );

create policy "fields_update_authenticated"
  on fields for update
  to authenticated
  using (
    (
      page_id is not null
      and cms_user_can_edit_site(cms_page_site_id(page_id))
    )
    or (
      global_id is not null
      and cms_user_can_edit_site(cms_global_site_id(global_id))
    )
  )
  with check (
    (
      page_id is not null
      and cms_user_can_edit_site(cms_page_site_id(page_id))
    )
    or (
      global_id is not null
      and cms_user_can_edit_site(cms_global_site_id(global_id))
    )
  );

create policy "fields_delete_authenticated"
  on fields for delete
  to authenticated
  using (
    (
      page_id is not null
      and cms_user_can_edit_site(cms_page_site_id(page_id))
    )
    or (
      global_id is not null
      and cms_user_can_edit_site(cms_global_site_id(global_id))
    )
  );

drop policy if exists "page_slices_insert_authenticated" on page_slices;
drop policy if exists "page_slices_update_authenticated" on page_slices;
drop policy if exists "page_slices_delete_authenticated" on page_slices;

create policy "page_slices_insert_authenticated"
  on page_slices for insert
  to authenticated
  with check (cms_user_can_edit_site(cms_page_site_id(page_id)));

create policy "page_slices_update_authenticated"
  on page_slices for update
  to authenticated
  using (cms_user_can_edit_site(cms_page_site_id(page_id)))
  with check (cms_user_can_edit_site(cms_page_site_id(page_id)));

create policy "page_slices_delete_authenticated"
  on page_slices for delete
  to authenticated
  using (cms_user_can_edit_site(cms_page_site_id(page_id)));

-- Storage policies unchanged from migration 005.

-- ---------------------------------------------------------------------------
-- 6. Re-seed demo site content
-- ---------------------------------------------------------------------------

do $$
declare
  v_site_id uuid;
  v_default_template_id uuid;
  v_slice_demo_template_id uuid;
  v_home_page_id uuid;
  v_demo_page_id uuid;
  v_slice_one_id uuid;
  v_slice_two_id uuid;
  v_cta_slice_id uuid;
  v_team_slice_id uuid;
  v_members_array_id uuid;
  v_item_zero_id uuid;
  v_site_global_id uuid;
  v_minimal_site_id uuid;
  v_minimal_template_id uuid;
begin
  select id into v_site_id from sites where key = 'demo';

  insert into templates (site_id, key, label, field_schema)
  values (
    v_site_id,
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
  )
  returning id into v_default_template_id;

  insert into templates (site_id, key, label, field_schema)
  values (
    v_site_id,
    'slice-demo',
    'Slice demo',
    '[{ "name": "title", "type": "plain_text", "default": "Slice demo" }]'::jsonb
  )
  returning id into v_slice_demo_template_id;

  insert into pages (site_id, slug, template_id, title)
  values (v_site_id, '/', v_default_template_id, 'Home')
  returning id into v_home_page_id;

  insert into pages (
    site_id,
    slug,
    template_id,
    title,
    meta_title,
    meta_description
  )
  values (
    v_site_id,
    '/demo',
    v_slice_demo_template_id,
    'Slice demo',
    'Slice demo — ghots-cms',
    'Demonstrates page-level fields, slices, and globals.'
  )
  returning id into v_demo_page_id;

  insert into globals (site_id, key, label)
  values (v_site_id, 'site', 'Site settings')
  returning id into v_site_global_id;

  insert into fields (global_id, name, type, value, sort_order)
  values (v_site_global_id, 'nav_label', 'plain_text', 'My Site', 0);

  insert into fields (page_id, name, type, value, sort_order)
  values (v_demo_page_id, 'title', 'plain_text', 'Slice demo page', 0);

  insert into page_slices (page_id, slice_type_key, sort_order)
  values (v_demo_page_id, 'hero', 0)
  returning id into v_slice_one_id;

  insert into page_slices (page_id, slice_type_key, sort_order)
  values (v_demo_page_id, 'hero', 1)
  returning id into v_slice_two_id;

  insert into fields (page_id, slice_id, name, type, value, sort_order)
  values
    (v_demo_page_id, v_slice_one_id, 'headline', 'plain_text', 'First hero headline', 0),
    (v_demo_page_id, v_slice_two_id, 'headline', 'plain_text', 'Second hero headline', 0);

  insert into page_slices (page_id, slice_type_key, sort_order)
  values (v_demo_page_id, 'cta', 2)
  returning id into v_cta_slice_id;

  insert into fields (page_id, slice_id, name, type, value, sort_order)
  values
    (
      v_demo_page_id,
      v_cta_slice_id,
      'copy',
      'richtext',
      '{"source":"Welcome to our **demo**.","html":"<p>Welcome to our <strong>demo</strong>.</p>"}',
      0
    ),
    (
      v_demo_page_id,
      v_cta_slice_id,
      'cta_link',
      'link',
      '{"url":"https://example.com","label":"Learn more","target":"_blank"}',
      1
    );

  insert into page_slices (page_id, slice_type_key, sort_order)
  values (v_demo_page_id, 'team', 3)
  returning id into v_team_slice_id;

  insert into fields (page_id, slice_id, name, type, value, sort_order)
  values (v_demo_page_id, v_team_slice_id, 'heading', 'plain_text', 'Our team', 0);

  insert into fields (page_id, slice_id, name, type, value, sort_order)
  values (v_demo_page_id, v_team_slice_id, 'members', 'array', null, 1)
  returning id into v_members_array_id;

  insert into fields (page_id, slice_id, parent_id, name, type, value, sort_order)
  values (v_demo_page_id, v_team_slice_id, v_members_array_id, 'item_0', 'section', null, 0)
  returning id into v_item_zero_id;

  insert into fields (page_id, slice_id, parent_id, name, type, value, sort_order)
  values
    (v_demo_page_id, v_team_slice_id, v_item_zero_id, 'name', 'plain_text', 'Alex Example', 0),
    (
      v_demo_page_id,
      v_team_slice_id,
      v_item_zero_id,
      'photo',
      'image',
      '{"url":"","alt":"Alex Example"}',
      1
    );

  insert into sites (key, label)
  values ('minimal', 'Minimal example')
  returning id into v_minimal_site_id;

  insert into templates (site_id, key, label, field_schema)
  values (
    v_minimal_site_id,
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
  )
  returning id into v_minimal_template_id;

  insert into pages (site_id, slug, template_id, title)
  values (v_minimal_site_id, '/', v_minimal_template_id, 'Home');
end $$;
