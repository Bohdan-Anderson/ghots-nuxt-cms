-- Ensure RLS is enabled on every CMS table (Supabase security advisor).
-- Safe to re-run: ENABLE ROW LEVEL SECURITY is idempotent.

alter table templates enable row level security;
alter table pages enable row level security;
alter table fields enable row level security;
alter table page_slices enable row level security;
alter table globals enable row level security;

-- fields: policies from 001 cover page-level, slice, and global rows.
-- Re-create only if missing (e.g. 001 not applied, or advisor still flags the table).

do $$
begin
  create policy "fields_select_anon"
    on fields for select
    to anon, authenticated
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "fields_insert_authenticated"
    on fields for insert
    to authenticated
    with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "fields_update_authenticated"
    on fields for update
    to authenticated
    using (true)
    with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "fields_delete_authenticated"
    on fields for delete
    to authenticated
    using (true);
exception
  when duplicate_object then null;
end $$;

-- globals: 002 omitted DELETE; editors need it for future global management.

do $$
begin
  create policy "globals_delete_authenticated"
    on globals for delete
    to authenticated
    using (true);
exception
  when duplicate_object then null;
end $$;
