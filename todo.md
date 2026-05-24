# Roadmap & todos

Objectives aligned with [docs/vision.md](./docs/vision.md). Each phase lists **validation** — how we know it’s done.

---

## Phase 0 — E2E foundation (do first)

- [x] Add Playwright + `@nuxt/test-utils` (or dev server + baseURL pattern)
- [x] Document E2E env: `SUPABASE_*`, test editor credentials
- [x] DB teardown helper: reset test pages/fields after each run (keep seed template)
- [x] **Test:** guest on static deploy loads home, no Supabase network calls for page body
- [x] **Test:** editor login → edit `plain_text` via modal → refresh → value persisted
- [x] **Test:** guest still sees old value until regenerate (admin vs guest split)

**Validate:** `npm run test:e2e` green locally; manual `npm run static` confirms guest network behavior.

---

## Phase 1 — Editor reliability & guest static

- [ ] Introduce editor content store (or extend composable) so sidebar + page stay in sync after saves
- [ ] Sidebar field click → same modal as page click (already mostly true; enforce for all types)
- [ ] Zero Supabase for guests: prerender/cache `page-list` (and later globals)
- [ ] Embed or payload-cache nav links in static output

**Validate:** Playwright: edit updates UI without navigation; Network tab logged-out = 0 Supabase on `npm run static`.

---

## Phase 2 — Data model: slices, page fields, meta, globals

- [ ] Design migration: slice types (registry in code + optional DB), page slice instances (`sort_order`)
- [ ] Page-level fields separate from slice fields
- [ ] Page meta columns or `page_meta` jsonb (slug, title, meta_title, meta_description, og_image, noindex)
- [ ] Global regions: `globals` or keyed records; composable `useGlobal(key)`
- [ ] Seed slice fields on add; remove cascade on slice delete

**Validate:** Manual: add two slices + page field on one page; set global nav text; all render in template.

---

## Phase 3 — Sidebar & page management

- [ ] Flexible content tree (page → slices → fields, arbitrary nesting)
- [ ] Pages tab: create page (slug, title, template picker)
- [ ] Meta section in sidebar
- [ ] Slice UI: add / remove / reorder (sidebar)
- [ ] Tree click → scroll/highlight `[data-name]` + open modal

**Validate:** Playwright: create page, add slice, edit field via tree, meta saves.

---

## Phase 4 — Field types (v1)

- [ ] `link` — modal (url, label, target); template binding
- [ ] `richtext` — modal; persist source + rendered HTML on save
- [ ] Register field type → modal component map (extensible)

**Validate:** Playwright: edit link + richtext; template renders both; guest unchanged until publish.

---

## Phase 5 — Publish workflow

- [ ] Publish button in CMS UI (logged-in only)
- [ ] v1: documents/triggers local `npm run generate` (script or instructions)
- [ ] Optional: stub webhook config for future CI

**Validate:** E2E or manual script: edit → publish/generate → `npm run static` guest sees new content.

---

## Phase 6 — Images & arrays (post-v1)

- [ ] Supabase Storage upload field type
- [ ] Array/repeatable: sidebar add/remove items; modal edits each item

**Validate:** Upload image, use in template; repeatable list renders N items.

---

## Phase 7 — Package extraction (after reference app works)

- [ ] Split CMS module from site-specific templates
- [ ] npm package: composables, components, migrations, setup guide
- [ ] Smoke test in a second empty Nuxt app

**Validate:** Fresh install → one template + Supabase → edit + generate in under 30 min following docs.

---

## Backlog / ideas

- Rename project (avoid Ghost confusion)
- Rich text editor choice (TipTap vs markdown)
- `getCachedData` for globals when guest
- CI GitHub Action for generate on publish webhook
