# Hard code review — `7dcf828` (Refactor CMS components and enhance field management)

**Verdict: addressed (see recommended next pass below).** The direction is right — deduplication, in-place panel patches, layer cleanup — but the migration stopped halfway on array inserts, and there are still three parallel ways to rebuild `PageContent`. Several wins from `todo2.md` are real; the remaining gaps are structural, not cosmetic.

---

## 1. Structural regressions / missed code-judo

### `insertArrayItem` still does a full-page refetch — undermines the whole patch strategy

You moved slice ops to targeted fetches (`fetchFieldsForSlice`), but array insert went the opposite direction:

```ts
// useArrayFields.ts
const pageId = content.page.id
const allFields = await fetchFieldsForPage(pageId)
const subtreeIds = collectFieldSubtreeIds(allFields, itemSection.id)
return allFields.filter((field) => subtreeIds.has(field.id))
```

This refetches every field on the page just to learn what `seedArrayItem` already inserted. That's the old "reload and filter" pattern wearing a new hat.

**Code-judo move:** make `seedFieldsFromSchema` / `seedArrayItem` return `FieldRow[]` (accumulate on insert — you already `.select('*')` on every insert). Then `insertArrayItem` returns those rows directly. Delete `fetchFieldsForPage` from the array path entirely.

`addSlice` already shows the right shape: insert → fetch only what's new → `rebuildPageContent`. Array insert should match.

---

### Three parallel `PageContent` rebuild implementations

| Function | Location | Does |
|----------|----------|------|
| `buildPageContentPayload` | `usePageContent.ts` | Initial load |
| `rebuildPageContent` | `seedFields.ts` | Structural patches |
| `patchFieldInContent` | `useCmsPanel.ts` | Single-field modal save |

`patchFieldInContent` duplicates the exact same `buildFieldMaps` + `pageLevelFields` dance as `rebuildPageContent`.

This should be:

```ts
return rebuildPageContent(current, { fields: /* merged list */ })
```

One canonical rebuild path. Right now a reader has to know three functions do the same derived-map work — that's architectural drift waiting to diverge.

---

### `seedFields.ts` is becoming a junk drawer

At 243 lines it holds: seeding, map building, page-content rebuild, field loading, subtree collection. The new helpers landed here because it was convenient, not because they belong together.

Not blocking today, but the next change will make this worse. A cleaner split:

- `fields/maps.ts` — `buildFieldMaps`, `pageLevelFields`, `collectFieldSubtreeIds`
- `fields/pageContent.ts` — `rebuildPageContent`, `buildPageContentPayload`
- `seedFields.ts` — seeding + `loadFieldsForOwner` only

That also removes the awkward coupling where panel mutation logic lives next to Supabase insert loops.

---

## 2. Spaghetti / branching complexity

### `reloadCurrentPage` is dead weight

It's exported from `useCmsPageActions` but nothing calls it anymore — slice/array ops no longer use it. Keeping it signals the old mutation model is still available and invites regression.

Delete it, or if you need an escape hatch for error recovery, document that explicitly and don't export it from the public actions surface.

---

### Wrong-layer fetch helpers + circular dependency smell

`fetchFieldsForPage` and `fetchFieldsForSlice` live in `usePageContent.ts` (a page loader composable), but `useArrayFields` imports from there.

Fetch composable → mutation composable → fetch composable. Even if it doesn't cycle at runtime today, the dependency graph is backwards. Low-level field queries belong in `seedFields.ts` or a dedicated `fields/queries.ts`, not the page-content loader.

---

### Re-export of `rebuildPageContent` from `useCmsPanel`

Nothing imports it from the panel module. This adds a false "panel owns content rebuild" signal. Import from `seedFields` directly or from a single `pageContent` module — not from the panel store composable.

---

## 3. Boundary / type-contract issues

### Misplaced JSDoc — doc lies about the interface below it

In `seedFields.ts`, the comment "Collects a root field id and all descendant field ids from a flat list." sits above `LoadFieldsForOwnerOptions`, not `collectFieldSubtreeIds`. Small thing, but it's exactly the kind of drift that makes readers distrust the file.

---

### `collectFieldSubtreeIds` — indirect implementation for a simple graph walk

