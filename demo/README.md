# Reference demo site

Working example of **ghots-nuxt-cms** — home page, `/demo` slice showcase, sidebar, publish flow.

**Docs:** [../docs/README.md](../docs/README.md)

## Run

```bash
# From repo root
npm install
cp demo/.env.example demo/.env
npm run dev
```

Env file: **`demo/.env`**

| URL      | Purpose                  |
| -------- | ------------------------ |
| `/`      | Default template         |
| `/demo`  | Slices (hero, CTA, team) |
| `/login` | Editor auth              |

## Site-specific code (yours in a real project)

Paths below are relative to **`demo/app/`** in this repo (your Nuxt project uses the same structure under `app/`):

| Path                           | Purpose                     |
| ------------------------------ | --------------------------- |
| `demo/app/templates/`          | Page layouts                |
| `demo/app/slices/`             | Slice components + registry |
| `demo/app/globals/`            | Global regions              |
| `demo/app/cms/registries.ts`   | Required registry barrel    |
| `demo/app/pages/[...slug].vue` | Nav + CMS shell             |

Extends [`../packages/nuxt-cms`](../packages/nuxt-cms).
