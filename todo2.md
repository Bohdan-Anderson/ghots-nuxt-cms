# Code review follow-up (thermo-nuclear audit)

Living checklist derived from the **hard code review** of the package-extraction branch. Use this alongside [`todo.md`](./todo.md) (product roadmap) — this file tracks **implementation quality** work from the review, not feature phases.

**Review bar:** do not merge structural regressions; prefer code-judo moves that delete complexity rather than polish it.

---

## Verdict (original)

**Request changes.** Architectural direction (package + demo split) is right; branch was not merge-ready due to mid-flight migration, dual editor state, and duplicated orchestration.

---

## 1. Structural regressions (blockers)

### 1.1 Migration half-applied — repo in schismatic state

**Problem:** Root `app/` deleted while `demo/` + `packages/nuxt-cms/` were new/untracked; docs still pointed at `app/composables/useGhostPage.ts`, etc. No obvious single entrypoint. `examples/minimal/` was README-only.

**Required:**

- [x] Delete root `app/` entirely (committed: `348135c move cms out of app`)
- [x] Make `demo/` the only reference app
- [x] Update doc/todo paths → `packages/nuxt-cms/app/...` and `demo/app/...`
- [x] Runnable `examples/minimal/` workspace (`npm run dev:minimal`)

**Do not** land package extraction with a third ghost `app/` tree in git limbo.

---

### 1.2 “Single source of truth” for editor state — two sources

**Problem:** Phase 1 claimed centralized panel state, but the model was a merge layer:

```ts
// OLD — packages/nuxt-cms/app/composables/useCmsPage.ts
const displayContent = computed(() => {
  if (loggedIn.value) {
    const panel = pageContent.value
    if (panel?.page.slug === currentSlug) return panel
  }
  return content.value ?? null
})
```

Plus `watchEffect` syncing `useAsyncData` → panel, `patchField` writing panel only, `reloadCurrentPage` bypassing both. Three concepts (`content`, `pageContent`, `displayContent`) for one thing.

**Code-judo move:**

| Audience | Source of truth |
| -------- | --------------- |
| Guest | `useAsyncData` + `getCachedData` only |
| Editor | `useCmsPanel().pageContent` only |

Then delete `displayContent`, simplify `watchEffect`, route all mutations through `applyPageContent(next)`.

- [x] Split by audience in `useCmsPage()` (guest = cache, editor = panel)
- [x] Remove `displayContent` merge computed
- [x] `watchEffect` only when `loggedIn` (panel hydration from fetch)
- [x] Add `applyPageContent()` in `useCmsPanel` (canonical setter)
- [x] **Follow-up:** slice/array ops still full reload — should patch panel in place like `saveMeta` (see §2.3)

---

### 1.3 `reloadCurrentPage` double-fetches and fights its own sync

**Problem:**

```ts
// OLD
await refreshNuxtData(key)
const content = await usePageContent(slug)
setPageContent(content)
```

`refreshNuxtData` already re-ran fetch + `watchEffect` sync; then a second fetch + manual panel set. 2× Supabase per slice/array mutation.

**Fix options (pick one):**

- A) `refreshNuxtData` only — let `watchEffect` own panel sync, or
- B) `usePageContent` + `applyPageContent` only — skip `refreshNuxtData` while logged in

**Better:** stop full-page reloads for structural edits; use `applyPageContent` / `buildFieldMaps` like `saveMeta`.

- [x] Single fetch: `usePageContent` → `applyPageContent` (removed `refreshNuxtData`)
- [x] In-place panel updates for slice/array mutations (no full reload)

---

## 2. Missed dramatic simplifications (high conviction)

### 2.1 `CmsSidebar.vue` — ~120 lines duplicated template

Page-level field tree and per-slice field tree are nearly identical markup (array headers, item rows, section labels, field buttons).

- [x] Extract `CmsSidebarFieldList.vue` (props: nodes, fieldsById, fields, busy flags; emits: field-click, add-item, remove-item)

---

### 2.2 `getCachedData` + `loggedIn` guard copy-pasted four times

Identical pattern in `useCmsPage`, `usePageList`, `useTemplates`, `useGlobal`.

- [x] Extract one helper, e.g. `useGuestCachedAsyncData(key, fetcher)`

---

### 2.3 `resolveField` / `resolveArrayItems` in wrong module

Exported from `usePageContent.ts` alongside Supabase fetch logic. Templates import field-resolution from a fetch composable.

- [x] Move to `app/fields/resolveField.ts` (or similar)

---

### 2.4 `fetchGlobalContent` duplicates `usePageContent` fetch-seed-refetch shape

Both: load entity → load fields → seed if logged-in-and-empty → refetch → build maps.

- [x] Shared internal helper `loadFieldsForOwner(...)`

