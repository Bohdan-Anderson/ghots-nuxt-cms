# Roadmap & todos

Living roadmap for **ghots-cms**. Full product goals live in [docs/vision.md](./docs/vision.md).

Each phase has:

- **Why** — reasoning; what problem it solves and why it comes now
- **Depends on** — prior phases that must land first
- **Tasks** — concrete work
- **Validate** — how we know it’s done (manual + E2E where applicable)
- **Touches** — main files/areas (starting points, not exhaustive)

Phases are ordered: later work assumes earlier foundations. Don’t skip ahead without the dependencies listed.

---

## Phase 0 — E2E foundation ✅

### Why

We’re building toward a page-builder CMS with a **draft vs published** split (editors see live Supabase; guests see static `dist/`). That model is easy to break accidentally — e.g. guest cache bypass, stale static HTML, editor saves not patching UI.

**E2E first** gives us a safety net before larger refactors (data model v2, sidebar, new field types). Tests run against **real Supabase** with DB reset so we catch integration issues, not mocks.

This phase does **not** need to test every feature — it locks in the three behaviors the whole architecture rests on:

1. Guest static page body comes from prerender (no live `fields` fetch)
2. Editor can save content and it persists
3. Static guests stay on old content until regenerate (“publish”)

### Depends on

- Supabase migration applied, Auth user for `E2E_EDITOR_*`
- See [docs/e2e.md](./docs/e2e.md)

### Tasks

- [x] Playwright + dev/static webServers (port **3001** for E2E dev, **8000** for static)
- [x] `.env.example` + E2E env validation (`VITE_SUPABASE_*`, `E2E_EDITOR_*`)
- [x] DB reset helper — baseline home `title` + `body`; globalSetup/globalTeardown
- [x] **Test:** guest static — no `/rest/v1/fields` requests; h1 matches baseline
- [x] **Test:** editor — session inject → modal edit → refresh persists
- [x] **Test:** publish split — static stale until `nuxt generate`

### Validate

- `npm run test:e2e` green locally (~20s after browser install)
- [docs/e2e.md](./docs/e2e.md) documents setup and known gaps (nav still hits Supabase)

### Touches

- `e2e/`, `playwright.config.ts`, `docs/e2e.md`, `.env.example`
- Minor: [app/pages/login.vue](./app/pages/login.vue) — logout only when logged in

### Notes / known gaps

- Login in E2E uses **API session injection** (not the login form) — still proves editor + auth gating; add form-login test later if desired
- Nav (`page-list`) still calls Supabase for guests — fixed in Phase 1
- No CI yet — local only

---

## Phase 1 — Editor reliability & zero Supabase for guests

### Why

Two separate problems block the “cheap static hosting” goal:

**1. Editor UX is fragile today.** After a modal save, `patchField` in [useGhostPage.ts](./app/composables/useGhostPage.ts) replaces the page object, but sidebar state ([useCmsPanel.ts](./app/composables/useCmsPanel.ts)) and the page can drift. As we add field types and sidebar-driven edits, we need **one source of truth** for “current page content while editing” so sidebar + on-page preview always match.

**2. Guests still hit Supabase for nav.** [usePageList.ts](./app/composables/usePageList.ts) has no `getCachedData` guard (documented in [docs/static-generation.md](./docs/static-generation.md)). That means every guest page load costs a DB round-trip — undermining zero-backend hosting and adding latency.

Phase 1 completes the **static-first guest story** started in Phase 0 (page body only) and hardens the editor before we change the data model.

### Depends on

- Phase 0 (E2E catches regressions on guest cache + edit flow)

### Tasks