The growth-loop works but reads like a workaround. Build a `parent_id → children[]` index once, DFS from `rootId`. Same behavior, O(n), obvious intent. The current version looks like it was written to avoid recursion — unnecessary complexity.

---

### `resolveField.ts` — duplicated scoping filter

Both `resolveField` and `resolveArrayItems` start with identical slice scoping. Extract `scopeFields(fields, sliceId?)` and both functions shrink. Not urgent, but it's the kind of duplication that grows a third variant later.

---

## 4. Component extraction quality

### `CmsSidebarFieldList` — good extraction, incomplete cleanup

Extracting the duplicated template was the right move. Two remaining issues:

1. **Double/triple indentation** — `<li>` gets `paddingLeft: depth`, and array/array-item inner `<div>`s get it again. Page-level fields had this before; the extraction preserved the bug. Pick one level (the `<li>`) and drop inner padding.

2. **`parentArrayField(field)` called twice in template** — use a computed map or a small helper component. Minor, but it's in hot render path for every array item row.

---

## 5. What's genuinely good

Credit where it's due — these are real improvements:

- **`useGuestCachedAsyncData`** — kills 4× copy-pasted `getCachedData` guards. Clean, single contract.
- **`loadFieldsForOwner`** — correctly unifies page/global seed-on-empty flows.
- **`resolveField` / `resolveArrayItems` moved to `app/fields/`** with auto-imports — right layer, docs fixed.
- **`CmsSidebar` decomposition** — 170 lines removed from an already-large component.
- **In-place panel patches for slice add/remove/reorder and meta** — correct direction, avoids full reload.
- **E2E dedup via `test-utils/e2e.ts`** — canonical helpers instead of inline seeding.
- **Vitest + focused unit tests** — small but meaningful; tests pass.
- **Dead `updateGlobalFieldValue` removed** — good hygiene.
- **`defaultValues.ts` split** — lets seeding logic test without pulling in the full registry.

---

## 6. Test gaps (meaningful, not nit-picking)

Current tests cover happy paths only. Missing coverage that would catch the structural issues above:

- `collectFieldSubtreeIds` with deeply nested sections (only 1 level tested)
- `insertArrayItem` returning correct subtree without full-page refetch (once refactored)
- `patchFieldInContent` delegating to `rebuildPageContent` (once unified)
- Integration test that `removeArrayItem` local filter matches DB cascade behavior

---

## 7. Approval bar checklist

| Criterion | Status |
|-----------|--------|
| No structural regression | **Fail** — array insert refetch contradicts patch model |
| No obvious code-judo missed | **Fail** — seed return values, unify rebuild paths |
| No file >1k lines | Pass |
| No spaghetti branching growth | **Partial** — dead `reloadCurrentPage`, wrong-layer fetches |
| No hacky abstractions | Pass |
| Clean type boundaries | **Partial** — misplaced JSDoc, awkward subtree collector |
| Logic in canonical layer | **Partial** — fetch helpers in wrong module |
| Atomic mutation flow | **Partial** — array add is non-atomic (insert + full refetch + merge) |

---

## Recommended next pass (ordered)

1. [x] **Make seed functions return inserted rows** → delete `fetchFieldsForPage` from array insert path.
2. [x] **Collapse `patchFieldInContent` into `rebuildPageContent`** — one rebuild function.
3. [x] **Move field fetch helpers out of `usePageContent.ts`** — break the circular dependency smell.
4. [x] **Delete `reloadCurrentPage`** unless you have a documented recovery use case.
5. [x] **Fix `CmsSidebarFieldList` padding** — single indent level on `<li>`.
6. [x] **Fix misplaced JSDoc** on `LoadFieldsForOwnerOptions`.
7. [x] **Split `seedFields.ts`** into focused modules (`fields/maps.ts`, `fields/pageContent.ts`) when doing the above.
8. [x] **Extract `scopeFields`** in `resolveField.ts` to dedupe scoping.
9. [x] **Add test coverage** for nested subtrees, array insert patch path, and remove cascade.

Items 1–3 are blockers for approval under this review bar. The rest is fast follow.

---

Overall: this commit closes a lot of `todo2.md` debt and the architecture is measurably cleaner. But the array-insert path still behaves like the old reload model, and `PageContent` rebuild logic is split three ways when it should be one. Finish those two reframes and this is in good shape.
