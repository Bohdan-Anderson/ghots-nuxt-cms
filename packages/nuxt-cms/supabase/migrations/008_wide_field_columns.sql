-- ADR 003: wide field rows — typed value columns + structural kind

alter table fields
  add column if not exists plain_text text,
  add column if not exists richtext text,
  add column if not exists link text,
  add column if not exists image text,
  add column if not exists kind text check (kind is null or kind in ('section', 'array'));

-- Backfill value columns from legacy type + value
update fields set plain_text = value where type = 'plain_text' and plain_text is null;
update fields set richtext = value where type = 'richtext' and richtext is null;
update fields set link = value where type = 'link' and link is null;
update fields set image = value where type = 'image' and image is null;

-- Backfill structural kind
update fields set kind = 'section' where type = 'section' and kind is null;
update fields set kind = 'array' where type = 'array' and kind is null;

-- Array item sections (item_N under array parent)
update fields f
set kind = 'section'
from fields parent
where f.parent_id = parent.id
  and parent.kind = 'array'
  and f.name like 'item_%'
  and f.kind is null;
