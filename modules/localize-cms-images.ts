import { resolve } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import { localizeCmsImagesInDist } from '../server/utils/localizeCmsImages'

/**
 * After prerender (`nuxt generate`), downloads cms-media images into `dist/`
 * and rewrites HTML + payload URLs to local paths.
 *
 * Uses Nitro's `prerender:done` hook — see Nuxt prerendering docs.
 */
export default defineNuxtModule({
  meta: {
    name: 'localize-cms-images',
  },
  setup(_options, nuxt) {
    nuxt.hooks.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('prerender:done', async () => {
        const publicDir = nitro.options.output.publicDir ?? 'dist'
        const distDir = resolve(nuxt.options.rootDir, publicDir)
        await localizeCmsImagesInDist(distDir)
      })
    })
  },
})
