import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  defineNuxtModule,
  createResolver,
  installModule,
} from '@nuxt/kit'

export interface ModuleOptions {
  /** Path to consumer `registries.ts` (template/slice/global resolvers). */
  registriesPath?: string
}

/**
 * @ghots/nuxt-cms — static-first Supabase page builder for Nuxt.
 */
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@ghots/nuxt-cms',
    configKey: 'cms',
  },
  defaults: {
    registriesPath: undefined,
  },
  async setup(options, nuxt) {
    const { resolve: resolvePath } = createResolver(import.meta.url)

    const consumerRegistries =
      options.registriesPath ??
      resolve(nuxt.options.rootDir, 'app/cms/registries.ts')

    if (!existsSync(consumerRegistries)) {
      throw new Error(
        `@ghots/nuxt-cms: missing consumer registries at ${consumerRegistries}. ` +
          'Create app/cms/registries.ts — see package README.',
      )
    }

    nuxt.options.alias['#cms/registries'] = consumerRegistries

    nuxt.options.runtimeConfig.public = {
      ...nuxt.options.runtimeConfig.public,
      supabaseUrl:
        nuxt.options.runtimeConfig.public.supabaseUrl ??
        process.env.VITE_SUPABASE_URL ??
        '',
      supabaseAnonKey:
        nuxt.options.runtimeConfig.public.supabaseAnonKey ??
        process.env.VITE_SUPABASE_ANON_KEY ??
        '',
      cmsPublishWebhookUrl:
        nuxt.options.runtimeConfig.public.cmsPublishWebhookUrl ??
        process.env.CMS_PUBLISH_WEBHOOK_URL ??
        '',
    }

    await installModule(resolvePath('./localize-cms-images'))
  },
})
