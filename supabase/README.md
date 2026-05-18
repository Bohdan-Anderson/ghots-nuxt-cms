# Supabase setup

## Apply migration

Run [`migrations/001_pages_fields.sql`](migrations/001_pages_fields.sql) in the Supabase SQL editor (or via CLI).

This creates `templates`, `pages`, `fields`, RLS policies, a `default` template, and a home page at `/`.

## Manual test checklist

1. **Guest view** — Visit `/` while logged out. Content should load (after `npm run generate` if using static output).
2. **Editor seed** — Log in, visit `/`. Fields are created from `field_schema` on first visit; `data-id` attributes appear in the DOM.
3. **Edit** — Click the title or body text; modal opens. Save; text updates on the page.
4. **New page** — In Supabase, insert into `pages` with a slug (e.g. `/about`) and `template_id` from `templates`. Visit that URL while logged in to seed fields.