- [x] **Editor store** — centralize logged-in page content (Pinia store or dedicated composable); sidebar + `[...slug].vue` read/write the same state; saves patch store instead of ad hoc `content.value = { ... }`
- [x] **Single edit path** — sidebar field click and page `[data-name]` click both open the same modal via [usePageEditor.ts](./app/composables/usePageEditor.ts); enforce when adding field types
- [x] **Cache nav for guests** — add `getCachedData` + `loggedIn` bypass to `useAsyncData('page-list', …)` mirroring page content pattern
- [x] **Prerender nav** — ensure `nuxt generate` bakes page list into payload or HTML so guests never need runtime fetch
- [x] **E2E:** extend `guest-static.spec.ts` — assert zero Supabase requests total (or zero except none), not just `fields`
- [x] **E2E:** edit via sidebar → modal → page h1 updates without navigation

### Validate

- Playwright: guest static = **0** requests to Supabase host on `/`
- Playwright: edit from sidebar updates visible page content immediately
- Manual: `npm run static`, logged out, Network tab clean

### Touches

- `app/composables/useGhostPage.ts`, `useCmsPanel.ts`, `usePageList.ts`
- `app/components/CmsSidebar.vue`, `PageEditorProvider.vue`
- `e2e/guest-static.spec.ts`, new or updated editor spec
- [docs/static-generation.md](./docs/static-generation.md)

### Design notes

- Store should hold `PageContent | null` for current route only; clear on logout / leave CMS routes
- Keep payload JSON-serializable — no functions in `useState` (prerender constraint from Phase 0)

---

## Phase 2 — Data model: slices, page fields, meta, globals

### Why

Today’s schema is **one template → fixed field tree per page** ([001_pages_fields.sql](./supabase/migrations/001_pages_fields.sql)). That matches a demo, not the product vision:

- **Slices** — reusable sections (Prismic/Storyblok style), add/remove/reorder on any page, project-wide slice types
- **Page-level fields** — content outside slices (hero title, SEO)
- **Global regions** — nav/footer shared across pages; live for admin, static for guests after publish
- **Page meta** — slug, titles, OG tags for `<head>`

Without this migration, Phase 3 sidebar and Phase 4 field types have nowhere to attach. **Get the schema right here** — UI work in Phase 3 assumes these tables/composables exist.

### Depends on

- Phase 1 (stable editor + guest static — new model will be easier to test)

### Tasks

- [x] **Design doc / ADR** in `docs/` — slice storage choice (`page_slices` table vs JSON), global storage (`globals` table vs pseudo-pages), field ownership (page vs slice instance vs global)
- [x] **Migration 002** — new tables/columns; RLS policies; seed data for dev
- [x] **Slice registry in code** — map slice type key → Vue component + field schema (like [useTemplate.ts](./app/composables/useTemplate.ts) today)
- [x] **Page slice instances** — ordered rows per page; FK to slice type key
- [x] **Page-level fields** — fields with `page_id` but no slice parent (or explicit `scope` column)
- [x] **Page meta** — columns or `meta` jsonb on `pages` (slug, title, meta_title, meta_description, og_image, noindex)
- [x] **Globals** — `useGlobal(key)` composable; load + cache like page content
- [x] **Seed on add** — inserting a slice instance creates field rows from schema; delete cascades
- [x] **Update** [app/types/cms.ts](./app/types/cms.ts) and [usePageContent.ts](./app/composables/usePageContent.ts) (or split into slice-aware loader)

### Validate

- [x] Manual: one page with 2× same slice type + page-level field + global nav text — all render in a test template (`/demo`)
- [x] Migration applies cleanly on fresh Supabase
- [x] Existing home page still works (migration path or re-seed documented)
- [x] Playwright: `content-model-v2.spec.ts` + `content-model-v2-editor.spec.ts`

### Touches

- `supabase/migrations/`, `app/types/cms.ts`, `app/composables/usePageContent.ts`
- New: slice registry, `useGlobal.ts`, example slice components under `app/slices/` or `app/templates/`
- [docs/content-model.md](./docs/content-model.md), [docs/database.md](./docs/database.md)

### Open decisions (resolve during this phase)

- Slice types in DB vs code-only registry (likely **code registry** + optional DB label)
- Rich text / link value shape in DB (JSON column vs separate columns) — stub for Phase 4

---

## Phase 3 — Sidebar & page management

### Why

