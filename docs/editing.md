# Editing UX

What your client or content editor sees — no code required on their side.

## Login

Editors go to **`/login`** on the same site as guests. Email + password via Supabase Auth.

After login:

- Page content loads live from Supabase
- **CMS sidebar** appears (toggle with the **CMS** button if collapsed)

## Sidebar

Three tabs:

| Tab         | Purpose                                             |
| ----------- | --------------------------------------------------- |
| **Content** | Tree of page fields, slices, and nested array items |
| **Pages**   | List pages, create new ones (slug, title, template) |

The **slug** field slugifies as you type: spaces become hyphens, non URL-safe characters are removed, and the path is lowercased (e.g. `About Us` → `/about-us`). Nested paths work too (`/blog/My Post` → `/blog/my-post`).
| **Meta**    | SEO: meta title, description, OG image, noindex     |

### Content tree

- Click a **field** → opens the edit modal
- **Sections** — fixed in code; fields listed under each section in the tree
- **Arrays** — add/remove items in the sidebar; edit each item's fields via modal or page click

The tree is built from rendered DOM (`scanContentTree`) — it mirrors your template markup.

## Modal

One modal for all field types. Save writes to Supabase and updates the page immediately (no full reload).

Open the modal by:

- Clicking a field in the sidebar
- Clicking an element on the page with **`data-name`** and an editable **`data-type`** (for supported leaf types)

Array items are edited from the sidebar, not by clicking the page.

### Rich text fields

The richtext modal accepts a small markdown subset: paragraphs, **bold**, *italic*, links, bullet lists, and numbered lists. Toolbar buttons insert list markers on the selected lines. Saved content is converted to sanitized HTML (`<p>`, `<ul>`, `<ol>`, etc.) — see [Field types](./field-types.md#richtext).

## On-page preview

While logged in, the page reflects saved values right away. The sidebar and page stay in sync.

Guests on the static deploy do not see in-progress work until you [publish](./publishing.md).

## Page meta

Meta tab fields map to the `pages` table (`meta_title`, `meta_description`, `og_image`, `noindex`). Your `[...slug].vue` should pass them to `useHead()` — see any full demo implementation for the pattern.

## What editors cannot do

- Add new field types or section components (developer-only, in code)
- Change templates or routing structure
- Publish the static site from the UI in v1 (they run generate or ask you to deploy)

## Developer checklist for a good editor experience

- [ ] Tag every CMS node: `data-name`, `data-type`, `:data-id` — see [DOM markup](./dom-markup.md)
- [ ] Use `CmsRichText`, `CmsLink`, `CmsImage` where appropriate (they set attributes for you)
- [ ] Distinct `section-name` when reusing section components on one page
- [ ] Document publish cadence for your team

## Next

[Publishing](./publishing.md) — when guests see changes
