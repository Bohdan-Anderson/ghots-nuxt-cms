# Publish workflow

Editors change content in **Supabase** (live for logged-in users). **Guests** read the last **`nuxt generate`** output in `dist/` — they do not see in-progress edits until you publish.

## Draft vs published

| Audience | What they see | Updates when |
| -------- | ------------- | ------------ |
| Logged-in editor | Live Supabase data | On save (immediate in dev) |
| Guest (static deploy) | Prerendered HTML + payload | After rebuild + deploy |

There is no auto-rebuild on save. Publishing is explicit.

## v1: manual generate + deploy

The CMS sidebar **Publish** panel (logged-in only) shows the command to run:

```bash
npm run publish:static
```

That runs `nuxt generate` and writes `dist/`. Deploy `dist/` to your static host (S3, Netlify, nginx, etc.).

### Build requirements

Generate **calls Supabase** to fetch pages, fields, slices, and globals. At build time you need:

- `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Network access to Supabase
- Migrations applied; pages exist for prerendered routes

See [Static generation](./static-generation.md) for payload caching and crawler behavior.

### Local guest preview

After generate:

```bash
npm run static
```

Opens http://localhost:8000 — same files guests get after deploy.

## Future: CI webhook (stub only)

Optional env placeholder for a later Supabase Edge Function → GitHub Action flow:

```env
CMS_PUBLISH_WEBHOOK_URL=https://example.com/hooks/publish
```

When set, the Publish panel notes that a webhook is configured. **v1 does not call it** — run `npm run publish:static` manually or wire CI yourself.

## E2E

- `publish-split.spec.ts` — guest stays on stale static HTML until regenerate
- `publish-ui.spec.ts` — Publish panel visible for editors; copy command works
