# Modal editing

Editing is **client-only** and only active when **`loggedIn`** is true. Despite the filename, editing is **not** inline (no `contenteditable` on the page) — clicks open a **modal** with a textarea.

## Components

| Component            | Role                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `CmsSidebar`         | Logged-in left panel; **Page contents** tab opens the same modal via `usePageEditor().open()` |
| `PageEditorProvider` | Wraps page template; one click listener (delegation); hosts modal                             |
| `FieldEditModal`     | `<dialog>` for `plain_text` values                                                            |
| `usePageEditor`      | Modal open/close/save; field registry for DOM lookup                                          |
| `useCmsPanel`        | Sidebar toggle, tab, and synced `pageContent` (see [CMS sidebar](./cms-sidebar.md))           |

## Enablement

`[...slug].vue`:

```vue
<PageEditorProvider
  :enabled="loggedIn"
  :fields="content.fields"
  :fields-by-id="content.fieldsById"
  :fields-by-name="content.fieldsByName"
  @field-updated="onFieldUpdated"
>
  <component :is="templateComponent" :fields="content.fields" />
</PageEditorProvider>
```

Guests see the same HTML. When `enabled` is false:

- No `.page--editing` cursor styling
- Clicks are ignored (handler returns early)
- `FieldEditModal` is not rendered (`v-if="enabled"` inside provider)

## Template markup

Templates use plain HTML with attributes only — no field wrapper components:

```vue
<h1 data-name="title" :data-id="field('title')?.id ?? ''">
  {{ field('title')?.value }}
</h1>
```

See [Templates](./templates.md).

## Opening the modal

Two entry points share **`usePageEditor`**:

1. **On the page** — click an element with **`data-name`** (delegation in `PageEditorProvider`).
2. **CMS sidebar** — **Page contents** tab → click a **`plain_text`** row (`CmsSidebar` calls `editor.open(field)`).

`FieldEditModal` is rendered inside `PageEditorProvider` on CMS routes only. Use the sidebar or the page body on `[...slug].vue`; both require `loggedIn`.

## Click flow (page body)

1. User clicks inside an element with **`data-name`** (and ideally **`data-id`**).
2. `PageEditorProvider` uses `event.target.closest('[data-name]')`.
3. `usePageEditor.resolveFieldFromElement` maps DOM → `FieldRow` (`data-id` first, then `data-name`).
4. Only **`plain_text`** opens the modal (`section` nodes are structural).
5. User edits in **`FieldEditModal`** → **Save** → `updateFieldValue` in Supabase.
6. `fieldUpdatedHandler` (module-level) → emit `fieldUpdated` → `onFieldUpdated` patches `content` in the page.

Registry and handler are registered in **`onMounted`** and cleared in **`onUnmounted`**.

## State design (prerender-safe)

From `usePageEditor.ts`:

| State                           | Storage             | Serialized in payload?             |
| ------------------------------- | ------------------- | ---------------------------------- |
| Modal open, draft, active field | `useState`          | Yes (plain data)                   |
| `fieldsById`, `fieldsByName`    | `useState` registry | Yes                                |
| `fieldUpdatedHandler`           | Module variable     | **No** — functions break `devalue` |

Storing a save callback in `useState` caused **`Cannot stringify a function`** during `nuxt generate`. Callbacks must stay out of the payload.

## Local patch after save

`onFieldUpdated` updates:

- `content.fields[index]`
- `content.fieldsById[id]`
- `content.fieldsByName[name]` for root fields

No full `refresh()` required after a successful save.

## Styling

- `.page--editing :deep([data-name]) { cursor: pointer; }` in `PageEditorProvider.vue`
- Minimal modal CSS in `FieldEditModal.vue`

## Limitations (current)

- Only **`plain_text`** is editable in the UI.
- No rich text, images, or field reordering in the browser.
- No create/delete page UI — new pages via Supabase (or future admin).
- Saves require network; no offline queue.