**Usability is top priority** — editors should feel like they’re editing the site, not filling a database form. The sidebar is the **primary CMS chrome**: structure navigation, page list, meta, slice management. Everything opens the **one modal** (vision principle).

Today [CmsSidebar.vue](./app/components/CmsSidebar.vue) only lists a flat field tree and page links. Phase 2’s model needs UI for slices, meta, and page creation. Build this **after** the schema so we’re not redoing UI when tables change.

### Depends on

- Phase 2 (slices, meta, globals in DB + composables)

### Tasks

- [x] **Flexible content tree** — nested display driven by schema (page → slices → fields, or page → fields only, etc.)
- [x] **Pages tab** — create page: slug, title, template picker; validate unique slug
- [x] **Meta panel** — edit page meta fields from sidebar
- [x] **Slice controls** — add slice (pick type), remove, reorder (sidebar only — avoid cluttering page canvas)
- [x] **Tree → page** — click field/slice row → scroll/highlight `[data-name]` on page + open modal
- [x] **Tabs layout** — Content / Pages / Meta (exact IA TBD but keep simple)

### Validate

- [x] Playwright: `e2e/sidebar.spec.ts` — create page → add slice → edit field via tree → meta saves
- [x] Manual: reorder slices → page render order updates for logged-in user

### Touches

- `app/components/CmsSidebar.vue`, `app/app.vue`
- `app/composables/useCmsPanel.ts` — may need slice/page CRUD actions
- New sidebar subcomponents if tree grows large
- `e2e/` — new `sidebar.spec.ts` or extend editor specs

---

## Phase 4 — Field types (v1)

### Why

`plain_text` proves the modal + save pipeline. **v1 product** needs **link** and **richtext** for real marketing pages. Building field types **after** Phase 2–3 means:

- Modal registry has a stable “open field X” path from sidebar and page
- Slice schemas can declare mixed field types day one

Defer **image** and **array** to Phase 6 — they need Storage and more complex sidebar UX.

### Depends on

- Phase 3 (sidebar opens modal for all types)
- Phase 2 (field rows exist for slice/page scopes)

### Tasks

- [ ] **Field type registry** — map `FieldType` → modal component + save/load helpers
- [ ] **`link`** — modal: url, label, optional target; JSON or structured `value`; template helper to render `<a>`
- [ ] **`richtext`** — modal editor (TipTap / markdown TBD); on save persist **source + rendered HTML**; templates render HTML
- [ ] **Extend** [FieldEditModal.vue](./app/components/FieldEditModal.vue) or split per-type modals behind registry
- [ ] **Click delegation** — [PageEditorProvider.vue](./app/components/PageEditorProvider.vue) opens modal for types that support on-page click (not just `plain_text`)
- [ ] **Update** DB check constraint on `fields.type` if needed

### Validate

- Playwright: edit link + richtext on a slice; guest static unchanged until generate
- Manual: richtext HTML renders safely (sanitization decision documented)

### Touches

- `app/components/FieldEditModal.vue`, new `FieldEdit*.vue` modals
- `app/types/cms.ts`, `app/composables/usePageEditor.ts`
- Example slice/template using both types

---

## Phase 5 — Publish workflow

### Why

Phase 0 E2E proved the **concept** (regenerate → guest sees new content) but there’s no **editor-facing Publish action**. Without it, “when do guests see my changes?” is unclear.

v1 keeps generate **local/CI** (no hosted build service) — the button documents/triggers `npm run generate`. This matches vision: explicit publish, not auto-rebuild on every keystroke.

### Depends on

- Phase 1 (guest fully static)
- Phase 4 optional but ideal — publish story is clearer with real content types

### Tasks

- [ ] **Publish button** — logged-in only, visible in CMS chrome (sidebar header or similar)
- [ ] **v1 behavior** — run local script (`npm run generate`) or show instructions + copy-paste command; document env needs (Supabase reachable at build time)
- [ ] **UX copy** — “Guests see last published build”; optional “last published at” if we track it later
- [ ] **Optional stub** — config placeholder for future webhook URL (Supabase edge → GitHub Action)
- [ ] **E2E** — wire publish-split to a helper that runs generate (already partial); add test after clicking Publish if we automate

