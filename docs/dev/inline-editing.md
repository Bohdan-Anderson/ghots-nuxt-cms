# Modal editing

Editing is **client-only** and only active when **`loggedIn`** is true. Despite the filename, editing is **not** inline (no `contenteditable` on the page) — clicks open a **modal** with a type-specific editor.

## Components

| Component            | Role                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `CmsSidebar`         | Logged-in left panel; **Page contents** tab opens the same modal via `usePageEditor().open()` |
| `PageEditorProvider` | Wraps page template; one click listener (delegation); hosts modal                             |
| `GlobalEditorRegion` | Same pattern for `data-global` regions (nav, footer)                                        |
| `FieldEditModal`     | Routes to the correct editor by field type                                                    |
| `usePageEditor`      | Modal open/close/save; field registry for DOM lookup                                          |
| `useCmsPanel`        | Sidebar toggle, tab, and synced `pageContent` (see [CMS sidebar](./cms-sidebar.md))           |

## Enablement

`[...slug].vue`:

```vue
<PageEditorProvider
  :enabled="loggedIn"
  :fields-by-id="content.fieldsById"
  :fields-by-parent-and-name="content.fieldsByParentAndName"
  @field-updated="onFieldUpdated"
>
  <component
    :is="templateComponent"
    :page-id="content.page.id"
    :fields="content.fields"
    :fields-by-parent-and-name="content.fieldsByParentAndName"
  />
</PageEditorProvider>
```

Guests see the same HTML. When `enabled` is false:

- No `.page--editing` cursor styling
- Clicks are ignored (handler returns early)
- `FieldEditModal` is not rendered (`v-if="enabled"` inside provider)

## Template markup

Templates declare fields with DOM attributes — see [DOM markup](../dom-markup.md) and [content model](./content-model.md):

```vue
<h1
  data-name="title"
  data-type="plain_text"
  :data-id="titleField.id"
>
  {{ cmsColumnValue(titleField, 'plain_text') }}
</h1>
```

| Attribute   | Role                                              |
| ----------- | ------------------------------------------------- |
| `data-name` | Field key within parent                           |
| `data-type` | Selects editor + DB column (`plain_text`, `section`, …) |
| `data-id`   | Row UUID (empty until lazy ensure)                |

Helper components (`CmsRichText`, `CmsLink`, `CmsImage`) set the same attributes.

## Opening the modal

Two entry points share **`usePageEditor`**:

1. **On the page** — click an element with **`data-name`** and an editable **`data-type`** (delegation in `PageEditorProvider`).
2. **CMS sidebar** — **Page contents** tab → click a field row (`CmsSidebar` calls `editor.open(field)`).

`FieldEditModal` is rendered inside `PageEditorProvider` on CMS routes only.

## Click flow (page body)

1. User clicks inside an element with **`data-name`**.
2. `PageEditorProvider` uses `event.target.closest('[data-name]')`.
3. `resolveFieldBinding` maps DOM → `FieldRow` (`data-id` first, then `data-name` + parent walk).
4. Editable types (`plain_text`, `link`, `richtext`, `image`) open the modal; structural types do not.
5. User edits → **Save** → `updateFieldColumn` in Supabase.
6. `fieldUpdatedHandler` → emit `fieldUpdated` → parent patches local content.

## Lazy ensure (editors only)

On mount, `syncFieldsFromDom` scans rendered markup for `[data-name]` nodes missing valid ids, ensures rows shallowest-first (parents before children), then updates the registry. Guests never trigger writes.

## State design (prerender-safe)

From `usePageEditor.ts`:

| State                           | Storage             | Serialized in payload?             |
| ------------------------------- | ------------------- | ---------------------------------- |
| Modal open, draft, active field | `useState`          | Yes (plain data)                   |
| `fieldsById`, maps              | `useState` registry | Yes                                |
| `fieldUpdatedHandler`           | Module variable     | **No** — functions break `devalue` |

## Local patch after save

The page's `patchField` handler updates maps in place — no full `refresh()` required after a successful save.

## Styling

- `.page--editing :deep([data-name]) { cursor: pointer; }` in `PageEditorProvider.vue`
- Minimal modal CSS in field edit components

## Limitations (current)

- No create/delete page UI beyond sidebar basics — routing structure is developer-defined.
- Saves require network; no offline queue.
- Array add/remove is sidebar-only.
