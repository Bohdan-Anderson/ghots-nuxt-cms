# Supabase setup

## Apply migration

Run [`migrations/001_pages_fields.sql`](migrations/001_pages_fields.sql) in the Supabase SQL editor (or via CLI).

Creates:

- Tables: `templates`, `pages`, `fields`
- RLS policies (public read, authenticated write)
- Seed: `default` template + home page at `/`

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
