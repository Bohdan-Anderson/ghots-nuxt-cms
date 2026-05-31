# Development

## Prerequisites

- Node.js (LTS recommended)
- npm
- Supabase project with migration applied

## Environment

Create `demo/.env` (see [`demo/.env.example`](../../demo/.env.example)):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Nuxt exposes these as `runtimeConfig.public.supabaseUrl` and `supabaseAnonKey`.

`.env` is gitignored — do not commit secrets.

## Install

```bash
npm install
```

## Scripts

| Command | Use |
| ------- | --- |
| `npm run dev` | Dev server (http://localhost:3000); **always** talks to Supabase |
| `npm run generate` | Static site → `dist/` |
| `npm run publish:static` | Alias for generate — command shown in CMS Publish panel |
| `npm run static` | Generate + serve `dist/` on port 8000 |
| `npm run build` | Production Nuxt build |
| `npm run preview` | Preview production build |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run test:e2e` | Playwright E2E (local Supabase; see [E2E testing](./e2e.md)) |
| `npm run test:e2e:ui` | Playwright interactive UI |

## Supabase setup

1. Run migrations from [`packages/nuxt-cms/supabase/migrations/`](../../packages/nuxt-cms/supabase/migrations/) (or [`demo/supabase/migrations/`](../../demo/supabase/migrations/) — same files).
2. Create a Supabase Auth user (email/password) for editor testing.
3. Follow [`demo/supabase/README.md`](../../demo/supabase/README.md).

## Typical workflows

### Public static preview (guest behavior)

```bash
npm run static
```

Open http://localhost:8000 — serves files from `dist/` only.

- Page **body** should come from HTML + `_payload.json` (check Network: no Supabase fetch for `pages`+`fields` on `/` when logged out).
- **Nav and globals** use the same payload cache — no runtime Supabase on a successful static deploy.

### Dev with hot reload

```bash
npm run dev
```

Every navigation uses Supabase for page content and nav. Use this for templates, composables, editor UX, and the logged-in **CMS sidebar** — not for validating static guest caching.

### Regenerate after content changes

Re-run **`npm run publish:static`** (or `npm run generate`) so `dist/` HTML and `_payload.json` match the database for guests. The logged-in CMS sidebar **Publish** panel shows the same command — see [Publish workflow](./publish.md).

Deploy the updated `dist/` folder to your static host when ready.

## Tooling

- **Prettier** — `.prettierrc.json`, `npm run format`
- **VS Code** — optional `.vscode/settings.json`

## Troubleshooting

| Issue | Check |
| ----- | ----- |
| `Cannot stringify a function` on generate | No functions in `useState`; see [Modal editing](./inline-editing.md) |
| Generate fails on `/` | Env vars; migration; Supabase reachable |
| Empty page for guests | `pages` row for slug; fields exist or were seeded at build time |
| Editor can’t save | Logged in; RLS; Network tab |
| New page not in `dist/` | `npm run generate`; link in nav for crawler |
| Guest still hits Supabase for **page body** | Use `npm run static`, not `dev`; confirm logged out; check `getCachedData` in `useCmsPage()` |
| Guest hits Supabase at all on static deploy | Re-run `npm run generate`; confirm `demo/dist/_payload.json` exists; check Network tab |
| Stale content when logged in | `watch(loggedIn, refresh)`; hard refresh after logout |

## Documentation index

See [Consumer docs](../README.md).
