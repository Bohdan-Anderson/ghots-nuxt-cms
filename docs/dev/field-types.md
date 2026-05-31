# Field types (v1)

Phase 4 adds **`link`** and **`richtext`** alongside **`plain_text`**. Structural **`section`** nodes are not editable.

## Registry

`packages/nuxt-cms/app/fields/registry.ts` maps each `FieldType` to:

- Modal component (`FieldEditPlainText`, `FieldEditLink`, `FieldEditRichText`, `FieldEditImage`)
- `valueToDraft` / `draftToValue` for the save pipeline
- `supportsOnPageClick` for `PageEditorProvider` click delegation
- Sidebar preview text

## `plain_text`

- **Storage:** plain string in `fields.value`
- **Modal:** textarea
- **Template:** `{{ field('name')?.value }}` with `data-name` / `data-id`

## `link`

- **Storage:** JSON string:

```json
{ "url": "https://…", "label": "Read more", "target": "_self" | "_blank" }
```

- **Modal:** URL, label, open-in select
- **Template:** `<CmsLink :field="field('cta_link')" />` (sets `data-name` / `data-id` on the anchor)

Helpers: `parseLinkValue`, `serializeLinkValue` in `packages/nuxt-cms/app/types/fieldValues.ts`.

## `richtext`

- **Storage:** JSON string:

```json
{ "source": "markdown…", "html": "<p>…</p>" }
```

- **Modal:** markdown textarea (subset: paragraphs, `**bold**`, `*italic*`, `[text](url)`)
- **On save:** `markdownToHtml` → `sanitizeHtml` → persist both `source` and `html`
- **Template:** `<CmsRichText :field="field('copy')" />` (`v-html` uses sanitized `html` from save time)

### Sanitization policy

Allowed tags after save: `p`, `br`, `strong`, `em`, `a` (http/https only), `ul`, `ol`, `li`, `h2`, `h3`. Scripts, styles, and `javascript:` URLs are stripped. Re-sanitize if you add a server-side import path later.

Editors are trusted; guests only see HTML from the last **generate** (static `dist/`). Do not paste untrusted HTML into the markdown source expecting it to survive — only the markdown subset is converted.

### Editor choice

v1 uses **markdown in a textarea**, not TipTap. Richer WYSIWYG can plug into the same registry later by changing `FieldEditRichText` and `draftToValue`.

## `image`

- **Storage:** JSON string:

```json
{ "url": "https://…/storage/v1/object/public/cms-media/…", "alt": "Description" }
```

- **Modal:** file upload to Supabase Storage (`cms-media` bucket) + alt text
- **Template:** `<CmsImage :field="field('photo')" />`
- **Static generate:** URLs are absolute Supabase public URLs — no runtime Storage calls for guests

Helpers: `parseImageValue`, `serializeImageValue` in `packages/nuxt-cms/app/types/fieldValues.ts`. Upload via `uploadCmsImage` in `packages/nuxt-cms/app/composables/useImageUpload.ts`.

Apply migration **`packages/nuxt-cms/supabase/migrations/005_images_arrays_storage.sql`** for the bucket + RLS policies.

On **`nuxt generate`**, a Nitro `prerender:done` hook downloads cms-media assets into `dist/cms-media/` and rewrites prerendered HTML + `_payload.json` to use local `/cms-media/…` URLs. Editors still see live Supabase URLs while logged in; guests on static hosting do not call Storage.

## `array` (repeatable)

- **Storage:** structural field (`value` null); each item is a `section` row (`item_0`, `item_1`, …) with child fields seeded from schema `children`
- **Schema:** in slice/template registry:

```json
{
  "name": "members",
  "type": "array",
  "children": [
    { "name": "name", "type": "plain_text" },
    { "name": "photo", "type": "image" }
  ]
}
```

- **Sidebar:** Add item / Remove item per array (not on-page)
- **Template:** `resolveArrayItems(fields, 'members', sliceId)` returns ordered item field groups

Demo: **Team** slice on `/demo`.

## Database

Apply migration **`packages/nuxt-cms/supabase/migrations/004_field_types_link_richtext.sql`** manually:

- Extends `fields.type` check constraint
- Seeds a **CTA** slice on `/demo` with `copy` (richtext) + `cta_link` (link)

## E2E

`demo/e2e/field-types.spec.ts` — editor edits link + richtext on `/demo`; guest static unchanged until generate.

`demo/e2e/images-arrays.spec.ts` — image upload + array add/remove on team slice.
