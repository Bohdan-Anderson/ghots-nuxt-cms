# Supabase setup (demo)

Apply migrations in order via the Supabase SQL editor or CLI:

1. [`migrations/001_pages_fields.sql`](migrations/001_pages_fields.sql)
2. [`migrations/002_slices_meta_globals.sql`](migrations/002_slices_meta_globals.sql)
3. [`003_rls_hardening.sql`](migrations/003_rls_hardening.sql)
4. [`004_field_types_link_richtext.sql`](migrations/004_field_types_link_richtext.sql)
5. [`005_images_arrays_storage.sql`](migrations/005_images_arrays_storage.sql)

Same files live in [`packages/nuxt-cms/supabase/migrations/`](../../packages/nuxt-cms/supabase/migrations/).

## Docs

- **Setup (consumer):** [docs/supabase.md](../../docs/supabase.md)
- **Schema detail:** [docs/dev/database.md](../../docs/dev/database.md)
- **Main index:** [docs/README.md](../../docs/README.md)

## Environment

```env
# demo/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Quick test

```bash
npm run dev          # from repo root
npm run static       # guest preview on :8000
```
