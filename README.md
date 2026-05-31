# ghots-cms

Static-first Nuxt CMS backed by Supabase: prerendered pages for visitors, modal editing for authenticated users.

## Documentation

**[docs/README.md](./docs/README.md)** — consumer guides: install, templates, slices, field types, publish, examples.

**[docs/dev/](./docs/dev/)** — architecture and contributor docs.

## Repository layout

| Path | Purpose |
| ---- | ------- |
| [`packages/nuxt-cms/`](./packages/nuxt-cms/) | CMS Nuxt layer |
| [`demo/`](./demo/) | Reference demo site + E2E |
| [`docs/`](./docs/) | Documentation |

## Quick start (demo)

```bash
npm install
cp demo/.env.example demo/.env   # Supabase keys
npm run dev                      # http://localhost:3000
```

Static preview: `npm run static` → http://localhost:8000

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Demo dev server |
| `npm run generate` | Static site → `demo/dist/` |
| `npm run static` | Generate + serve locally |
| `npm run test:e2e` | Playwright (demo) |
