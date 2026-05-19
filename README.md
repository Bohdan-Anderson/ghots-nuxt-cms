# ghots-cms

Static-first Nuxt CMS backed by Supabase: prerendered pages for visitors, modal editing for authenticated users.

## Quick start

```bash
npm install
# Add .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# Apply supabase/migrations/001_pages_fields.sql
npm run dev
```

Static preview: `npm run static` → http://localhost:8000

## Documentation

See **[docs/README.md](./docs/README.md)** for architecture, data model, static generation, auth, templates, and development guides.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Development server (live Supabase on every navigation) |
| `npm run generate` | Build static site to `dist/` |
| `npm run static` | Generate + serve `dist/` |
| `npm run build` | Production Nuxt build |
| `npm run preview` | Preview production build |
