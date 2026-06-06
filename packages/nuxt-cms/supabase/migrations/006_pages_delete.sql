-- Allow authenticated editors to delete pages (cascades slices + fields).

do $$
begin
  create policy "pages_delete_authenticated"
    on pages for delete
    to authenticated
    using (true);
exception
  when duplicate_object then null;
end $$;
