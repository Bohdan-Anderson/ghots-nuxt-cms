# Directory structure

```
ghots-cms/
├── packages/nuxt-cms/            # ghots-nuxt-cms — CMS layer (editor, composables, migrations)
│   ├── app/                      # Auto-imported CMS source
│   ├── modules/nuxt-cms.ts       # Module entry (#cms/registries alias)
│   └── supabase/migrations/      # Canonical DB migrations
├── demo/                         # Reference demo site
│   ├── app/
│   │   ├── app.vue               # Root shell: CmsSidebar + <NuxtPage />
│   │   ├── pages/[...slug].vue   # Site nav + CMS page shell
│   │   ├── cms/registries.ts     # Consumer registry barrel (required)
│   │   ├── templates/            # Page layout SFCs
│   │   ├── slices/               # Slice components + registry
│   │   ├── globals/              # Global region definitions
│   │   └── composables/useTemplate.ts
│   ├── e2e/                      # Playwright specs
│   ├── public/
│   ├── supabase/                 # Migration copy (same as package)
│   ├── nuxt.config.ts            # extends ../packages/nuxt-cms
│   ├── package.json
│   └── .env                      # VITE_SUPABASE_* (not committed)
├── docs/                         # Project documentation
├── examples/minimal/             # Runnable minimal consumer app
├── package.json                  # npm workspaces; scripts delegate to demo
└── README.md
```

Login page, editor components, and CMS composables live in **`packages/nuxt-cms/app/`** (layer), not in demo.

## Nuxt conventions

- **Layer** — Demo `extends` the CMS package; composables and components merge via Nuxt layers.
- **`#cms/registries`** — Alias to `demo/app/cms/registries.ts` (template/slice/global resolvers).
- **Consumer-only `~/`** — Paths like `~/slices/registry` resolve to the demo app directory.

## Generated / ignored

| Path                           | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `demo/dist/`                   | Static output from `nuxt generate`  |
| `demo/.nuxt/`, `demo/.output/` | Nuxt build cache                    |
| `node_modules/`                | Dependencies (hoisted at repo root) |
