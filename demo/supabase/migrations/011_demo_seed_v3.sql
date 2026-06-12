-- ADR 003: reseed /demo page with DOM-first wide-row fields (no slices)

do $$
declare
  v_site_id uuid;
  v_demo_page_id uuid;
  v_hero1_id uuid;
  v_hero2_id uuid;
  v_cta_id uuid;
  v_team_id uuid;
  v_members_id uuid;
  v_item0_id uuid;
begin
  select id into v_site_id from sites where key = 'demo' limit 1;
  if v_site_id is null then
    return;
  end if;

  select id into v_demo_page_id
  from pages
  where site_id = v_site_id and slug = '/demo'
  limit 1;

  if v_demo_page_id is null then
    return;
  end if;

  update templates
  set key = 'sections-demo', label = 'Sections demo', field_schema = '[]'::jsonb
  where site_id = v_site_id and key in ('slice-demo', 'sections-demo');

  delete from fields where page_id = v_demo_page_id;

  update pages
  set title = 'Sections demo page',
      meta_title = 'Sections demo — ghots-cms'
  where id = v_demo_page_id;

  insert into fields (page_id, parent_id, name, kind, plain_text, sort_order)
  values (v_demo_page_id, null, 'title', null, 'Sections demo page', 0);

  insert into fields (page_id, parent_id, name, kind, sort_order)
  values (v_demo_page_id, null, 'hero1', 'section', 1)
  returning id into v_hero1_id;

  insert into fields (page_id, parent_id, name, kind, plain_text, sort_order)
  values (v_demo_page_id, v_hero1_id, 'headline', null, 'First hero headline', 0);

  insert into fields (page_id, parent_id, name, kind, sort_order)
  values (v_demo_page_id, null, 'hero2', 'section', 2)
  returning id into v_hero2_id;

  insert into fields (page_id, parent_id, name, kind, plain_text, sort_order)
  values (v_demo_page_id, v_hero2_id, 'headline', null, 'Second hero headline', 0);

  insert into fields (page_id, parent_id, name, kind, sort_order)
  values (v_demo_page_id, null, 'cta', 'section', 3)
  returning id into v_cta_id;

  insert into fields (page_id, parent_id, name, kind, richtext, sort_order)
  values (
    v_demo_page_id,
    v_cta_id,
    'copy',
    null,
    '{"source":"Welcome to our **demo**.","html":"<p>Welcome to our <strong>demo</strong>.</p>"}',
    0
  );

  insert into fields (page_id, parent_id, name, kind, link, sort_order)
  values (
    v_demo_page_id,
    v_cta_id,
    'cta_link',
    null,
    '{"url":"https://example.com","label":"Learn more","target":"_blank"}',
    1
  );

  insert into fields (page_id, parent_id, name, kind, sort_order)
  values (v_demo_page_id, null, 'team', 'section', 4)
  returning id into v_team_id;

  insert into fields (page_id, parent_id, name, kind, plain_text, sort_order)
  values (v_demo_page_id, v_team_id, 'heading', null, 'Our team', 0);

  insert into fields (page_id, parent_id, name, kind, sort_order)
  values (v_demo_page_id, v_team_id, 'members', 'array', 1)
  returning id into v_members_id;

  insert into fields (page_id, parent_id, name, kind, sort_order)
  values (v_demo_page_id, v_members_id, 'item_0', 'section', 0)
  returning id into v_item0_id;

  insert into fields (page_id, parent_id, name, kind, plain_text, sort_order)
  values (v_demo_page_id, v_item0_id, 'name', null, 'Alex Example', 0);

  insert into fields (page_id, parent_id, name, kind, image, sort_order)
  values (
    v_demo_page_id,
    v_item0_id,
    'photo',
    null,
    '{"url":"https://placehold.co/96x96","alt":"Alex Example"}',
    1
  );
end $$;
