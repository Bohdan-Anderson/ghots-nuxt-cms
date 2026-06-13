# Publishing `ghots-nuxt-cms` to npm

Internal checklist for the first npm release.

## Pre-flight

From repo root:

```bash
npm run test:unit          # vitest in packages/nuxt-cms
npm run test:e2e           # optional but recommended before release
```

Dry-run the tarball:

```bash
cd packages/nuxt-cms
npm pack --dry-run
```

Confirm:

- No `*.test.ts` files in the tarball (`.npmignore` excludes them)
- `LICENSE`, `README.md`, migrations, and layer source are included
- Version in `package.json` is what you intend to ship

## Publish

```bash
cd packages/nuxt-cms
npm login                  # refresh session if publish fails with 404
npm publish --otp=123456   # replace with your authenticator code
```

Or from repo root:

```bash
npm run publish:package -- --otp=123456
```

Unscoped packages publish to your personal npm account — no org setup required.

### Troubleshooting 404 on publish

| Cause                         | Fix                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| **Version already published** | Bump version first: `npm version patch` in `packages/nuxt-cms/` (currently `0.0.1` is live on npm) |
| **Expired npm login / token** | Run `npm login`, then retry with `--otp`                                                           |
| **2FA enabled**               | Always pass `--otp=<6-digit code>` from your authenticator                                         |

Check what's live: `npm view ghots-nuxt-cms versions`

## After publish

1. ~~Add `"repository"` to `package.json` pointing at the GitHub repo.~~ → `https://github.com/Bohdan-Anderson/ghots-nuxt-cms`
2. Tag the release: `git tag ghots-nuxt-cms@0.0.2 && git push origin ghots-nuxt-cms@0.0.2`
3. Update `examples/minimal` to depend on `ghots-nuxt-cms` and use `extends: ['ghots-nuxt-cms']` in CI smoke test.
4. Bump version for the next change (`npm version patch` in `packages/nuxt-cms/`).

## Consumer install verify

In a fresh directory:

```bash
npm init -y
npm install nuxt vue ghots-nuxt-cms @supabase/supabase-js
```

Add `extends: ['ghots-nuxt-cms']`, env vars, registries, and template — should match [Getting started](../getting-started.md).

## Notes

- **npm does not allow republishing an existing version.** If `npm publish` fails with 404/403 on a version that already exists, bump the version first (`npm version patch` in `packages/nuxt-cms/`).
- `prepublishOnly` runs unit tests automatically before publish.
- Migration `007` truncates CMS data — document for upgraders (see [Supabase setup](../supabase.md)).
- Demo seed SQL in migrations `002`, `004`, `007` ships with the package; splitting to reference-only seeds is still open.
