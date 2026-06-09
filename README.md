# ghots-nuxt-cms

Static-first Nuxt CMS backed by Supabase: prerendered pages for visitors, modal editing for authenticated users.

**Repository:** [github.com/Bohdan-Anderson/ghots-nuxt-cms](https://github.com/Bohdan-Anderson/ghots-nuxt-cms)

## Documentation

**[docs/README.md](./docs/README.md)** — consumer guides: install, templates, slices, field types, publish, examples.

**[docs/dev/](./docs/dev/)** — architecture and contributor docs.

Online: [github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs](https://github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs)

## Repository layout

| Path | Purpose |
| ---- | ------- |
| [`packages/nuxt-cms/`](./packages/nuxt-cms/) | CMS Nuxt layer |
| [`demo/`](./demo/) | Reference demo site + E2E |
| [`examples/minimal/`](./examples/minimal/) | Minimal install smoke-test app |
| [`docs/`](./docs/) | Documentation |

## Quick start (demo)

```bash
npm install
cp demo/.env.example demo/.env   # Supabase keys
npm run dev                      # http://localhost:3000
```

Static preview: `npm run static` → http://localhost:8000

## Publish the npm package

The CMS layer is published as **`ghots-nuxt-cms`**. See [docs/dev/npm-publish.md](./docs/dev/npm-publish.md) for the release checklist.

```bash
cd packages/nuxt-cms
npm pack --dry-run   # inspect tarball
npm publish
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Demo dev server |
| `npm run dev:minimal` | Minimal example dev server |
| `npm run generate` | Static site → `demo/dist/` |
| `npm run static` | Generate + serve locally |
| `npm run test:unit` | Vitest (package) |
| `npm run test:e2e` | Playwright (demo) |
