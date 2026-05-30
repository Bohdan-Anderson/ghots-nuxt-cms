-- Phase 6: image + array field types, Supabase Storage for CMS media

alter table fields drop constraint if exists fields_type_check;

alter table fields add constraint fields_type_check
  check (type in ('section', 'plain_text', 'link', 'richtext', 'image', 'array'));

-- Public bucket for CMS images (absolute URLs work in prerendered static HTML)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "cms_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'cms-media');

create policy "cms_media_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cms-media');

create policy "cms_media_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cms-media')
  with check (bucket_id = 'cms-media');

create policy "cms_media_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cms-media');

-- Demo page: seed team slice with one array item (idempotent)
do $$
declare
  v_page_id uuid;
  v_slice_id uuid;
  v_array_id uuid;
  v_item_id uuid;
begin
  select id into v_page_id from pages where slug = '/demo';
  if v_page_id is null then
    return;
  end if;

  select id into v_slice_id
  from page_slices
  where page_id = v_page_id
    and slice_type_key = 'team'
  limit 1;

  if v_slice_id is null then
    insert into page_slices (page_id, slice_type_key, sort_order)
    values (v_page_id, 'team', 3)
    returning id into v_slice_id;
  end if;

  if not exists (
    select 1 from fields where slice_id = v_slice_id and name = 'heading'
  ) then
    insert into fields (page_id, slice_id, name, type, value, sort_order)
    values (v_page_id, v_slice_id, 'heading', 'plain_text', 'Our team', 0);
  end if;

  select id into v_array_id
  from fields
  where slice_id = v_slice_id and name = 'members';

  if v_array_id is null then
    insert into fields (page_id, slice_id, name, type, value, sort_order)
    values (v_page_id, v_slice_id, 'members', 'array', null, 1)
    returning id into v_array_id;
  end if;

  select id into v_item_id
  from fields
  where parent_id = v_array_id and name = 'item_0';

  if v_item_id is null then
    insert into fields (page_id, slice_id, parent_id, name, type, value, sort_order)
    values (v_page_id, v_slice_id, v_array_id, 'item_0', 'section', null, 0)
    returning id into v_item_id;

    insert into fields (page_id, slice_id, parent_id, name, type, value, sort_order)
    values
      (v_page_id, v_slice_id, v_item_id, 'name', 'plain_text', 'Alex Example', 0),
      (
        v_page_id,
        v_slice_id,
        v_item_id,
        'photo',
        'image',
        '{"url":"","alt":"Alex Example"}',
        1
      );
  end if;
end $$;