### Validate

- Manual: edit → Publish → `npm run static` → guest sees changes
- E2E publish-split stays green; optionally triggered via Publish UI

### Touches

- New `PublishButton.vue` or section in `CmsSidebar.vue`
- `package.json` script e.g. `publish:static` wrapping generate
- [docs/e2e.md](./docs/e2e.md), [docs/development.md](./docs/development.md)

---

## Phase 6 — Images & arrays (post-v1)

### Why

Real sites need **images** and **repeatable blocks** (team members, feature cards). These are post-v1 because:

- **Images** need Supabase Storage, upload UX in modal, and static URL strategy at generate time
- **Arrays** need sidebar add/remove — intentionally not on-page (vision: avoid cluttering canvas)

Supabase Storage keeps hosting simple (one vendor) per vision.

### Depends on

- Phase 4 field type registry (extend, don’t reinvent)
- Phase 5 publish (images in static output must be correct for guests)

### Tasks

- [ ] **Supabase Storage** — bucket, RLS, public vs signed URL policy
- [ ] **`image` field** — upload in modal; store URL (+ alt text?); template binding
- [ ] **Generate** — confirm image URLs work in prerendered HTML (absolute URLs)
- [ ] **`array` / repeatable** — schema marks repeatable group; sidebar add/remove items; each item uses child fields edited via modal
- [ ] **E2E** — upload + render; repeatable list count changes

### Validate

- Manual: image on page survives generate + static guest view
- Playwright: add/remove array item, field value appears in template

### Touches

- Supabase storage policies, new migration if metadata tables needed
- Modal upload component, array UI in `CmsSidebar.vue`

---

## Phase 7 — Package extraction

### Why

Goal is to **transfer CMS to other Nuxt projects**. This repo stays a **reference implementation** until the model works; then extract:

- Composables, components, migrations, setup docs
- Site-specific: templates, slices, globals definitions

Packaging too early duplicates refactor pain across consumers.

### Depends on

- Phases 1–5 minimum (working reference app); 6 nice-to-have

### Tasks

- [ ] **Boundary audit** — list what is CMS-generic vs site-specific (`app/cms/` vs `app/templates/`, `app/slices/`)
- [ ] **Nuxt module or layer** — install path, auto-imports, config for Supabase env
- [ ] **npm package** — publish privately or public; versioning
- [ ] **Getting started guide** — Supabase project, migration, env, first template, generate, deploy
- [ ] **Smoke test** — empty Nuxt app + package → one editable page in &lt; 30 min

### Validate

- Second repo or branch installs package and completes checklist without copying CMS source by hand
- [docs/vision.md](./docs/vision.md) portability section matches reality

### Touches

- New package directory or monorepo split; move files incrementally
- Root README points to package docs

---

## Backlog / ideas

Items not scheduled — revisit after relevant phase.

| Idea                                         | Why deferred                             | Likely phase                |
| -------------------------------------------- | ---------------------------------------- | --------------------------- |
| Rename project (Ghost conflict)              | Branding, not blocking                   | Before npm publish          |
| Rich text editor choice (TipTap vs markdown) | Implementation continues Phase 4         |
| Login form E2E (vs session inject)           | API inject sufficient for now            | Phase 1+                    |
| CI GitHub Action on publish webhook          | Local generate only for v1               | Phase 5+                    |
| Draft/preview URLs                           | Same deploy, login gate is enough for v1 | post-v1                     |
| Roles / multi-user                           | Single editor per project for now        | post-v1                     |
| `@nuxt/test-utils`                           | Plain Playwright works                   | revisit if SSR tests needed |

---

## Quick reference — phase order

```text
0 E2E ✅  →  1 Editor + guest static ✅  →  2 Data model ✅
                    ↓
3 Sidebar UI  →  4 Field types  →  5 Publish  →  6 Images/arrays  →  7 Package
```

**Current focus:** Phase 4 — Field types (v1)
