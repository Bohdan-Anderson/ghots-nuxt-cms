# Directory structure

```
ghots-cms/
├── app/                          # Nuxt application source
│   ├── app.vue                   # Root shell (<NuxtPage />)
│   ├── pages/
│   │   ├── [...slug].vue         # All CMS pages (catch-all)
│   │   └── login.vue             # Email/password auth
│   ├── templates/
│   │   └── DefaultPage.vue       # Default layout for template key "default"
│   ├── components/
│   │   ├── PageEditorProvider.vue  # Edit mode wrapper + click delegation
│   │   └── FieldEditModal.vue      # Modal editor for plain_text
│   ├── composables/
│   │   ├── useSupabase.ts        # Supabase client singleton
│   │   ├── useAuth.ts            # Session, signIn, signOut
│   │   ├── usePageContent.ts     # Fetch page + fields; seed; updateFieldValue
│   │   ├── usePageList.ts        # Nav: all pages from DB
│   │   ├── usePageEditor.ts      # Modal state, save, click resolution
│   │   └── useTemplate.ts        # Map template key → Vue component
│   ├── plugins/
│   │   └── supabase.client.ts    # Restore session; onAuthStateChange
│   ├── types/
│   │   └── cms.ts                # Page, Template, Field types
│   └── utils/
│       └── slug.ts               # normalizeSlug()
├── docs/                         # Project documentation (this folder)
├── supabase/
│   ├── migrations/
│   │   └── 001_pages_fields.sql
│   └── README.md
├── dist/                         # Generated static site (after npm run generate)
├── nuxt.config.ts
├── package.json
└── .env                          # VITE_SUPABASE_* (not committed)
```

## Nuxt conventions used

- **`app/` directory** — Nuxt 4 app root (`app.vue`, `pages/`, etc.).
- **Composables** — Auto-imported from `app/composables/`.
- **Components** — Auto-imported from `app/components/`.
- **`~/types/cms`** — Shared TypeScript types for CMS domain objects.

## Generated / ignored

| Path | Purpose |
| ---- | ------- |
| `dist/` | Static output from `nuxt generate` |
| `.nuxt/`, `.output/` | Nuxt build cache (local) |
| `node_modules/` | Dependencies |
