# DOM markup

In ghots-nuxt-cms, **Vue templates are the content schema**. You declare structure and field types with HTML attributes on the elements editors click. The CMS reads those attributes to sync database rows, build the sidebar tree, and open the right edit modal.

No JSON field schema is required in the database — rows are created lazily when a logged-in editor first loads the page.

## Attributes

| Attribute | On | Purpose |
| --------- | -- | ------- |
| `data-name` | Every CMS node | Stable field key within its parent (e.g. `title`, `hero1`, `item_0`) |
| `data-type` | Every CMS node | What this node is — see [types](#data-type-values) below |
| `data-id` | Every CMS node | UUID of the matching `fields` row. Empty until the row exists |
| `data-global` | Global region wrapper only | Scopes children to a global namespace (e.g. `data-global="site"`) |

**Rules:**

- Every editable or structural node needs **`data-name`** and **`data-type`**.
- Bind **`:data-id="fieldRow.id"`** (or `?? ''`) so clicks resolve quickly after ensure. Before the first editor visit, ids are empty — that is expected.
- Parent context comes from **DOM nesting**: a field inside a `data-type="section"` belongs to that section's row.
- Do not put `data-name` on the global wrapper itself — only `data-global` and `:data-id` for the global record.

## `data-type` values

### Structural (containers)

| Value | Meaning |
| ----- | ------- |
| `page` | Page root. One per template. `:data-id` = page UUID from `content.page.id` |
| `section` | Named block under the page or another section. Has `data-name`, no leaf value |
| `array` | Repeatable group hook. Usually a hidden element; items managed in the sidebar |

### Leaf (editable values)

| Value | Stored column | Edit on page click |
| ----- | ------------- | ------------------ |
| `plain_text` | `plain_text` | Yes |
| `richtext` | `richtext` | Yes |
| `link` | `link` | Yes |
| `image` | `image` | Yes |

The `data-type` on a leaf node selects which DB column is written and which modal opens. It must match how you render the value (`cmsColumnValue(field, 'plain_text')`, `<CmsRichText>`, etc.).

## Resolving field values in Vue

Use the auto-imported helpers from the CMS layer:

```ts
// Page-level field (parent = null)
const titleField = useCmsField(fieldsByParentAndName, null, 'title')

// Field inside a section
const bodyField = useCmsField(fieldsByParentAndName, sectionField.id || null, 'body')
```

```vue
{{ cmsColumnValue(titleField, 'plain_text') }}
```

`useCmsField` returns an empty placeholder when the row does not exist yet (guests, or before lazy ensure). Templates still render; editors get rows on first load.

## Patterns

### Page root + page-level field

```vue
<script setup lang="ts">
const props = defineProps<{
  pageId: string
  fieldsByParentAndName: Record<string, FieldRow>
}>()

const titleField = computed(() =>
  useCmsField(props.fieldsByParentAndName, null, 'title'),
)
</script>

<template>
  <article data-type="page" :data-id="pageId">
    <h1
      data-name="title"
      data-type="plain_text"
      :data-id="titleField.id"
    >
      {{ cmsColumnValue(titleField, 'plain_text') }}
    </h1>
  </article>
</template>
```

Pass `:page-id="content.page.id"` and `:fields-by-parent-and-name="content.fieldsByParentAndName"` from `[...slug].vue` (see [Getting started](./getting-started.md)).

### Section component

Reusable sections are plain Vue components. Give each instance a unique `section-name` prop so multiple heroes on one page get distinct rows.

```vue
<section
  :data-name="sectionName"
  data-type="section"
  :data-id="sectionField.id"
>
  <h2
    data-name="headline"
    data-type="plain_text"
    :data-id="field('headline').id"
  >
    {{ cmsColumnValue(field('headline'), 'plain_text') }}
  </h2>
</section>
```

See [`demo/app/sections/HeroSection.vue`](../demo/app/sections/HeroSection.vue).

### Nested section (field under a section)

```vue
<section
  data-name="main"
  data-type="section"
  :data-id="field('main').id"
>
  <p
    data-name="body"
    data-type="plain_text"
    :data-id="field('body', field('main').id || null).id"
  >
    {{ cmsColumnValue(field('body', field('main').id || null), 'plain_text') }}
  </p>
</section>
```

The inner field's parent id is the section row's id.

### Helper components

`<CmsRichText>`, `<CmsLink>`, and `<CmsImage>` set `data-name`, `data-type`, and `:data-id` for you. Pass the field row and the field name:

```vue
<CmsRichText :field="field('copy')" name="copy" />
<CmsLink :field="field('cta_link')" name="cta_link" />
<CmsImage :field="itemField(itemId, 'photo')" name="photo" />
```

### Array (sidebar-managed)

Mark the array with a hidden hook element. Render items from DB rows (`kind === 'section'`, names `item_0`, `item_1`, …):

```vue
<div
  data-name="members"
  data-type="array"
  :data-id="membersArray.id"
  hidden
/>

<li
  v-for="itemSection in memberSections"
  :key="itemSection.id"
  data-type="section"
  :data-name="itemSection.name"
  :data-id="itemSection.id"
>
  <p
    data-name="name"
    data-type="plain_text"
    :data-id="itemField(itemSection.id, 'name')?.id ?? ''"
  >
    {{ cmsColumnValue(itemField(itemSection.id, 'name') ?? empty, 'plain_text') }}
  </p>
</li>
```

Add/remove items in the sidebar, not on the page. See [`demo/app/sections/TeamSection.vue`](../demo/app/sections/TeamSection.vue).

### Global region

Wrap shared chrome (nav, footer) in a global editor region:

```vue
<GlobalEditorRegion :enabled="loggedIn" :global-content="siteGlobal">
  <nav data-global="site" :data-id="siteGlobal?.global.id ?? ''">
    <strong
      data-name="nav_label"
      data-type="plain_text"
      :data-id="navLabelField?.id ?? ''"
    >
      {{ cmsColumnValue(navLabelField, 'plain_text') }}
    </strong>
  </nav>
</GlobalEditorRegion>
```

Fields inside `[data-global]` are stored against the global record, not the page. See [Globals](./globals.md).

## What happens at runtime

1. **Guest** — HTML renders with stored values. Empty `data-id` attributes are harmless.
2. **Logged-in editor** — `PageEditorProvider` / `GlobalEditorRegion` scan `[data-name]` nodes missing valid ids, ensure parent rows first (shallowest-first), then patch `:data-id` in the DOM.
3. **Click to edit** — delegation finds the nearest `[data-name]`, reads `data-type`, opens the matching modal, saves to the typed column on that row.
4. **Sidebar tree** — `scanContentTree` walks the same attributes after render.

## Checklist

- [ ] Page wrapper: `data-type="page"` + page UUID
- [ ] Every field: `data-name`, `data-type`, `:data-id`
- [ ] Sections: `data-type="section"` + unique `data-name` per instance
- [ ] Values via `useCmsField` + `cmsColumnValue` (or CMS helper components)
- [ ] Arrays: hidden `data-type="array"` hook + item sections in the loop
- [ ] Globals: `data-global` on wrapper only; children tagged like page fields

## Next

- [Templates](./templates.md) — page layouts and section stacks
- [Field types](./field-types.md) — columns and modals per type
- [Editing UX](./editing.md) — what editors see when they click
