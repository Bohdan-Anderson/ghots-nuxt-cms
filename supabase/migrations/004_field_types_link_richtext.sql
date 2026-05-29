-- Phase 4: link + richtext field types (values stored as JSON text in fields.value)

alter table fields drop constraint if exists fields_type_check;

alter table fields add constraint fields_type_check
  check (type in ('section', 'plain_text', 'link', 'richtext'));

-- Demo page: seed CTA slice with link + richtext (idempotent)
do $$
declare
  v_page_id uuid;
  v_slice_id uuid;
begin
  select id into v_page_id from pages where slug = '/demo';
  if v_page_id is null then
    return;
  end if;

  select id into v_slice_id
  from page_slices
  where page_id = v_page_id
    and slice_type_key = 'cta'
  limit 1;

  if v_slice_id is null then
    insert into page_slices (page_id, slice_type_key, sort_order)
    values (v_page_id, 'cta', 2)
    returning id into v_slice_id;
  end if;

  if not exists (
    select 1 from fields where slice_id = v_slice_id and name = 'copy'
  ) then
    insert into fields (page_id, slice_id, name, type, value, sort_order)
    values (
      v_page_id,
      v_slice_id,
      'copy',
      'richtext',
      '{"source":"Welcome to our **demo**.","html":"<p>Welcome to our <strong>demo</strong>.</p>"}',
      0
    );
  end if;

  if not exists (
    select 1 from fields where slice_id = v_slice_id and name = 'cta_link'
  ) then
    insert into fields (page_id, slice_id, name, type, value, sort_order)
    values (
      v_page_id,
      v_slice_id,
      'cta_link',
      'link',
      '{"url":"https://example.com","label":"Learn more","target":"_blank"}',
      1
    );
  end if;
end $$;
