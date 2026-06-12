-- ADR 003: remove slice instances; all fields are page- or global-owned

-- Reparent slice fields to page-level (slice fields become orphans at page root if needed)
-- Demo data: delete slice instances and their fields (re-seeded from templates on visit)
delete from fields where slice_id is not null;
delete from page_slices;

alter table fields drop column if exists slice_id;

drop table if exists page_slices;
