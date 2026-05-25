# Supabase setup

## Apply migration

Run [`migrations/001_pages_fields.sql`](migrations/001_pages_fields.sql), then [`002_slices_meta_globals.sql`](migrations/002_slices_meta_globals.sql), then [`003_rls_hardening.sql`](migrations/003_rls_hardening.sql) in the Supabase SQL editor (or via CLI).

Creates:

- **001:** Tables `templates`, `pages`, `fields`; RLS; seed `default` template + home `/`
- **002:** Page meta columns, `page_slices`, `globals`, extended `fields`; seed `site` global + `/demo` slice demo page
- **003:** Re-affirms RLS on all tables; ensures `fields` policies exist; adds `globals` DELETE policy

Full schema docs: [docs/database.md](../docs/database.md).

## App documentation

See [docs/README.md](../docs/README.md) for architecture, static generation, and editing flows.

## Manual test checklist

1. **Build static site** — `npm run generate` (requires `.env` and migration).
2. **Guest view** — `npm run static`, visit `/` logged out. Body from HTML/payload; nav may still call Supabase.
3. **Editor seed** — Log in, visit `/`. Fields created from `field_schema` on first visit if empty; `data-id` on `[data-name]` elements.
4. **Edit** — Click title or body; modal opens; Save updates the page without full reload.
5. **New page** — Insert into `pages` (`slug`, `template_id`). Visit while logged in to seed fields; add to nav; re-run `generate` for static guests.

## Environment

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