---

### 2.5 E2E `db-reset.ts` reimplements package logic

~400 lines with own `resolveField`, inline schema seeding instead of `seedFieldsFromSchema`.

- [x] Import canonical helpers from package / shared test utils

---

## 3. Spaghetti / branching growth

### 3.1 Inconsistent mutation strategies in `useCmsPageActions`

| Action | Strategy today |
| ------ | -------------- |
| `saveMeta` | Patch panel in place via `applyPageContent` |
| slice/array ops | Full refetch via `reloadCurrentPage` |

- [x] Unify on one mutation strategy (prefer in-place panel patch)

---

### 3.2 `insertArrayItem` reaches into `useCmsPanel()` from low-level composable

Looks like a generic DB mutation but requires panel context for schema lookup.

- [x] Pass `PageContent` (or `{ arrayField, itemSchema }`) from `useCmsPageActions` instead

---

### 3.3 Module-level `fieldUpdatedHandler` in `usePageEditor`

Module singleton for prerender constraint (no functions in `useState`). Brittle for SSR/tests/multi-editor.

- [ ] Consider `provide/inject` scoped to `PageEditorProvider`

---

## 4. Boundary / type-contract problems

### 4.1 Public docs describe `resolveField` API that does not exist

`docs/field-types.md` documents five params including `itemSectionId`; implementation has four. Working pattern: `resolveArrayItems` + `itemFields.find(...)`.

- [x] Fix docs to match reality, or add the parameter intentionally

---

### 4.2 `updateGlobalFieldValue` is dead code

Defined in `useGlobal.ts`, never referenced. Globals read for `nav_label` but not editable.

- [x] Delete until global editing exists, or wire through modal path

---

### 4.3 Awkward cast in `createPage`

`template.field_schema as import('~/types/cms').FieldSchemaNode[]`

- [ ] Align Supabase row type at query boundary

---

## 5. File size / decomposition

- `CmsSidebar.vue` ~517 lines — under 1k but duplicated field-tree blocks suggest decomposition before new sidebar tabs
- `demo/e2e/helpers/db-reset.ts` ~400 lines — candidate for shared seed/reset primitives

No file crosses 1k lines yet.

---

## 6. What is genuinely good (preserve)

- **`#cms/registries` alias** — correct inversion of control
- **`fields/registry.ts` dispatcher** — extensible field types without switch spaghetti
- **`PageEditorProvider` click delegation** — single listener, registry sync
- **`toPageContentPayload` serialization** — explicit JSON-safe prerender payload
- **`localize-cms-images` post-prerender hook** — correct static deploy layer
- **Guest zero-Supabase E2E** — `guest-static.spec.ts` asserting zero requests

---

## Recommended merge sequence (from review)

1. [x] **Finish migration atomically** — root `app/` gone, `demo/` + `packages/nuxt-cms/`, doc paths, runnable `examples/minimal/`
2. [x] **Collapse editor state model** — guest vs editor split, `applyPageContent`, no `displayContent`
3. [x] **Fix `reloadCurrentPage`** — remove double fetch
4. [x] **Extract `CmsSidebarFieldList`** — kill template duplication
5. [x] **Extract `useGuestCachedAsyncData`** — single static-first cache contract
6. [x] **Move `resolveField` / `resolveArrayItems`** out of `usePageContent.ts`; fix `docs/field-types.md`
7. [ ] **Deduplicate E2E seeding** against package `seedFieldsFromSchema`
8. [x] **Delete dead `updateGlobalFieldValue`** or implement global editing
9. [x] **Add runnable `examples/minimal/`** (wired workspace + `npm run dev:minimal`)

---

## Approval bar (presumptive blockers until resolved)

- [x] No half-applied migration / ghost `app/` tree
- [x] Editor state split by audience (no `displayContent` merge)
- [x] No `reloadCurrentPage` double-fetch
- [x] No duplicated sidebar field-tree template
- [x] No copy-pasted `getCachedData` guard (4×)
- [x] No wrong-layer exports (`resolveField` in fetch module)
- [x] No dead public API (`updateGlobalFieldValue`)
- [x] No wrong public docs (`resolveField` signature)
- [ ] npm publish (`@ghots/nuxt-cms`) — still open in `todo.md` Phase 7

---

## Review phrases (for PR comments)

Use when pushing back on new changes:

- *this pushes the file past 1k lines. can we decompose this first?*
- *this adds another special-case branch into an already busy flow. can we move this behind its own abstraction?*
- *this works, but it makes the surrounding code more spaghetti. let's keep the behavior and restructure the implementation.*
- *i think there's a code-judo move here that makes this much simpler. can we reframe this so these branches disappear?*
- *this refactor moves complexity around, but doesn't really delete it. is there a way to make the model itself simpler?*
