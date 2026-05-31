# Editing UX

What your client or content editor sees — no code required on their side.

## Login

Editors go to **`/login`** on the same site as guests. Email + password via Supabase Auth.

After login:

- Page content loads live from Supabase
- **CMS sidebar** appears (toggle with the **CMS** button if collapsed)

## Sidebar

Three tabs:

| Tab | Purpose |
| --- | ------- |
| **Content** | Tree of page fields, slices, and nested array items |
| **Pages** | List pages, create new ones (slug, title, template) |
| **Meta** | SEO: meta title, description, OG image, noindex |

### Content tree

- Click a **field** → opens the edit modal
- **Slices** — add type, reorder, remove (sidebar only)
- **Arrays** — add/remove items; edit each item’s fields via modal

The tree mirrors your schema — page fields first, then each slice with its fields.

## Modal

One modal for all field types. Save writes to Supabase and updates the page immediately (no full reload).

Open the modal by:

- Clicking a field in the sidebar
- Clicking an element on the page with **`data-name="field_name"`** (for supported types)

Array items are edited from the sidebar, not by clicking the page.

## On-page preview

While logged in, the page reflects saved values right away. The sidebar and page stay in sync.

Guests on the static deploy do not see in-progress work until you [publish](./publishing.md).

## Page meta

Meta tab fields map to the `pages` table (`meta_title`, `meta_description`, `og_image`, `noindex`). Your `[...slug].vue` should pass them to `useHead()` — see any full demo implementation for the pattern.

## What editors cannot do

- Add new field types or slice types (developer-only, in code)
- Change templates or routing structure
- Publish the static site from the UI in v1 (they run generate or ask you to deploy)

## Developer checklist for a good editor experience

- [ ] Put `data-name` on editable elements
- [ ] Use `CmsRichText`, `CmsLink`, `CmsImage` where appropriate
- [ ] Sensible defaults in field schemas
- [ ] Clear slice labels in registry (`label: 'Hero'`, not `hero_block_v2`)
- [ ] Document publish cadence for your team

## Next

[Publishing](./publishing.md) — when guests see changes
