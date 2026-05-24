# E2E testing

Playwright tests run locally against **real Supabase** and validate editor vs guest behavior.

## Prerequisites

1. Apply [`supabase/migrations/001_pages_fields.sql`](../supabase/migrations/001_pages_fields.sql).
2. Create a Supabase Auth user (email/password) for editing.
3. Copy [`.env.example`](../.env.example) to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `E2E_EDITOR_EMAIL`
   - `E2E_EDITOR_PASSWORD`
4. Install Chromium for Playwright (once):

```bash
npm run test:e2e:install
```

## Run tests

```bash
npm run test:e2e
```

Interactive UI:

```bash
npm run test:e2e:ui
```

The first run takes longer: **global setup** resets home page fields to a known baseline and runs `npm run generate` to build `dist/`.

## What each test validates

| Spec | Behavior |
| ---- | -------- |
| `guest-static.spec.ts` | Logged-out visitor on static server (`:8000`) loads home from prerender; **no** Supabase `fields` requests for page body |
| `editor-edit.spec.ts` | Editor logs in on dev server (`:3001`), edits title via modal, value persists after refresh |
| `publish-split.spec.ts` | After edit, dev shows new title immediately; static guest still shows old title until `nuxt generate`; guest sees new title after regenerate |

## DB reset

- **globalSetup** and **globalTeardown** call `resetHomePageFields()` to set home `title` and `body` to baseline values.
- Helpers sign in with `E2E_EDITOR_*` and update via Supabase (RLS authenticated write).
- If home page has no `fields` rows yet, setup seeds them from the default template schema.

Baseline constants live in [`e2e/helpers/db-reset.ts`](../e2e/helpers/db-reset.ts).

## Known limitations

- **Nav still calls Supabase** for guests on static deploy (`page-list`). Phase 1 will eliminate that.
- Tests use **serial** execution and shared DB state — not parallel-safe.
- Editor tests start a dedicated dev server on **port 3001** (`NUXT_IGNORE_LOCK=1` so it can run beside your own `npm run dev` on 3000).

## Troubleshooting

| Issue | Check |
| ----- | ----- |
| Missing env error | All vars in `.env`; see `.env.example` |
| Sign-in failed | Auth user exists; email/password match `E2E_EDITOR_*` |
| Login works in app but not tests | E2E injects session via Supabase API + localStorage; check `.env` vars |
| Generate fails in setup | Supabase reachable; migration applied; home page at `/` |
| Static test fails on h1 text | Run `npm run generate` manually after checking baseline in DB |
| Port in use | E2E uses 3001 + 8000; stop anything bound to those ports |
