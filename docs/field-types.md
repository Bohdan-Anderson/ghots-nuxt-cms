# Field types

Field types define what editors can fill in and how values are stored. Schemas live in template or slice definitions; the CMS provides modals and save logic.

## Schema shape

Each field in a schema:

```ts
{ name: 'title', type: 'plain_text', default: 'Hello' }
```

| Property   | Required    | Purpose                                           |
| ---------- | ----------- | ------------------------------------------------- |
| `name`     | Yes         | Stable id; used in `data-name` and `resolveField` |
| `type`     | Yes         | One of the types below                            |
| `default`  | No          | Seed value when the field row is created          |
| `children` | For `array` | Schema for each repeated item                     |

## Supported types

### plain_text

Single-line or short text. Stored as a string.

```json
{ "name": "title", "type": "plain_text", "default": "" }
```

```vue
<h1 :data-name="'title'">{{ field('title')?.value }}</h1>
```

Click-to-edit on page: **yes**.

---

### link

URL + label + optional target. Stored as JSON.

```json
{ "name": "cta", "type": "link", "default": "https://example.com" }
```

Render with the CMS helper:

```vue
<CmsLink v-if="field('cta')" :field="field('cta')!" data-name="cta" />
```

Or parse manually with `parseLinkValue(field('cta')?.value)`.

Click-to-edit: **yes**.

---

### richtext

Markdown source + sanitized HTML. Stored as JSON `{ source, html }`.

```json
{ "name": "body", "type": "richtext", "default": "Hello **world**." }
```

```vue
<CmsRichText v-if="field('body')" :field="field('body')!" data-name="body" />
```

Editors write markdown in the modal; templates render `html`. Click-to-edit: **yes**.

---

### image

Upload to Supabase Storage. Stored as JSON `{ url, alt }`.

```json
{ "name": "photo", "type": "image" }
```

```vue
<CmsImage v-if="field('photo')" :field="field('photo')!" data-name="photo" />
```

At **`nuxt generate`**, remote image URLs can be copied into `dist/` for fully offline static hosting.

Click-to-edit: **yes**.

---

### array

Repeatable group of child fields. Managed in the **sidebar** (add/remove items), not on the page.

```json
{
  "name": "members",
  "type": "array",
  "children": [
    { "name": "name", "type": "plain_text", "default": "" },
    { "name": "role", "type": "plain_text", "default": "" }
  ]
}
```

In Vue, resolve items and loop:

```vue
<script setup lang="ts">
const items = computed(() =>
  resolveArrayItems(props.fields, 'members', props.sliceId),
)
</script>

<template>
  <ul>
    <li
      v-for="itemFields in items"
      :key="itemFields[0]?.parent_id"
    >
      {{ itemFields.find((f) => f.name === 'name')?.value }}
    </li>
  </ul>
</template>
```

Click-to-edit on canvas: **no** (open fields from sidebar).

---

### section

Internal row grouping parent for array items. **Do not** put `section` in your schema — the CMS creates these automatically.

## resolveField cheat sheet

```ts
resolveField(fields, fieldName, parentSectionName?, sliceId?)
```

| Use case                | Call                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| Page-level field        | `resolveField(pageFields, 'title')`                                       |
| Slice field             | `resolveField(fields, 'headline', undefined, sliceId)`                    |
| Field inside section    | `resolveField(fields, 'body', 'main')`                                    |
| Field inside array item | `resolveArrayItems(...)` then `itemFields.find((f) => f.name === 'name')` |

## Sidebar preview

Each type shows a short preview in the content tree (truncated text, link label, etc.).

## Next

- [Examples: blog](./examples/blog.md) — arrays in practice
- [Templates](./templates.md) — page-level schemas
