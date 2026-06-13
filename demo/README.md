# Reference demo site

Working example of **ghots-nuxt-cms** — home page, `/demo` section showcase, sidebar, publish flow.

**Docs:** [../docs/README.md](../docs/README.md) · **DOM markup:** [../docs/dom-markup.md](../docs/dom-markup.md)

## Run

```bash
# From repo root
npm install
cp demo/.env.example demo/.env
npm run dev
```

Env file: **`demo/.env`**

| URL      | Purpose                         |
| -------- | ------------------------------- |
| `/`      | Default template                |
| `/demo`  | Section stack (hero, CTA, team) |
| `/login` | Editor auth                     |

## Site-specific code (yours in a real project)

Paths below are relative to **`demo/app/`** in this repo (your Nuxt project uses the same structure under `app/`):

| Path                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `demo/app/templates/`          | Page layouts (`data-type="page"`, fields)    |
| `demo/app/sections/`           | Reusable section components                  |
| `demo/app/globals/`            | Global region definitions                    |
| `demo/app/cms/registries.ts`   | Required registry barrel                     |
| `demo/app/pages/[...slug].vue` | Nav + CMS shell                              |

Each editable element uses **`data-name`**, **`data-type`**, and **`:data-id`**. See [`HeroSection.vue`](app/sections/HeroSection.vue) for a minimal section example.

Extends [`../packages/nuxt-cms`](../packages/nuxt-cms).
