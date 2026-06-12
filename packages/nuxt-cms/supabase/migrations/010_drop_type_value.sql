-- ADR 003: remove legacy EAV columns

alter table fields drop constraint if exists fields_type_check;

alter table fields
  drop column if exists type,
  drop column if exists value;

-- Deprecate template field_schema (DOM is schema)
update templates set field_schema = '[]'::jsonb;
