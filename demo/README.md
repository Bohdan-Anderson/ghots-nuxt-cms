# Reference demo site

Working example of **@ghots/nuxt-cms** — home page, `/demo` slice showcase, sidebar, publish flow.

**Docs:** [../docs/README.md](../docs/README.md)

## Run

```bash
# From repo root
npm install
cp demo/.env.example demo/.env
npm run dev
```

Env file: **`demo/.env`**

| URL | Purpose |
| --- | ------- |
| `/` | Default template |
| `/demo` | Slices (hero, CTA, team) |
| `/login` | Editor auth |

## Site-specific code (yours in a real project)

| Path | Purpose |
| ---- | ------- |
| `app/templates/` | Page layouts |
| `app/slices/` | Slice components + registry |
| `app/globals/` | Global regions |
| `app/cms/registries.ts` | Required registry barrel |
| `app/pages/[...slug].vue` | Nav + CMS shell |

Extends [`../packages/nuxt-cms`](../packages/nuxt-cms).
