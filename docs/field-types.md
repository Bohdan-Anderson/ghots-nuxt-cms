# Field types (v1)

Phase 4 adds **`link`** and **`richtext`** alongside **`plain_text`**. Structural **`section`** nodes are not editable.

## Registry

`app/fields/registry.ts` maps each `FieldType` to:

- Modal component (`FieldEditPlainText`, `FieldEditLink`, `FieldEditRichText`)
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

Helpers: `parseLinkValue`, `serializeLinkValue` in `app/types/fieldValues.ts`.

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

## Database

Apply migration **`004_field_types_link_richtext.sql`** manually:

- Extends `fields.type` check constraint
- Seeds a **CTA** slice on `/demo` with `copy` (richtext) + `cta_link` (link)

## E2E

`e2e/field-types.spec.ts` — editor edits link + richtext on `/demo`; guest static unchanged until generate.
