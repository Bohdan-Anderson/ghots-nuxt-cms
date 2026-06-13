# Field types

Field types define what editors can fill in, which database column holds the value, and which modal opens on click. In the DOM-first model, you declare the type on each element with **`data-type`** — there is no required JSON schema in the database.

See **[DOM markup](./dom-markup.md)** for how attributes fit together.

## Leaf types

Each leaf node needs `data-name`, `data-type`, and `:data-id`:

```vue
<h1 data-name="title" data-type="plain_text" :data-id="titleField.id">
  {{ cmsColumnValue(titleField, 'plain_text') }}
</h1>
```

| `data-type`   | DB column    | Edit on page click |
| ------------- | ------------ | ------------------ |
| `plain_text`  | `plain_text` | Yes                |
| `link`        | `link`       | Yes                |
| `richtext`    | `richtext`   | Yes                |
| `image`       | `image`      | Yes                |

Structural types (`page`, `section`, `array`) hold no leaf value — they group children. See [DOM markup](./dom-markup.md).

---

### plain_text

Single-line or short text.

```vue
<h1
  data-name="title"
  data-type="plain_text"
  :data-id="field('title').id"
>
  {{ cmsColumnValue(field('title'), 'plain_text') }}
</h1>
```

---

### link

URL + label + optional target. Stored as JSON `{ url, label, target }`.

```vue
<CmsLink :field="field('cta_link')" name="cta_link" />
```

`<CmsLink>` sets `data-name`, `data-type="link"`, and `:data-id` on the anchor. Or parse manually with `parseLinkValue(field('cta')?.link)`.

---

### richtext

Markdown source + sanitized HTML. Stored as JSON `{ source, html }`.

```vue
<CmsRichText :field="field('copy')" name="copy" />
```

Editors write markdown in the modal; templates render sanitized `html`.

**Supported markdown:**

| Syntax | Result |
| ------ | ------ |
| Blank line between blocks | New paragraph |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `[label](https://url)` | Link (http/https only) |
| `- item` or `* item` | Bullet list |
| `1. item` | Numbered list |

The modal includes **• List** and **1. List** toolbar buttons to prefix the current line(s). You can also type list markers directly. Separate lists from paragraphs with a blank line.

---

### image

Upload to Supabase Storage. Stored as JSON `{ url, alt }`.

```vue
<CmsImage :field="field('photo')" name="photo" />
```

At **`nuxt generate`**, remote image URLs can be copied into `dist/` for fully offline static hosting.

---

### array

Repeatable group of child fields. Managed in the **sidebar** (add/remove items), not on the page.

Mark the array in markup with a hidden hook:

```vue
<div
  data-name="members"
  data-type="array"
  :data-id="membersArray.id"
  hidden
/>
```

Render each item as a `data-type="section"` with `data-name="item_0"`, `item_1`, etc. Child fields inside carry their own `data-name` / `data-type` / `:data-id`.

Demo: [`demo/app/sections/TeamSection.vue`](../demo/app/sections/TeamSection.vue) on `/demo`.

---

## Resolving fields in templates

Use **`useCmsField(fieldsByParentAndName, parentId, name)`** — parent id is `null` for page-level fields, or a section/array row id for nested fields:

| Use case                | Call                                                         |
| ----------------------- | ------------------------------------------------------------ |
| Page-level field        | `useCmsField(map, null, 'title')`                            |
| Field inside section    | `useCmsField(map, sectionField.id \|\| null, 'body')`        |
| Section container       | `useCmsField(map, pageParentId, 'hero1')`                    |
| Array item child        | Look up by `itemSection.id` as parent id                     |

Read values with **`cmsColumnValue(field, 'plain_text' | 'richtext' | 'link' | 'image')`**.

## Sidebar preview

Each type shows a short preview in the content tree (truncated text, link label, etc.).

## Next

- [DOM markup](./dom-markup.md) — sections, arrays, globals
- [Examples: blog](./examples/blog.md) — arrays in practice
- [Templates](./templates.md) — page layouts
