# E2E testing

Playwright tests run locally against **real Supabase** and validate editor vs guest behavior.

## Prerequisites

1. Apply migrations in order: `001_pages_fields.sql`, `002_slices_meta_globals.sql`, `003_rls_hardening.sql`.
2. Create a Supabase Auth user (email/password) for editing.
3. Copy [`demo/.env.example`](../../demo/.env.example) to `demo/.env` and set:
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

## Feature videos

After adding or changing an e2e spec, record screen captures of what the test does:

```bash
npm run test:e2e:videos
```

This runs the full suite with video recording enabled and opens the HTML report when finished. Each test has a video tab in the report. Actions are slowed by 400ms so the recording is easier to follow. Override with `E2E_VIDEO_SLOW_MO=800` (milliseconds) if you want it slower.

To record a single spec while iterating:

```bash
E2E_VIDEO=1 npm run test:e2e -- demo/e2e/editor-edit.spec.ts
playwright show-report
```

Videos are written to `playwright-report/` (browse via the report) and `test-results/<project>/<test>/video.webm`. Both directories are gitignored.

Notes:

- `publish-split.spec.ts` includes long `npm run generate` waits in the recording.
- That spec uses two browser contexts (guest + editor), so you get separate videos for each.

## What each test validates

| Spec | Behavior |
| ---- | -------- |
| `demo/e2e/guest-static.spec.ts` | Logged-out visitor on static server (`:8000`) loads home from prerender; **no** Supabase requests |
| `demo/e2e/content-model-v2.spec.ts` | Static guest on `/demo`: slices, global nav label, `<title>` from page meta; **no** Supabase requests |
| `demo/e2e/editor-edit.spec.ts` | Editor logs in on dev server (`:3001`), edits title via modal, value persists after refresh |
| `demo/e2e/content-model-v2-editor.spec.ts` | Editor edits a slice field on `/demo` via modal; persists after refresh |
| `demo/e2e/sidebar.spec.ts` | Create page (slice-demo template), add slice, edit via content tree, save meta |
| `demo/e2e/publish-split.spec.ts` | After edit, dev shows new title immediately; static guest still shows old title until `nuxt generate`; guest sees new title after regenerate |
| `demo/e2e/publish-ui.spec.ts` | Publish panel visible for editor; copy command to clipboard |

## DB reset

- **globalSetup** and **globalTeardown** call `resetE2eBaselines()` to restore home `/` and demo `/demo` fields to known values.
- Helpers sign in with `E2E_EDITOR_*` and update via Supabase (RLS authenticated write).
- If home page has no `fields` rows yet, setup seeds them from the default template schema.

Baseline constants live in [`demo/e2e/helpers/db-reset.ts`](../../demo/e2e/helpers/db-reset.ts) (`BASELINE` for home, `DEMO_BASELINE` for `/demo`).

## Known limitations

- Tests use **serial** execution and shared DB state — not parallel-safe.
- Editor tests start a dedicated dev server on **port 3001** (`NUXT_IGNORE_LOCK=1` so it can run beside your own `npm run dev` on 3000).

## Troubleshooting

| Issue | Check |
| ----- | ----- |
| Missing env error | All vars in `demo/.env`; see `demo/.env.example` |
| Sign-in failed | Auth user exists; email/password match `E2E_EDITOR_*` |
| `ENOTFOUND` / fetch failed on setup | Network/VPN; Supabase project paused; verify `VITE_SUPABASE_URL` in `demo/.env` |
| Login works in app but not tests | E2E injects session via Supabase API + localStorage; check `demo/.env` vars |
| Generate fails in setup | Supabase reachable; migration applied; home page at `/` |
| Static test fails on h1 text | Run `npm run generate` manually after checking baseline in DB |
| Port in use | E2E uses 3001 + 8000; stop anything bound to those ports |
