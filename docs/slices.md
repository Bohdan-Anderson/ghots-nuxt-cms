# Slices (legacy)

> **Deprecated.** The CMS no longer uses editor-managed slice instances (`page_slices` table). Reusable blocks are **section components** placed in templates by developers. See [ADR 003 — DOM-first content model](./dev/adr-003-dom-first-content-model.md) and [DOM markup](./dom-markup.md).

Use **`app/sections/*.vue`** instead — each instance gets a unique `section-name` prop and standard `data-name` / `data-type` / `data-id` markup.

Working examples:

- [`demo/app/sections/HeroSection.vue`](../demo/app/sections/HeroSection.vue)
- [`demo/app/templates/SectionsDemoPage.vue`](../demo/app/templates/SectionsDemoPage.vue)

For template composition, read **[Templates](./templates.md)**.
